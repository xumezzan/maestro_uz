import pytest
from django.core.cache import cache
from django.test import override_settings
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.test import APIClient

from api.models import SpecialistProfile, Task, TaskResponse, User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def client_user(db):
    return User.objects.create_user(
        username='client_sec',
        email='client_sec@test.com',
        password='password123',
        role='CLIENT',
        is_active=True,
    )


@pytest.fixture
def specialist_user(db):
    user = User.objects.create_user(
        username='spec_sec',
        email='spec_sec@test.com',
        password='password123',
        role='SPECIALIST',
        is_active=True,
    )
    SpecialistProfile.objects.create(
        user=user,
        category='IT',
        price_start=50000,
        description='Security specialist',
        balance=100000,
    )
    return user


@pytest.fixture
def inactive_user(db):
    return User.objects.create_user(
        username='inactive_login_user',
        email='inactive_login@test.com',
        password='password123',
        role='CLIENT',
        is_active=False,
    )


@pytest.fixture
def task(db, client_user):
    return Task.objects.create(
        client=client_user,
        title='Security Task',
        description='Need secure chat',
        category='IT',
        location='Tashkent',
        budget='100000 UZS',
    )


def _locmem_cache(location):
    return {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': location,
        }
    }


def _patch_scope_rate(monkeypatch, scope, rate):
    rates = dict(ScopedRateThrottle.THROTTLE_RATES)
    rates[scope] = rate
    monkeypatch.setattr(ScopedRateThrottle, 'THROTTLE_RATES', rates)


@pytest.mark.django_db
def test_auth_login_rate_limited(api_client, monkeypatch):
    User.objects.create_user(
        username='login_rate_user',
        email='login_rate@test.com',
        password='password123',
        role='CLIENT',
        is_active=True,
    )
    _patch_scope_rate(monkeypatch, 'auth_login', '2/minute')

    with override_settings(CACHES=_locmem_cache('auth-login-throttle-test')):
        cache.clear()
        payload = {'email': 'login_rate@test.com', 'password': 'wrong-password'}
        r1 = api_client.post('/api/auth/login/', payload, format='json')
        r2 = api_client.post('/api/auth/login/', payload, format='json')
        r3 = api_client.post('/api/auth/login/', payload, format='json')

    assert r1.status_code == 401
    assert r2.status_code == 401
    assert r3.status_code == 429


@pytest.mark.django_db
def test_auth_login_auto_activates_inactive_user_in_debug(api_client, inactive_user):
    with override_settings(DEBUG=True, ALLOW_DEBUG_INACTIVE_LOGIN=True):
        response = api_client.post('/api/auth/login/', {
            'email': inactive_user.email,
            'password': 'password123',
        }, format='json')

    inactive_user.refresh_from_db()
    assert response.status_code == 200
    assert inactive_user.is_active is True


@pytest.mark.django_db
def test_auth_login_blocks_inactive_user_when_bypass_disabled(api_client, inactive_user):
    with override_settings(DEBUG=True, ALLOW_DEBUG_INACTIVE_LOGIN=False):
        response = api_client.post('/api/auth/login/', {
            'email': inactive_user.email,
            'password': 'password123',
        }, format='json')

    inactive_user.refresh_from_db()
    assert response.status_code == 403
    assert inactive_user.is_active is False


@pytest.mark.django_db
def test_auth_login_blocks_inactive_user_in_production_mode(api_client, inactive_user):
    with override_settings(DEBUG=False, ALLOW_DEBUG_INACTIVE_LOGIN=True):
        response = api_client.post('/api/auth/login/', {
            'email': inactive_user.email,
            'password': 'password123',
        }, format='json')

    inactive_user.refresh_from_db()
    assert response.status_code == 403
    assert inactive_user.is_active is False


@pytest.mark.django_db
def test_message_task_chat_requires_response(api_client, client_user, specialist_user, task):
    api_client.force_authenticate(user=client_user)

    response = api_client.post('/api/messages/', {
        'receiver': specialist_user.id,
        'task': task.id,
        'text': 'hi',
    }, format='json')

    assert response.status_code == 400
    assert 'чат доступен только' in str(response.data).lower()


@pytest.mark.django_db
def test_chat_http_send_rate_limited(api_client, monkeypatch, client_user, specialist_user, task):
    # Specialist must respond first, so task-scoped chat becomes allowed.
    TaskResponse.objects.create(
        task=task,
        specialist=specialist_user.specialist_profile,
        message='Can do it',
        price=90000,
    )
    api_client.force_authenticate(user=client_user)
    _patch_scope_rate(monkeypatch, 'chat_http_send', '2/minute')

    with override_settings(
        CACHES=_locmem_cache('chat-http-throttle-test'),
        CHANNEL_LAYERS={'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'}},
    ):
        cache.clear()
        r1 = api_client.post('/api/messages/', {
            'receiver': specialist_user.id,
            'task': task.id,
            'text': 'm1',
        }, format='json')
        r2 = api_client.post('/api/messages/', {
            'receiver': specialist_user.id,
            'task': task.id,
            'text': 'm2',
        }, format='json')
        r3 = api_client.post('/api/messages/', {
            'receiver': specialist_user.id,
            'task': task.id,
            'text': 'm3',
        }, format='json')

    assert r1.status_code == 201
    assert r2.status_code == 201
    assert r3.status_code == 429
