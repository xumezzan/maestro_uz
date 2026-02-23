import logging
import random

from django.contrib.auth import get_user_model, authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import ScopedRateThrottle

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError

from .models import EmailVerification, PasswordResetToken
from .serializers import (
    RegisterSerializer, UserSerializer, LoginSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer,
    UserProfileUpdateSerializer,
)

User = get_user_model()
logger = logging.getLogger(__name__)


def generate_otp():
    """Generate a 6-digit OTP code."""
    return str(random.randint(100000, 999999))


def get_tokens_for_user(user):
    """Generate access and refresh tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


# ============================================================================
# REGISTER
# ============================================================================
class RegisterView(APIView):
    """
    POST /api/auth/register/
    Creates inactive user, sends 6-digit OTP to email.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_register'

    def post(self, request):
        email = request.data.get('email')
        user_instance = None
        
        if email:
            try:
                existing_user = User.objects.get(email=email)
                if not existing_user.is_active:
                    user_instance = existing_user
            except User.DoesNotExist:
                pass

        if user_instance:
            serializer = RegisterSerializer(user_instance, data=request.data)
        else:
            serializer = RegisterSerializer(data=request.data)
            
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Delete any old OTPs for this user
        EmailVerification.objects.filter(user=user).delete()

        # Generate OTP and save
        otp_code = generate_otp()
        EmailVerification.objects.create(
            user=user,
            code=otp_code,
            expires_at=timezone.now() + timezone.timedelta(minutes=10),
        )

        # Send verification email (NO password in email)
        subject = 'Подтверждение регистрации на Maestro'
        message = (
            f'Добро пожаловать на Maestro!\n\n'
            f'Для завершения регистрации введите код подтверждения:\n'
            f'{otp_code}\n\n'
            f'Код действителен 10 минут.\n'
            f'Никому не сообщайте этот код!'
        )

        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error("Failed to send verification email for user %s", user.email)
            # Don't expose SMTP details to client

        return Response({
            "message": "Регистрация успешна. Код подтверждения отправлен на email.",
            "email": user.email,
        }, status=status.HTTP_201_CREATED)


