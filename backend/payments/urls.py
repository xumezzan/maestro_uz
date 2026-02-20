from django.urls import path
from .views import PaymeWebhookView, ClickWebhookView, CreateTransactionView

urlpatterns = [
    path('payme/', PaymeWebhookView.as_view(), name='payme_webhook'),
    path('click/', ClickWebhookView.as_view(), name='click_webhook'),
    path('create/', CreateTransactionView.as_view(), name='create_transaction'),
]
