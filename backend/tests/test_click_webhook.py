import pytest
import hashlib
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
        amount=15000,
        transaction_type=Transaction.Type.TOP_UP,
        status=Transaction.Status.PENDING,
        description="Пополнение баланса"
    )

def generate_click_signature(click_trans_id, service_id, secret_key, merchant_trans_id, amount, action, sign_time):
    raw_sign = f"{click_trans_id}{service_id}{secret_key}{merchant_trans_id}{amount}{action}{sign_time}"
    return hashlib.md5(raw_sign.encode('utf-8')).hexdigest()

@pytest.mark.django_db
def test_click_invalid_signature(api_client, settings):
    settings.CLICK_SECRET_KEY = 'click_secret'
    
    response = api_client.post('/api/payments/click/', {
        "click_trans_id": "123",
        "service_id": "1",
        "merchant_trans_id": "555",
        "amount": "15000",
        "action": "0",
        "error": "0",
        "error_note": "",
        "sign_time": "2023-01-01",
        "sign_string": "invalid_md5"
    }, format='json')
    
    assert response.status_code == 200
    assert response.data['error'] == -1

@pytest.mark.django_db
def test_click_prepare_success(api_client, pending_transaction, settings):
    settings.CLICK_SECRET_KEY = 'click_secret'
    
    click_trans_id = "click_999"
    service_id = "1"
    amount = "15000"
    action = "0"
    sign_time = "2023-01-01 12:00:00"
    
    sign_string = generate_click_signature(
        click_trans_id, service_id, settings.CLICK_SECRET_KEY, 
        str(pending_transaction.id), amount, action, sign_time
    )
    
    response = api_client.post('/api/payments/click/', {
        "click_trans_id": click_trans_id,
        "service_id": service_id,
        "merchant_trans_id": str(pending_transaction.id),
        "amount": amount,
        "action": action,
        "error": "0",
        "error_note": "",
        "sign_time": sign_time,
        "sign_string": sign_string
    }, format='json')
    
    assert response.status_code == 200
    assert response.data['error'] == 0
    assert response.data['merchant_prepare_id'] == pending_transaction.id

@pytest.mark.django_db
def test_click_complete_success(api_client, pending_transaction, settings):
    settings.CLICK_SECRET_KEY = 'click_secret'
    
    click_trans_id = "click_999"
    service_id = "1"
    amount = "15000"
    action = "1"
    sign_time = "2023-01-01 12:01:00"
    
    sign_string = generate_click_signature(
        click_trans_id, service_id, settings.CLICK_SECRET_KEY, 
        str(pending_transaction.id), amount, action, sign_time
    )
    
    # Must be pending initially
    assert pending_transaction.status == Transaction.Status.PENDING
    
    response = api_client.post('/api/payments/click/', {
        "click_trans_id": click_trans_id,
        "service_id": service_id,
        "merchant_trans_id": str(pending_transaction.id),
        "amount": amount,
        "action": action,
        "error": "0",
        "error_note": "",
        "sign_time": sign_time,
        "sign_string": sign_string
    }, format='json')
    
    assert response.status_code == 200
    assert response.data['error'] == 0
    assert response.data['merchant_confirm_id'] == pending_transaction.id
    
    # Verify transaction completed
    pending_transaction.refresh_from_db()
    assert pending_transaction.status == Transaction.Status.SUCCESS
    
    # Verify profile balance updated
    profile = pending_transaction.user.specialist_profile
    profile.refresh_from_db()
    assert profile.balance == Decimal('15000')
