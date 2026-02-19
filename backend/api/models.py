from django.db import models
from django.contrib.auth.models import AbstractUser

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
    rating = models.FloatField(default=5.0)
    reviews_count = models.IntegerField(default=0)
    price_start = models.DecimalField(max_digits=12, decimal_places=0)
    description = models.TextField()
    is_verified = models.BooleanField(default=False)
    tags = models.JSONField(default=list)  # Stores list of strings: ['Сантехник', 'Трубы']
    passport_image = models.ImageField(upload_to='specialist_documents/', blank=True, null=True)
    profile_image = models.ImageField(upload_to='specialist_avatars/', blank=True, null=True)
    telegram = models.CharField(max_length=100, blank=True)
    instagram = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.category}"

class Task(models.Model):
    class Status(models.TextChoices):
        OPEN = 'OPEN', 'В поиске'
        IN_PROGRESS = 'IN_PROGRESS', 'В работе'
        COMPLETED = 'COMPLETED', 'Завершен'
        CANCELED = 'CANCELED', 'Отменен'

    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
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
