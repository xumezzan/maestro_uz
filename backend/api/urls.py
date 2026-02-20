from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SpecialistViewSet, AdminSpecialistViewSet, TaskViewSet, TaskResponseViewSet, MessageViewSet, AIAnalyzeView, GenerateDescriptionView, ReviewViewSet
from .auth_views import (
    RegisterView, VerifyEmailView, ResendVerificationView,
    LoginView, LogoutView, ForgotPasswordView, ResetPasswordView,
    MeView, CustomTokenRefreshView,
)

router = DefaultRouter()
router.register(r'specialists', SpecialistViewSet)
router.register(r'admin/specialists', AdminSpecialistViewSet, basename='admin-specialist')
router.register(r'tasks', TaskViewSet)
router.register(r'responses', TaskResponseViewSet, basename='task-response')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = [
    path('', include(router.urls)),
    path('ai/analyze/', AIAnalyzeView.as_view(), name='ai-analyze'),
    path('ai/generate-description/', GenerateDescriptionView.as_view(), name='ai-generate-description'),
    # === Auth endpoints ===
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/verify-email/', VerifyEmailView.as_view(), name='auth-verify-email'),
    path('auth/resend-verification/', ResendVerificationView.as_view(), name='auth-resend-verification'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/refresh/', CustomTokenRefreshView.as_view(), name='auth-refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),
    path('auth/me/', MeView.as_view(), name='auth-me'),
]
