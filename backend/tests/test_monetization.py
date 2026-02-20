import pytest
from rest_framework.test import APIClient
from api.models import User, SpecialistProfile, Task, TaskResponse, Transaction
from decimal import Decimal
from unittest.mock import patch

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def client_user(db):
    user = User.objects.create_user(username='client', email='client@test.com', password='password', role='CLIENT')
    return user

@pytest.fixture
def specialist_user(db):
    user = User.objects.create_user(username='specialist', email='specialist@test.com', password='password', role='SPECIALIST')
    SpecialistProfile.objects.create(
        user=user, 
        category='IT', 
        price_start=50000, 
        description='Test Specialist',
        balance=0
    )
    return user

@pytest.fixture
def task(db, client_user):
    return Task.objects.create(
        client=client_user,
        title='Test Task',
        description='Test Description',
        category='IT',
        location='Tashkent',
        budget='100000 UZS'
    )

@pytest.mark.django_db
def test_respond_task_insufficient_funds(api_client, specialist_user, task):
    # Specialist has 0 balance (setup by fixture)
    api_client.force_authenticate(user=specialist_user)
    
    response = api_client.post('/api/responses/', {
        'task': task.id,
        'message': 'I can do this!',
        'price': 90000
    })
    
    assert response.status_code == 400
    assert 'INSUFFICIENT_FUNDS' in str(response.data)
    assert TaskResponse.objects.count() == 0
    assert Transaction.objects.count() == 0

@pytest.mark.django_db
@patch('api.tasks.send_notification_email.delay')
def test_respond_task_success_deduces_fee(mock_delay, api_client, specialist_user, task):
    # Give specialist balance
    specialist_user.specialist_profile.balance = Decimal('10000.00')
    specialist_user.specialist_profile.save()
    
    api_client.force_authenticate(user=specialist_user)
    
    response = api_client.post('/api/responses/', {
        'task': task.id,
        'message': 'I can do this!',
        'price': 90000
    })
    
    assert response.status_code == 201
    
    # Check balance deducted
    specialist_user.specialist_profile.refresh_from_db()
    assert specialist_user.specialist_profile.balance == Decimal('5000.00')
    
    # Check response created
    assert TaskResponse.objects.count() == 1
    
    # Check transaction logged
    assert Transaction.objects.filter(transaction_type=Transaction.Type.RESPONSE_FEE).count() == 1
    txn = Transaction.objects.first()
    assert txn.amount == Decimal('5000.00')
    
    # Check that celery task was called
    assert mock_delay.called

@pytest.mark.django_db
def test_client_cannot_respond(api_client, client_user, task):
    api_client.force_authenticate(user=client_user)
    
    response = api_client.post('/api/responses/', {
        'task': task.id,
        'message': 'I can do this!',
        'price': 90000
    })
    
    # Expect 403 or Validation Error
    assert response.status_code in [400, 403]
    assert 'Only specialists can respond' in str(response.data) or 'specialist_profile' in str(response.data)
