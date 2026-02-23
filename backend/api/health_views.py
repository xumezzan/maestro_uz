import logging

from django.conf import settings
from django.db import connection
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


def _public_error_message(exc: Exception) -> str:
    if settings.DEBUG:
        return str(exc)
    return "unavailable"


def check_database():
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        return True, None
    except Exception as exc:
        logger.warning("Database readiness check failed: %s", exc)
        return False, _public_error_message(exc)


def check_redis():
    redis_url = getattr(settings, "REDIS_URL", None) or getattr(settings, "CELERY_BROKER_URL", None)
    if not redis_url:
        return True, None

    try:
        import redis

        client = redis.Redis.from_url(redis_url, socket_connect_timeout=1, socket_timeout=1)
        client.ping()
        return True, None
    except Exception as exc:
        logger.warning("Redis readiness check failed: %s", exc)
        return False, _public_error_message(exc)


class HealthLiveView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = []

    def get(self, request):
        return Response({"status": "ok"}, status=status.HTTP_200_OK)


class HealthReadyView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = []

    def get(self, request):
        db_ok, db_error = check_database()
        redis_ok, redis_error = check_redis()

        checks = {
            "database": {"ok": db_ok},
            "redis": {"ok": redis_ok},
        }
        if db_error:
            checks["database"]["error"] = db_error
        if redis_error:
            checks["redis"]["error"] = redis_error

        is_ready = db_ok and redis_ok
        return Response(
            {
                "status": "ready" if is_ready else "degraded",
                "checks": checks,
            },
            status=status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE,
        )
