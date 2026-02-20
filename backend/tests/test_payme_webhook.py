import pytest
import base64
from rest_framework.test import APIClient
from api.models import User, SpecialistProfile, Transaction
from decimal import Decimal

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def specialist_user(db):
    user = User.objects.create_user(username='specialist', email='spec@test.com', password='password', role='SPECIALIST')
    SpecialistProfile.objects.create(
        user=user, 
        category='IT', 
        price_start=50000, 
        description='Test Specialist',
        balance=0
    )
    return user

@pytest.fixture
def pending_transaction(db, specialist_user):
    return Transaction.objects.create(
        user=specialist_user,
        amount=10000,
        transaction_type=Transaction.Type.TOP_UP,
        status=Transaction.Status.PENDING,
        description="Пополнение баланса"
    )

def get_auth_header(password):
    credentials = f"Paycom:{password}"
    encoded = base64.b64encode(credentials.encode('utf-8')).decode('utf-8')
    return f"Basic {encoded}"

@pytest.mark.django_db
def test_payme_auth_failure(api_client, settings):
    settings.PAYME_SECRET_KEY = 'test_key'
    
    response = api_client.post('/api/payments/payme/', {
        "method": "CheckPerformTransaction",
        "id": 123
    }, format='json')
    
    assert response.status_code == 200
    assert response.data['error']['code'] == -32504

@pytest.mark.django_db
def test_payme_check_perform_transaction_success(api_client, pending_transaction, settings):
    settings.PAYME_SECRET_KEY = 'test_key'
    auth = get_auth_header('test_key')
    
    response = api_client.post('/api/payments/payme/', {
        "method": "CheckPerformTransaction",
        "id": 123,
        "params": {
            "account": {"transaction_id": pending_transaction.id}
        }
    }, HTTP_AUTHORIZATION=auth, format='json')
    
    assert response.status_code == 200
    assert 'result' in response.data
    assert response.data['result']['allow'] is True

@pytest.mark.django_db
def test_payme_create_transaction_success(api_client, pending_transaction, settings):
    settings.PAYME_SECRET_KEY = 'test_key'
    auth = get_auth_header('test_key')
    payme_trans_id = 'payme_12345'
    
    response = api_client.post('/api/payments/payme/', {
        "method": "CreateTransaction",
        "id": 124,
        "params": {
            "id": payme_trans_id,
            "account": {"transaction_id": pending_transaction.id}
        }
    }, HTTP_AUTHORIZATION=auth, format='json')
    
    assert response.status_code == 200
    assert response.data['result']['state'] == 1
    
    pending_transaction.refresh_from_db()
    assert pending_transaction.gateway_transaction_id == payme_trans_id

@pytest.mark.django_db
def test_payme_perform_transaction_success(api_client, pending_transaction, settings):
    settings.PAYME_SECRET_KEY = 'test_key'
    auth = get_auth_header('test_key')
    
    pending_transaction.gateway_transaction_id = 'payme_12345'
    pending_transaction.save()
    
    assert pending_transaction.user.specialist_profile.balance == Decimal('0')
    
    response = api_client.post('/api/payments/payme/', {
        "method": "PerformTransaction",
        "id": 125,
        "params": {
            "id": "payme_12345"
        }
    }, HTTP_AUTHORIZATION=auth, format='json')
    
    assert response.status_code == 200
    assert response.data['result']['state'] == 2
    
    pending_transaction.refresh_from_db()
    assert pending_transaction.status == Transaction.Status.SUCCESS
    
    profile = pending_transaction.user.specialist_profile
    profile.refresh_from_db()
    assert profile.balance == Decimal('10000')
