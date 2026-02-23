import os
import json
import logging
from rest_framework import viewsets, status, permissions, serializers
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.throttling import ScopedRateThrottle
from django.conf import settings
from django.db.models import Q
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import SpecialistProfile, Task, TaskResponse, User, Message, Review
from .serializers import SpecialistProfileSerializer, TaskSerializer, TaskResponseSerializer, MessageSerializer, ReviewSerializer
from .permissions import IsSpecialistProfileOwnerOrAdmin, IsTaskOwnerOrAdmin
from .chat_rules import is_task_chat_pair_allowed

# Configure Gemini API Key (used by AIAnalyzeView and GenerateDescriptionView)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
logger = logging.getLogger(__name__)

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

    def get_permissions(self):
        if self.action in ['create', 'my_stats']:
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsSpecialistProfileOwnerOrAdmin()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        if hasattr(self.request.user, 'specialist_profile'):
            raise serializers.ValidationError("Профиль специалиста уже создан.")
        if self.request.user.role != User.Role.SPECIALIST:
            raise serializers.ValidationError("Только специалисты могут создать профиль специалиста.")
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='my-stats')
    def my_stats(self, request):
        """Analytics KPIs for the currently logged-in specialist."""
        try:
            profile = request.user.specialist_profile
        except SpecialistProfile.DoesNotExist:
            return Response({'error': 'No specialist profile found.'}, status=status.HTTP_404_NOT_FOUND)

        from django.db.models import Sum, Avg
        from .models import Transaction

        # Earnings: all successful TOP_UP transactions for this specialist's user
        earnings_qs = Transaction.objects.filter(
            user=request.user,
            transaction_type=Transaction.Type.TOP_UP,
            status=Transaction.Status.SUCCESS
        )
        total_earnings = earnings_qs.aggregate(total=Sum('amount'))['total'] or 0

        # Responses
        all_responses = TaskResponse.objects.filter(specialist=profile)
        total_responses = all_responses.count()
        accepted = all_responses.filter(task__assigned_specialist=profile).count()
        conversion = round((accepted / total_responses * 100), 1) if total_responses > 0 else 0.0

        # Recent reviews (last 3)
        recent_reviews = profile.reviews.order_by('-created_at')[:3]
        recent_reviews_data = [
            {
                'author': r.author.get_full_name() or r.author.username,
                'score_overall': r.score_overall,
                'text': r.text,
                'created_at': r.created_at.strftime('%d.%m.%Y'),
            }
            for r in recent_reviews
        ]

        return Response({
            'balance': float(profile.balance),
            'total_earnings': float(total_earnings),
            'total_responses': total_responses,
            'accepted_responses': accepted,
            'conversion_rate': conversion,
            'rating': float(profile.rating),
            'reviews_count': profile.reviews_count,
            'recent_reviews': recent_reviews_data,
        })


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('-created_at')
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsTaskOwnerOrAdmin()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        if self.request.user.role != User.Role.CLIENT:
            raise serializers.ValidationError("Только заказчики могут создавать задания.")
        serializer.save(client=self.request.user)


class TaskResponseViewSet(viewsets.ModelViewSet):
    serializer_class = TaskResponseSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CLIENT':
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
        task = serializer.validated_data.get('task')

        if task.client_id == self.request.user.id:
            raise serializers.ValidationError("Нельзя откликаться на собственное задание.")
        if task.status != Task.Status.OPEN:
            raise serializers.ValidationError("Можно откликаться только на открытые задания.")
        if TaskResponse.objects.filter(task=task, specialist=specialist).exists():
            raise serializers.ValidationError("Вы уже откликались на это задание.")
        
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
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        # User sees messages sent BY them or TO them
        user = self.request.user
        return Message.objects.filter(Q(sender=user) | Q(receiver=user)).order_by('created_at')

    def get_throttles(self):
        if self.action == 'create':
            self.throttle_scope = 'chat_http_send'
            return [ScopedRateThrottle()]
        return []

    def _broadcast_message(self, msg: Message):
        """Push a saved message to both participants via personal WS groups."""
        channel_layer = get_channel_layer()
        if not channel_layer:
            return

        payload = {
            'id': msg.id,
            'sender_id': msg.sender_id,
            'receiver_id': msg.receiver_id,
            'task_id': msg.task_id,
            'text': msg.text or '',
            'image': msg.image.url if msg.image else None,
            'created_at': msg.created_at.isoformat(),
        }

        try:
            async_to_sync(channel_layer.group_send)(
                f"user_{msg.receiver_id}",
                {'type': 'chat_message', 'message': payload}
            )
            async_to_sync(channel_layer.group_send)(
                f"user_{msg.sender_id}",
                {'type': 'chat_message', 'message': payload}
            )
        except Exception:
            logger.exception("Failed to broadcast chat message %s", msg.id)

    def perform_create(self, serializer):
        receiver = serializer.validated_data.get('receiver')
        task = serializer.validated_data.get('task')
        text = (serializer.validated_data.get('text') or '').strip()
        image = serializer.validated_data.get('image')

        if not receiver:
            raise serializers.ValidationError("Получатель обязателен.")
        if receiver.id == self.request.user.id:
            raise serializers.ValidationError("Нельзя отправлять сообщение самому себе.")
        if not text and not image:
            raise serializers.ValidationError("Сообщение должно содержать текст или изображение.")
        if task and not is_task_chat_pair_allowed(task, self.request.user.id, receiver.id):
            raise serializers.ValidationError(
                "Для этого задания чат доступен только между заказчиком и откликнувшимся специалистом."
            )

        msg = serializer.save(sender=self.request.user)
        self._broadcast_message(msg)

    def perform_update(self, serializer):
        msg = self.get_object()

        if msg.receiver_id != self.request.user.id and not self.request.user.is_staff:
            raise PermissionDenied("Только получатель может изменять статус прочтения.")

        allowed_fields = {'is_read'}
        updated_fields = set(serializer.validated_data.keys())
        if not updated_fields.issubset(allowed_fields):
            raise serializers.ValidationError("Можно обновлять только поле is_read.")

        serializer.save()


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
            from google import genai
            client = genai.Client(api_key=GEMINI_API_KEY)
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=prompt
            )
            return Response({"description": response.text.strip()})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        specialist_id = self.request.query_params.get('specialist')
        if specialist_id:
            return Review.objects.filter(specialist_id=specialist_id).order_by('-created_at')
        return Review.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        # Only clients can write reviews
        if self.request.user.role != 'CLIENT':
            from rest_framework import serializers as drf_serializers
            raise drf_serializers.ValidationError("Только клиенты могут оставлять отзывы.")
        serializer.save(author=self.request.user)
