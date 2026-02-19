from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SpecialistViewSet, TaskViewSet, AIAnalyzeView, GenerateDescriptionView

router = DefaultRouter()
router.register(r'specialists', SpecialistViewSet)
router.register(r'tasks', TaskViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('ai/analyze/', AIAnalyzeView.as_view(), name='ai-analyze'),
    path('ai/generate-description/', GenerateDescriptionView.as_view(), name='ai-generate-description'),
]
