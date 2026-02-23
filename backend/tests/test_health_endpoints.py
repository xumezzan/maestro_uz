import pytest
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
def test_health_live_ok(api_client):
    response = api_client.get('/api/health/live/')
    assert response.status_code == 200
    assert response.data['status'] == 'ok'


@pytest.mark.django_db
def test_health_ready_ok(api_client, monkeypatch):
    monkeypatch.setattr('api.health_views.check_database', lambda: (True, None))
    monkeypatch.setattr('api.health_views.check_redis', lambda: (True, None))

    response = api_client.get('/api/health/ready/')
    assert response.status_code == 200
    assert response.data['status'] == 'ready'
    assert response.data['checks']['database']['ok'] is True
    assert response.data['checks']['redis']['ok'] is True


@pytest.mark.django_db
def test_health_ready_degraded_when_redis_down(api_client, monkeypatch):
    monkeypatch.setattr('api.health_views.check_database', lambda: (True, None))
    monkeypatch.setattr('api.health_views.check_redis', lambda: (False, 'redis down'))

    response = api_client.get('/api/health/ready/')
    assert response.status_code == 503
    assert response.data['status'] == 'degraded'
    assert response.data['checks']['database']['ok'] is True
    assert response.data['checks']['redis']['ok'] is False
