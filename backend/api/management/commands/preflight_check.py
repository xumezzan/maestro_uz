from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from api.health_views import check_database, check_redis


DEFAULT_WEAK_SECRETS = {
    "django-insecure-change-me-in-production",
    "change-me-in-production-use-long-random-string",
}


class Command(BaseCommand):
    help = "Run a launch preflight check for production-readiness."

    def add_arguments(self, parser):
        parser.add_argument(
            "--require-production",
            action="store_true",
            help="Fail if DEBUG=True (recommended before first public launch).",
        )

    def handle(self, *args, **options):
        errors = []
        warnings = []

        require_production = options["require_production"]

        if require_production and settings.DEBUG:
            errors.append("DEBUG is enabled but --require-production was requested.")

        if settings.SECRET_KEY in DEFAULT_WEAK_SECRETS:
            errors.append("DJANGO_SECRET_KEY is using a known placeholder value.")

        if not settings.ALLOWED_HOSTS:
            errors.append("ALLOWED_HOSTS is empty.")
        elif "*" in settings.ALLOWED_HOSTS:
            errors.append("ALLOWED_HOSTS contains '*'.")

        if getattr(settings, "CORS_ALLOW_ALL_ORIGINS", False):
            warnings.append("CORS_ALLOW_ALL_ORIGINS=True (unsafe for public launch).")

        db_ok, db_error = check_database()
        if not db_ok:
            errors.append(f"Database check failed: {db_error or 'unavailable'}")

        redis_ok, redis_error = check_redis()
        if getattr(settings, "USE_REDIS_CACHE", False) and not redis_ok:
            errors.append(f"Redis check failed: {redis_error or 'unavailable'}")
        elif not redis_ok:
            warnings.append(f"Redis check failed: {redis_error or 'unavailable'}")

        if settings.EMAIL_BACKEND.endswith("smtp.EmailBackend"):
            email_user = getattr(settings, "EMAIL_HOST_USER", "")
            email_password = getattr(settings, "EMAIL_HOST_PASSWORD", "")
            if not email_user or not email_password:
                warnings.append("SMTP backend enabled but EMAIL_HOST_USER/EMAIL_HOST_PASSWORD are not fully configured.")

        if warnings:
            self.stdout.write(self.style.WARNING("Preflight warnings:"))
            for warning in warnings:
                self.stdout.write(f"  - {warning}")

        if errors:
            self.stdout.write(self.style.ERROR("Preflight errors:"))
            for err in errors:
                self.stdout.write(f"  - {err}")
            raise CommandError("Preflight check failed.")

        self.stdout.write(self.style.SUCCESS("Preflight check passed."))
