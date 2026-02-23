from io import StringIO
from unittest.mock import patch

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import override_settings


@pytest.mark.django_db
def test_preflight_check_passes_with_safe_settings():
    out = StringIO()
    with override_settings(
        DEBUG=False,
        DJANGO_SECRET_KEY='super-secret-key',
        SECRET_KEY='super-secret-key',
        ALLOWED_HOSTS=['example.com'],
        CORS_ALLOW_ALL_ORIGINS=False,
        EMAIL_BACKEND='django.core.mail.backends.console.EmailBackend',
        USE_REDIS_CACHE=True,
    ):
        with patch('api.management.commands.preflight_check.check_database', return_value=(True, None)):
            with patch('api.management.commands.preflight_check.check_redis', return_value=(True, None)):
                call_command('preflight_check', require_production=True, stdout=out)

    assert 'Preflight check passed' in out.getvalue()


@pytest.mark.django_db
def test_preflight_check_fails_when_debug_in_production_mode():
    with override_settings(DEBUG=True):
        with patch('api.management.commands.preflight_check.check_database', return_value=(True, None)):
            with patch('api.management.commands.preflight_check.check_redis', return_value=(True, None)):
                with pytest.raises(CommandError):
                    call_command('preflight_check', require_production=True)


@pytest.mark.django_db
def test_preflight_check_fails_with_wildcard_host():
    with override_settings(DEBUG=False, SECRET_KEY='strong-key', ALLOWED_HOSTS=['*']):
        with patch('api.management.commands.preflight_check.check_database', return_value=(True, None)):
            with patch('api.management.commands.preflight_check.check_redis', return_value=(True, None)):
                with pytest.raises(CommandError):
                    call_command('preflight_check')
