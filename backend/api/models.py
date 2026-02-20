import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta


class User(AbstractUser):
    class Role(models.TextChoices):
        CLIENT = 'CLIENT', 'Client'
        SPECIALIST = 'SPECIALIST', 'Specialist'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CLIENT)
    avatar_url = models.URLField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    location = models.CharField(max_length=100, default='Ташкент')
    favorites = models.ManyToManyField('self', blank=True, symmetrical=False)

    def __str__(self):
        return self.username


class EmailVerification(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='email_verification')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"{self.user.email} - {self.code}"


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=1)
        super().save(*args, **kwargs)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Reset for {self.user.email} - used={self.is_used}"


class ServiceCategory(models.TextChoices):
    REPAIR = 'Ремонт', 'Ремонт'
    TUTORS = 'Репетиторы', 'Репетиторы'
    CLEANING = 'Уборка', 'Уборка'
    IT = 'IT и фриланс', 'IT и фриланс'
    BEAUTY = 'Красота', 'Красота'
    TRANSPORT = 'Перевозки', 'Перевозки'
    FINANCE = 'Бухгалтеры и юристы', 'Бухгалтеры и юристы'
    SPORT = 'Спорт', 'Спорт'
    DOMESTIC = 'Домашний персонал', 'Домашний персонал'
    EVENTS = 'Артисты', 'Артисты'
    OTHER = 'Другое', 'Другое'

class SpecialistProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='specialist_profile')
    category = models.CharField(max_length=50, choices=ServiceCategory.choices)
    rating = models.FloatField(default=0.0)
    reviews_count = models.IntegerField(default=0)
    price_start = models.DecimalField(max_digits=12, decimal_places=0)
    description = models.TextField()
    is_verified = models.BooleanField(default=False)
    tags = models.JSONField(default=list)  # Stores list of strings: ['Сантехник', 'Трубы']
    passport_image = models.ImageField(upload_to='specialist_documents/', blank=True, null=True)
    profile_image = models.ImageField(upload_to='specialist_avatars/', blank=True, null=True)
    telegram = models.CharField(max_length=100, blank=True)
    instagram = models.CharField(max_length=100, blank=True)
    balance = models.DecimalField(max_digits=12, decimal_places=0, default=0) # UZS

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.category}"

class Transaction(models.Model):
    class Type(models.TextChoices):
        TOP_UP = 'TOP_UP', 'Пополнение баланса'
        RESPONSE_FEE = 'RESPONSE_FEE', 'Плата за отклик'
        DEAL_FEE = 'DEAL_FEE', 'Комиссия за сделку'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Ожидает'
        SUCCESS = 'SUCCESS', 'Успешно'
        FAILED = 'FAILED', 'Ошибка'
        CANCELED = 'CANCELED', 'Отменен'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=0) # UZS
    transaction_type = models.CharField(max_length=20, choices=Type.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    description = models.CharField(max_length=255, blank=True)

    # For payment gateways (Payme/Click)
    gateway_transaction_id = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.user.email} - {self.transaction_type} - {self.amount} UZS"

class Task(models.Model):
    class Status(models.TextChoices):
        OPEN = 'OPEN', 'В поиске'
        IN_PROGRESS = 'IN_PROGRESS', 'В работе'
        COMPLETED = 'COMPLETED', 'Завершен'
        CANCELED = 'CANCELED', 'Отменен'

    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    assigned_specialist = models.ForeignKey(SpecialistProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=ServiceCategory.choices)
    budget = models.CharField(max_length=100)  # e.g. "100 000 UZS"
    location = models.CharField(max_length=255)
    date_info = models.CharField(max_length=100)  # e.g. "Завтра в 14:00"
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class TaskResponse(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='responses')
    specialist = models.ForeignKey(SpecialistProfile, on_delete=models.CASCADE)
    message = models.TextField()
    price = models.DecimalField(max_digits=12, decimal_places=0)
    created_at = models.DateTimeField(auto_now_add=True)

class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    task = models.ForeignKey(Task, on_delete=models.SET_NULL, null=True, blank=True, related_name='messages')
    text = models.TextField(blank=True)
    image = models.ImageField(upload_to='message_images/', blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"From {self.sender} to {self.receiver}: {self.text[:20]}"
