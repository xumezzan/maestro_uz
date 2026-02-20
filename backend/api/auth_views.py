from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
import random
from .serializers import RegisterSerializer, UserSerializer
from .models import EmailVerification

User = get_user_model()

def generate_otp():
    return str(random.randint(100000, 999999))

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate OPT and save to DB
        otp_code = generate_otp()
        EmailVerification.objects.create(user=user, code=otp_code)
        
        raw_password = getattr(user, '_raw_password', '')
        
        # Send Email
        subject = 'Подтверждение регистрации на Maestro'
        message = f'''Добро пожаловать на Maestro!
        
Ваши данные для входа:
Email: {user.email}
Пароль: {raw_password}

Для завершения регистрации и активации аккаунта, введите следующий код на сайте:
{otp_code}

Никому не сообщайте этот код!'''

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

        headers = self.get_success_headers(serializer.data)
        return Response({
            "message": "Регистрация успешна. Код подтверждения отправлен на email.",
            "email": user.email
        }, status=status.HTTP_201_CREATED, headers=headers)

class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        
        if not email or not code:
            return Response({"error": "Email и код обязательны."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
            verification = EmailVerification.objects.get(user=user)
            
            if verification.code == code:
                user.is_active = True
                user.save()
                verification.delete()  # Remove code after successful use
                
                # Generate tokens
                refresh = RefreshToken.for_user(user)
                return Response({
                    "message": "Email успешно подтвержден.",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                }, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Неверный код."}, status=status.HTTP_400_BAD_REQUEST)
                
        except (User.DoesNotExist, EmailVerification.DoesNotExist):
            return Response({"error": "Пользователь не найден или код недействителен."}, status=status.HTTP_404_NOT_FOUND)

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
