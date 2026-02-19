from django.core.management.base import BaseCommand
from api.models import User, SpecialistProfile, ServiceCategory
import random

class Command(BaseCommand):
    help = 'Seeds the database with initial specialist data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')
        
        # MOCK DATA taken from constants.ts logic
        specialists_data = [
            {
                "name": "Елена Ким",
                "category": "Репетиторы",
                "rating": 5.0,
                "price_start": 80000,
                "description": "Репетитор по английскому языку (IELTS 8.5). Готовлю к поступлению в Вестминстер и ИНХА.",
                "tags": ["Английский", "IELTS", "Математика"],
                "avatar_url": "https://images.unsplash.com/photo-1544717305-2782549b5136?fit=crop&w=200&h=200"
            },
            {
                "name": "Фируз Чулибоев",
                "category": "Ремонт",
                "rating": 5.0,
                "price_start": 75000,
                "description": "Опытный сантехник. Монтаж полипропиленовых труб, установка душевых кабин, ремонт смесителей.",
                "tags": ["Сантехник", "Трубы", "Ремонт"],
                "avatar_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?fit=crop&w=200&h=200"
            },
            {
                "name": "Алишер Усманов",
                "category": "Ремонт",
                "rating": 4.9,
                "price_start": 100000,
                "description": "Мастер универсал. Сантехника, электрика, сборка мебели. Опыт 10 лет.",
                "tags": ["Сантехник", "Электрик", "Сборка мебели"],
                "avatar_url": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?fit=crop&w=200&h=200"
            },
            {
                "name": "Мадина Садыкова",
                "category": "Красота",
                "rating": 4.9,
                "price_start": 120000,
                "description": "Визажист, стилист по прическам. Свадебный образ, вечерний макияж.",
                "tags": ["Макияж", "Прически", "Свадьба"],
                "avatar_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?fit=crop&w=200&h=200"
            },
            {
                "name": "Джамшид Алиев",
                "category": "IT и фриланс",
                "rating": 4.8,
                "price_start": 150000,
                "description": "Разработка сайтов, настройка рекламы в Instagram и Telegram. Создание лендингов.",
                "tags": ["Сайты", "SMM", "Таргет"],
                "avatar_url": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?fit=crop&w=200&h=200"
            }
        ]

        count = 0
        for data in specialists_data:
            # Create User
            username = data['name'].lower().replace(' ', '_')
            email = f"{username}@example.com"
            
            if User.objects.filter(username=username).exists():
                continue

            user = User.objects.create_user(
                username=username,
                email=email,
                password='password123',
                first_name=data['name'].split()[0],
                last_name=data['name'].split()[1] if len(data['name'].split()) > 1 else '',
                role='SPECIALIST',
                avatar_url=data['avatar_url'],
                location='Ташкент'
            )

            # Create Profile
            SpecialistProfile.objects.create(
                user=user,
                category=data['category'],
                rating=data['rating'],
                reviews_count=random.randint(10, 100),
                price_start=data['price_start'],
                description=data['description'],
                tags=data['tags'],
                is_verified=True
            )
            count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {count} specialists'))