# ============================================================================
# VERIFY EMAIL
# ============================================================================
class VerifyEmailView(APIView):
    """
    POST /api/auth/verify-email/
    Activates user account if OTP is valid and not expired.
    Returns access + refresh tokens.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_verify_email'

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')

        if not email or not code:
            return Response(
                {"error": "Email и код обязательны."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
            verification = EmailVerification.objects.get(user=user)

            if verification.is_expired():
                verification.delete()
                return Response(
                    {"error": "Код истёк. Запросите новый."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if verification.code == code:
                user.is_active = True
                user.save()
                verification.delete()

                tokens = get_tokens_for_user(user)
                user_data = UserSerializer(user).data

                return Response({
                    "message": "Email успешно подтверждён.",
                    **tokens,
                    "user": user_data,
                }, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": "Неверный код."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except (User.DoesNotExist, EmailVerification.DoesNotExist):
            return Response(
                {"error": "Пользователь не найден или код недействителен."},
                status=status.HTTP_404_NOT_FOUND,
            )


# ============================================================================
# RESEND VERIFICATION
# ============================================================================
class ResendVerificationView(APIView):
    """
    POST /api/auth/resend-verification/
    Re-sends OTP for email verification. Rate limited.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_resend_verification'

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response(
                {"error": "Email обязателен."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email, is_active=False)
        except User.DoesNotExist:
            # Anti-enumeration: don't reveal if user exists
            return Response(
                {"message": "Если аккаунт существует, код отправлен."},
                status=status.HTTP_200_OK,
            )

        # Delete old verification
        EmailVerification.objects.filter(user=user).delete()

        otp_code = generate_otp()
        EmailVerification.objects.create(
            user=user,
            code=otp_code,
            expires_at=timezone.now() + timezone.timedelta(minutes=10),
        )

        try:
            send_mail(
                'Повторный код подтверждения — Maestro',
                f'Ваш новый код подтверждения: {otp_code}\n\nКод действителен 10 минут.',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception:
            logger.error("Failed to resend verification email for %s", user.email)

        return Response(
            {"message": "Если аккаунт существует, код отправлен."},
            status=status.HTTP_200_OK,
        )


# ============================================================================
# LOGIN
# ============================================================================
class LoginView(APIView):
    """
    POST /api/auth/login/
    Authenticates with email+password, returns tokens + user profile.
    Only works if user is active (email verified).
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_login'

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        # Find user by email to get username (Django auth uses username)
        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "Неверный email или пароль."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user_obj.is_active:
            allow_debug_inactive_login = (
                settings.DEBUG and getattr(settings, 'ALLOW_DEBUG_INACTIVE_LOGIN', True)
            )
            if allow_debug_inactive_login:
                user_obj.is_active = True
                user_obj.save(update_fields=['is_active'])
                logger.warning(
                    "Auto-activating inactive user %s in DEBUG mode for local login flow.",
                    user_obj.email,
                )
            else:
                return Response(
                    {"error": "Email не подтверждён. Проверьте почту."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        user = authenticate(request, username=user_obj.username, password=password)

        if user is None:
            return Response(
                {"error": "Неверный email или пароль."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        tokens = get_tokens_for_user(user)
        user_data = UserSerializer(user).data

        return Response({
            **tokens,
            "user": user_data,
        }, status=status.HTTP_200_OK)


# ============================================================================
# REFRESH (uses simplejwt's built-in view — rotation enabled in settings)
# ============================================================================
class CustomTokenRefreshView(TokenRefreshView):
    """
    POST /api/auth/refresh/
    Returns new access token (+ new refresh token due to rotation).
    Old refresh token is blacklisted automatically.
    """
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_refresh'


# ============================================================================
# LOGOUT
# ============================================================================
class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Blacklists the refresh token so it can't be reused.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {"error": "Refresh token обязателен."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response(
                {"error": "Токен недействителен или уже был отозван."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"message": "Вы успешно вышли."},
            status=status.HTTP_200_OK,
        )


# ============================================================================
# FORGOT PASSWORD
# ============================================================================
class ForgotPasswordView(APIView):
    """
    POST /api/auth/forgot-password/
    Always returns success (anti-enumeration).
    Sends reset link with UUID token if user exists.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_forgot_password'

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        # Always the same response
        response_msg = "Если аккаунт с таким email существует, мы отправили инструкции по сбросу пароля."

        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response({"message": response_msg}, status=status.HTTP_200_OK)

        # Invalidate previous reset tokens
        PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)

        # Create new token
        reset_obj = PasswordResetToken.objects.create(
            user=user,
            expires_at=timezone.now() + timezone.timedelta(hours=1),
        )

        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        reset_link = f"{frontend_url}/#/reset-password?token={reset_obj.token}"

        try:
            send_mail(
                'Сброс пароля — Maestro',
                f'Для сброса пароля перейдите по ссылке:\n\n{reset_link}\n\n'
                f'Ссылка действительна 1 час.\n'
                f'Если вы не запрашивали сброс пароля, проигнорируйте это письмо.',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception:
            logger.error("Failed to send password reset email for %s", user.email)

        return Response({"message": response_msg}, status=status.HTTP_200_OK)


# ============================================================================
# RESET PASSWORD
# ============================================================================
class ResetPasswordView(APIView):
    """
    POST /api/auth/reset-password/
    Validates token, sets new password.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_reset_password'

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token_uuid = serializer.validated_data['token']
        new_password = serializer.validated_data['password']

        try:
            reset_token = PasswordResetToken.objects.get(token=token_uuid, is_used=False)
        except PasswordResetToken.DoesNotExist:
            return Response(
                {"error": "Ссылка для сброса пароля недействительна."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if reset_token.is_expired():
            reset_token.is_used = True
            reset_token.save()
            return Response(
                {"error": "Ссылка для сброса пароля истекла."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = reset_token.user
        user.set_password(new_password)
        user.save()

        # Mark token as used
        reset_token.is_used = True
        reset_token.save()

        # Blacklist all existing refresh tokens for this user (force re-login)
        # This is done by simplejwt's OutstandingToken model
        try:
            from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
            for outstanding in OutstandingToken.objects.filter(user=user):
                BlacklistedToken.objects.get_or_create(token=outstanding)
        except Exception:
            pass  # If blacklist tables don't exist yet, skip

        return Response(
            {"message": "Пароль успешно изменён. Войдите с новым паролем."},
            status=status.HTTP_200_OK,
        )


# ============================================================================
# ME (profile)
# ============================================================================
class MeView(APIView):
    """
    GET  /api/auth/me/  — return current user profile
    PUT  /api/auth/me/  — update profile fields
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)
