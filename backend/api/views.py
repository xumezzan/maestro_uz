import os
import json
import google.generativeai as genai
from rest_framework import viewsets, status, permissions, serializers
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from django.db.models import Q
from .models import SpecialistProfile, Task, TaskResponse, User, Message
from .serializers import SpecialistProfileSerializer, TaskSerializer, TaskResponseSerializer, MessageSerializer

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") 
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class AdminSpecialistViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin endpoint to review and verify specialist profiles.
    """
    serializer_class = SpecialistProfileSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        # By default, Admins want to see unverified profiles that HAVE uploaded a passport.
        return SpecialistProfile.objects.filter(is_verified=False).exclude(passport_image='')

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        specialist = self.get_object()
        specialist.is_verified = True
        specialist.save(update_fields=['is_verified'])
        return Response({"status": "verified"})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        specialist = self.get_object()
        specialist.is_verified = False
        # Currently, rejecting means we might want them to re-upload.
        # We can clear the passport image to prompt a re-upload, or just leave it False.
        # For now, let's clear the image so it drops out of the pending queue.
        specialist.passport_image = None
        specialist.save(update_fields=['is_verified', 'passport_image'])
        return Response({"status": "rejected"})

class SpecialistViewSet(viewsets.ModelViewSet):
    queryset = SpecialistProfile.objects.all()
    serializer_class = SpecialistProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        # User must be authenticated to create a profile (and effectively become a specialist)
        # In this flow, we assume the user registers first, then creates a profile
        if hasattr(self.request.user, 'specialist_profile'):
             # Already has a profile
             return 
        
        serializer.save(user=self.request.user)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('-created_at')
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)


class TaskResponseViewSet(viewsets.ModelViewSet):
    serializer_class = TaskResponseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'client':
            # Clients see responses to THEIR tasks
            return TaskResponse.objects.filter(task__client=user)
        elif hasattr(user, 'specialist_profile'):
            # Specialists see responses THEY made
            return TaskResponse.objects.filter(specialist=user.specialist_profile)
        return TaskResponse.objects.none()

    def perform_create(self, serializer):
        # Create response as the current specialist
        if not hasattr(self.request.user, 'specialist_profile'):
             raise serializers.ValidationError("Only specialists can respond to tasks.")
             
        specialist = self.request.user.specialist_profile
        
        # Free vs Paid business logic logic goes here
        RESPONSE_FEE = 5000 # 5,000 UZS
        
        if specialist.balance < RESPONSE_FEE:
            raise serializers.ValidationError({"error": "INSUFFICIENT_FUNDS", "message": "Недостаточно средств. Пожалуйста, пополните баланс."})
            
        # Deduct balance
        specialist.balance -= RESPONSE_FEE
        specialist.save(update_fields=['balance'])
        
        from .models import Transaction
        Transaction.objects.create(
            user=self.request.user,
            amount=RESPONSE_FEE,
            transaction_type=Transaction.Type.RESPONSE_FEE,
            status=Transaction.Status.SUCCESS,
            description="Оплата за отклик на задание"
        )
        
        response_obj = serializer.save(specialist=specialist)
        
        # Trigger async email notification
        from .tasks import send_notification_email
        client_email = response_obj.task.client.email
        if client_email:
            send_notification_email.delay(
                subject=f"Новый отклик на ваше задание: {response_obj.task.title}",
                message=f"Здравствуйте!\n\nСпециалист {specialist.user.get_full_name()} откликнулся на ваше задание '{response_obj.task.title}'.\n\nЕго цена: {response_obj.price} UZS\nСообщение: {response_obj.message}\n\nЗайдите в личный кабинет, чтобы ответить.",
                recipient_list=[client_email]
            )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def accept(self, request, pk=None):
        response = self.get_object()
        task = response.task
        
        # Check permissions: Only the client who created the task can accept
        if task.client != request.user:
            return Response({"error": "You are not the owner of this task"}, status=403)
            
        task.assigned_specialist = response.specialist
        task.status = Task.Status.IN_PROGRESS # Set to in progress
        task.save()
        
        return Response({"status": "accepted", "task_id": task.id})


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # User sees messages sent BY them or TO them
        user = self.request.user
        return Message.objects.filter(Q(sender=user) | Q(receiver=user)).order_by('created_at')

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


class AIAnalyzeView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        if not GEMINI_API_KEY:
            # Mock response if API key is missing to prevent crash
            return Response({
                "category": "Другое",
                "suggestedTitle": "Новая задача",
                "suggestedDescription": request.data.get('query', ''),
                "estimatedPriceRange": "По договоренности",
                "relevantTags": ["Услуга"],
                "location": "Ташкент"
            })

        user_query = request.data.get('query', '')
        if not user_query:
            return Response({"error": "Query is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Use the newer google.genai client
            from google import genai
            from google.genai import types
            from pydantic import BaseModel
            
            client = genai.Client(api_key=GEMINI_API_KEY)
            
            # Define schema to guarantee JSON response matches UI
            class TaskAnalysis(BaseModel):
                category: str
                suggestedTitle: str
                suggestedDescription: str
                estimatedPriceRange: str
                relevantTags: list[str]
                location: str | None = None

            prompt = f"""
            You are an AI assistant for a service marketplace in Uzbekistan (Maestro).
            Analyze the following user request: "{user_query}"

            Provide appropriate values for:
            - category: One of [Ремонт, Репетиторы, Уборка, IT и фриланс, Красота, Перевозки, Бухгалтеры и юристы, Спорт, Домашний персонал, Артисты, Другое]
            - suggestedTitle: A short, professional title for the task.
            - suggestedDescription: An improved, professional description out of the user's raw text.
            - estimatedPriceRange: e.g. "100 000 - 200 000 UZS".
            - relevantTags: List of strings e.g. ["Сантехника", "Кран"].
            - location: Extracted city/district if present, else null.
            """

            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=TaskAnalysis,
                    temperature=0.4,
                ),
            )
            
            data = json.loads(response.text)
            return Response(data)

        except Exception as e:
            import traceback
            traceback.print_exc()
            # Fallback on error
            return Response({
                "category": "Другое",
                "suggestedTitle": "Задача (AI Error)",
                "suggestedDescription": user_query,
                "estimatedPriceRange": "По договоренности",
                "relevantTags": [],
                "location": "Ташкент"
            })

class GenerateDescriptionView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not GEMINI_API_KEY:
             return Response({"description": request.data.get('description', '')})
            
        title = request.data.get('title', '')
        original_desc = request.data.get('description', '')
        
        prompt = f"""
        Rewrite this task description for a specialist marketplace to be professional and clear.
        Title: {title}
        Draft: {original_desc}
        Return only the raw text.
        """
        
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            return Response({"description": response.text.strip()})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
