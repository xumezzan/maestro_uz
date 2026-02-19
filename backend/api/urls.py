from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SpecialistViewSet, TaskViewSet, TaskResponseViewSet, MessageViewSet, AIAnalyzeView, GenerateDescriptionView
from .auth_views import RegisterView, MeView

router = DefaultRouter()
router.register(r'specialists', SpecialistViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'responses', TaskResponseViewSet, basename='task-response')
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = [
    path('', include(router.urls)),
    path('ai/analyze/', AIAnalyzeView.as_view(), name='ai-analyze'),
    path('ai/generate-description/', GenerateDescriptionView.as_view(), name='ai-generate-description'),
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/me/', MeView.as_view(), name='auth-me'),
]
