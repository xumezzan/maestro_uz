import os
import json
import google.generativeai as genai
from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from .models import SpecialistProfile, Task, TaskResponse, User
from .serializers import SpecialistProfileSerializer, TaskSerializer, TaskResponseSerializer

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") 
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class SpecialistViewSet(viewsets.ModelViewSet):
    queryset = SpecialistProfile.objects.all()
    serializer_class = SpecialistProfileSerializer
    permission_classes = [permissions.AllowAny] # Changed to AllowAny for demo

    def perform_create(self, serializer):
        # In a real app, we would create a User first via auth endpoints.
        # Here we assume the frontend sends user details or we create a dummy user.
        # For simplicity in this "clone" demo, we check if a user exists or create a temp one.
        email = self.request.data.get('email', f"user_{status.HTTP_200_OK}@example.com")
        username = email.split('@')[0]
        
        user, created = User.objects.get_or_create(username=username, defaults={'email': email})
        serializer.save(user=user)

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('-created_at')
    serializer_class = TaskSerializer
    permission_classes = [permissions.AllowAny] # Changed to AllowAny for demo

    def perform_create(self, serializer):
        # If user is anonymous (frontend mock login), assign to a Demo Client
        if self.request.user.is_authenticated:
            serializer.save(client=self.request.user)
        else:
            demo_user, _ = User.objects.get_or_create(username='demo_client', defaults={'first_name': 'Demo', 'last_name': 'Client'})
            serializer.save(client=demo_user)

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
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            prompt = f"""
            You are an AI assistant for a service marketplace in Uzbekistan (Maestro).
            Analyze the following user request: "{user_query}"

            Return ONLY a valid JSON object with the following fields:
            - category: (String) One of [Ремонт, Репетиторы, Уборка, IT и фриланс, Красота, Перевозки, Бухгалтеры и юристы, Спорт, Домашний персонал, Артисты, Другое]
            - suggestedTitle: (String) A short, professional title for the task.
            - suggestedDescription: (String) An improved, professional description.
            - estimatedPriceRange: (String) e.g. "100 000 - 200 000 UZS".
            - relevantTags: (Array of Strings) e.g. ["Сантехника", "Кран"].
            - location: (String or null) Extracted city/district if present, else null.
            
            Do not include markdown formatting like ```json.
            """

            response = model.generate_content(prompt)
            clean_text = response.text.replace('```json', '').replace('```', '').strip()
            data = json.loads(clean_text)
            
            return Response(data)

        except Exception as e:
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
