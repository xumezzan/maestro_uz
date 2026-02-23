from django.core.management.base import BaseCommand
from django.db.models import Q

from api.models import Message, SpecialistProfile, Task, TaskResponse, User


CLIENT_EMAIL = "e2e.client@maestro.test"
SPECIALIST_EMAIL = "e2e.specialist@maestro.test"
DEFAULT_PASSWORD = "Password123!"


class Command(BaseCommand):
    help = "Create deterministic users for browser E2E tests and reset their data."

    def handle(self, *args, **kwargs):
        client = self._upsert_user(
            email=CLIENT_EMAIL,
            username="e2e_client",
            first_name="E2E",
            last_name="Client",
            role=User.Role.CLIENT,
        )
        specialist = self._upsert_user(
            email=SPECIALIST_EMAIL,
            username="e2e_specialist",
            first_name="E2E",
            last_name="Specialist",
            role=User.Role.SPECIALIST,
        )

        self._reset_test_data(client, specialist)
        self._upsert_specialist_profile(specialist)

        self.stdout.write(self.style.SUCCESS("E2E users are ready"))
        self.stdout.write(
            f"Client: {CLIENT_EMAIL} / {DEFAULT_PASSWORD}\n"
            f"Specialist: {SPECIALIST_EMAIL} / {DEFAULT_PASSWORD}"
        )

    def _upsert_user(self, *, email: str, username: str, first_name: str, last_name: str, role: str) -> User:
        user, _ = User.objects.get_or_create(
            email=email,
            defaults={
                "username": username,
                "first_name": first_name,
                "last_name": last_name,
                "role": role,
                "is_active": True,
                "location": "Ташкент",
            },
        )

        # Keep credentials/role deterministic for repeated CI runs.
        user.username = username
        user.first_name = first_name
        user.last_name = last_name
        user.role = role
        user.is_active = True
        user.location = "Ташкент"
        user.set_password(DEFAULT_PASSWORD)
        user.save()
        return user

    def _upsert_specialist_profile(self, specialist_user: User) -> None:
        SpecialistProfile.objects.update_or_create(
            user=specialist_user,
            defaults={
                "category": "IT и фриланс",
                "price_start": 50000,
                "description": "E2E specialist profile",
                "is_verified": True,
                "tags": ["E2E", "IT"],
                "balance": 200000,
            },
        )

    def _reset_test_data(self, client: User, specialist: User) -> None:
        TaskResponse.objects.filter(specialist__user=specialist).delete()
        Task.objects.filter(client=client).delete()
        Message.objects.filter(
            Q(sender_id__in=[client.id, specialist.id]) | Q(receiver_id__in=[client.id, specialist.id])
        ).delete()
