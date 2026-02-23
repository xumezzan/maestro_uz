import pytest
from django.test import override_settings
from rest_framework.test import APIClient
from unittest.mock import patch

from api.models import SpecialistProfile, User


@pytest.fixture
def client_user(db):
    return User.objects.create_user(
        username='dual_client',
        email='dual_client@test.com',
        password='password123',
        role='CLIENT',
        is_active=True,
    )


@pytest.fixture
def specialist_user(db):
    user = User.objects.create_user(
        username='dual_specialist',
        email='dual_specialist@test.com',
        password='password123',
        role='SPECIALIST',
        is_active=True,
    )
    SpecialistProfile.objects.create(
        user=user,
        category='IT и фриланс',
        price_start=50000,
        description='Dual-session specialist',
        balance=100000,
    )
    return user


def _login_and_set_bearer(client: APIClient, email: str, password: str):
    response = client.post('/api/auth/login/', {'email': email, 'password': password}, format='json')
    assert response.status_code == 200
    assert 'access' in response.data
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
    return response.data['user']


@pytest.mark.django_db
def test_two_parallel_role_sessions_are_isolated(client_user, specialist_user):
    client_tab = APIClient()
    specialist_tab = APIClient()

    client_identity = _login_and_set_bearer(client_tab, client_user.email, 'password123')
    specialist_identity = _login_and_set_bearer(specialist_tab, specialist_user.email, 'password123')

    # Simulates two tabs: each session must keep its own role.
    assert client_identity['role'] == 'CLIENT'
    assert specialist_identity['role'] == 'SPECIALIST'

    me_client = client_tab.get('/api/auth/me/')
    me_specialist = specialist_tab.get('/api/auth/me/')
    assert me_client.status_code == 200
    assert me_specialist.status_code == 200
    assert me_client.data['role'] == 'CLIENT'
    assert me_specialist.data['role'] == 'SPECIALIST'

    task_response = client_tab.post('/api/tasks/', {
        'client': client_user.id,
        'title': 'Need landing page',
        'description': 'Design and build landing page',
        'category': 'IT и фриланс',
        'location': 'Tashkent',
        'budget': '900000 UZS',
    }, format='json')
    assert task_response.status_code == 201
    task_id = task_response.data['id']

    # Specialist cannot create tasks (role isolation on permissions).
    specialist_create_task = specialist_tab.post('/api/tasks/', {
        'client': specialist_user.id,
        'title': 'Wrong role task',
        'description': 'Should be forbidden for specialist',
        'category': 'IT и фриланс',
        'location': 'Tashkent',
        'budget': '100000 UZS',
    }, format='json')
    assert specialist_create_task.status_code in [400, 403]
    assert 'Только заказчики' in str(specialist_create_task.data)

    with patch('api.tasks.send_notification_email.delay'):
        specialist_response = specialist_tab.post('/api/responses/', {
            'task': task_id,
            'message': 'Can deliver this quickly',
            'price': 850000,
        }, format='json')
    assert specialist_response.status_code == 201

    # Client cannot respond as specialist.
    client_response_attempt = client_tab.post('/api/responses/', {
        'task': task_id,
        'message': 'I should not be able to respond',
        'price': 840000,
    }, format='json')
    assert client_response_attempt.status_code in [400, 403]

    with override_settings(
        CHANNEL_LAYERS={'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'}},
    ):
        msg_client_to_specialist = client_tab.post('/api/messages/', {
            'receiver': specialist_user.id,
            'task': task_id,
            'text': 'Hello, let us discuss details',
        }, format='json')
        msg_specialist_to_client = specialist_tab.post('/api/messages/', {
            'receiver': client_user.id,
            'task': task_id,
            'text': 'Sure, I am available now',
        }, format='json')

    assert msg_client_to_specialist.status_code == 201
    assert msg_specialist_to_client.status_code == 201
