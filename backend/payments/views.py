from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
import uuid
from api.models import Transaction

class CreateTransactionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        system = request.data.get('system', 'payme') # 'payme' or 'click'
        
        if not amount or int(amount) < 5000:
            return Response({"error": "Минимальная сумма 5 000 UZS"}, status=400)
            
        transaction = Transaction.objects.create(
            user=request.user,
            amount=amount,
            transaction_type=Transaction.Type.TOP_UP,
            status=Transaction.Status.PENDING,
            description="Пополнение баланса"
        )
        
        payment_url = ""
        amount_int = int(amount)
        
        if system == 'payme':
            # Payme uses tiyins (UZS * 100)
            amount_tiyin = amount_int * 100
            merchant_id = settings.PAYME_MERCHANT_ID
            params = f"m={merchant_id};ac.transaction_id={transaction.id};a={amount_tiyin}"
            encoded_params = base64.b64encode(params.encode('utf-8')).decode('utf-8')
            payment_url = f"https://checkout.paycom.uz/{encoded_params}"
            
        elif system == 'click':
            # Click uses UZS directly
            merchant_id = settings.CLICK_MERCHANT_ID
            service_id = settings.CLICK_SERVICE_ID
            payment_url = f"https://my.click.uz/services/pay?service_id={service_id}&merchant_id={merchant_id}&amount={amount_int}&transaction_param={transaction.id}"

        return Response({
            "transaction_id": transaction.id,
            "payment_url": payment_url
        })


from django.conf import settings
from decimal import Decimal
from api.models import Transaction, SpecialistProfile
import base64

class PaymeWebhookView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        data = request.data
        method = data.get('method')
        params = data.get('params', {})
        request_id = data.get('id')

        # Basic Auth Check
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Basic '):
            return self._error_response(request_id, -32504, "Недостаточно привилегий")
            
        try:
            auth_decoded = base64.b64decode(auth_header.split(' ')[1]).decode('utf-8')
            _, password = auth_decoded.split(':', 1)
            if password != settings.PAYME_SECRET_KEY:
                return self._error_response(request_id, -32504, "Неверный пароль")
        except Exception:
            return self._error_response(request_id, -32504, "Ошибка авторизации")

        if method == 'CheckPerformTransaction':
            return self._check_perform_transaction(request_id, params)
        elif method == 'CreateTransaction':
            return self._create_transaction(request_id, params)
        elif method == 'PerformTransaction':
            return self._perform_transaction(request_id, params)
        elif method == 'CheckTransaction':
            # Minimal stub for checking transaction
            return Response({"jsonrpc": "2.0", "id": request_id, "result": {"create_time": 0, "perform_time": 0, "cancel_time": 0, "transaction": "test", "state": 2, "reason": None}})
        elif method == 'CancelTransaction':
            # Minimal stub for canceling
            return Response({"jsonrpc": "2.0", "id": request_id, "result": {"transaction": "test", "state": -2, "cancel_time": int(uuid.uuid4().int % 1000000000000)}})
            
        return self._error_response(request_id, -32601, "Метод не найден")
        
    def _check_perform_transaction(self, request_id, params):
        account = params.get('account', {})
        transaction_id = account.get('transaction_id')
        
        try:
            Transaction.objects.get(id=transaction_id, status=Transaction.Status.PENDING)
            return Response({"jsonrpc": "2.0", "id": request_id, "result": {"allow": True}})
        except Transaction.DoesNotExist:
            return self._error_response(request_id, -31050, "Транзакция не найдена или уже завершена")
            
    def _create_transaction(self, request_id, params):
        account = params.get('account', {})
        transaction_id = account.get('transaction_id')
        payme_trans_id = params.get('id') # Payme's ID
        
        try:
            txn = Transaction.objects.get(id=transaction_id, status=Transaction.Status.PENDING)
            txn.gateway_transaction_id = payme_trans_id
            txn.save(update_fields=['gateway_transaction_id'])
            
            return Response({
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {
                    "create_time": int(txn.created_at.timestamp() * 1000),
                    "transaction": str(txn.id),
                    "state": 1
                }
            })
        except Transaction.DoesNotExist:
            return self._error_response(request_id, -31050, "Транзакция не найдена")

    def _perform_transaction(self, request_id, params):
        payme_trans_id = params.get('id')
        
        try:
            txn = Transaction.objects.get(gateway_transaction_id=payme_trans_id)
            
            if txn.status == Transaction.Status.SUCCESS:
                 return Response({
                     "jsonrpc": "2.0",
                     "id": request_id,
                     "result": {
                         "transaction": str(txn.id),
                         "perform_time": int(txn.created_at.timestamp() * 1000),
                         "state": 2
                     }
                 })
                 
            if txn.status == Transaction.Status.PENDING:
                txn.status = Transaction.Status.SUCCESS
                txn.save(update_fields=['status'])
                
                # Credit specialist
                profile = txn.user.specialist_profile
                profile.balance += Decimal(str(txn.amount))
                profile.save(update_fields=['balance'])
                
                return Response({
                     "jsonrpc": "2.0",
                     "id": request_id,
                     "result": {
                         "transaction": str(txn.id),
                         "perform_time": int(txn.created_at.timestamp() * 1000),
                         "state": 2
                     }
                 })
                 
        except Transaction.DoesNotExist:
            return self._error_response(request_id, -31003, "Транзакция не найдена")
            
        return self._error_response(request_id, -31008, "Невозможно выполнить операцию")

    def _error_response(self, request_id, code, message):
        return Response({
            "jsonrpc": "2.0",
            "id": request_id,
            "error": {
                "code": code,
                "message": message
            }
        })


import hashlib

class ClickWebhookView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        click_trans_id = request.data.get('click_trans_id', '')
        service_id = request.data.get('service_id', '')
        merchant_trans_id = request.data.get('merchant_trans_id', '')
        amount = request.data.get('amount', '')
        action = request.data.get('action', '')
        error = request.data.get('error', '')
        error_note = request.data.get('error_note', '')
        sign_time = request.data.get('sign_time', '')
        sign_string = request.data.get('sign_string', '')
        
        # Verify MD5 signature
        raw_sign = f"{click_trans_id}{service_id}{settings.CLICK_SECRET_KEY}{merchant_trans_id}{amount}{action}{sign_time}"
        hashed = hashlib.md5(raw_sign.encode('utf-8')).hexdigest()
        
        if hashed != sign_string:
            return Response({"error": -1, "error_note": "Sign check error"})
            
        try:
            txn = Transaction.objects.get(id=merchant_trans_id)
        except Transaction.DoesNotExist:
            return Response({"error": -5, "error_note": "Transaction does not exist"})
            
        if Decimal(str(amount)) != txn.amount:
            return Response({"error": -2, "error_note": "Incorrect parameter amount"})

        # Action 0 = Prepare
        if str(action) == "0":
            if txn.status != Transaction.Status.PENDING:
                 return Response({"error": -4, "error_note": "Already paid or canceled"})
            return Response({
                "click_trans_id": click_trans_id,
                "merchant_trans_id": merchant_trans_id,
                "merchant_prepare_id": txn.id,
                "error": 0,
                "error_note": "Success"
            })
            
        # Action 1 = Complete
        if str(action) == "1":
            if str(error) != "0": # Error from Click
                txn.status = Transaction.Status.FAILED
                txn.save(update_fields=['status'])
                return Response({
                    "click_trans_id": click_trans_id,
                    "merchant_trans_id": merchant_trans_id,
                    "merchant_confirm_id": txn.id,
                    "error": 0,
                    "error_note": "Handled external error"
                })

            if txn.status == Transaction.Status.SUCCESS:
                 return Response({
                     "click_trans_id": click_trans_id,
                     "merchant_trans_id": merchant_trans_id,
                     "merchant_confirm_id": txn.id,
                     "error": -4,
                     "error_note": "Already paid"
                 })

            if txn.status == Transaction.Status.PENDING:
                txn.status = Transaction.Status.SUCCESS
                txn.gateway_transaction_id = click_trans_id
                txn.save(update_fields=['status', 'gateway_transaction_id'])
                
                profile = txn.user.specialist_profile
                profile.balance += txn.amount
                profile.save(update_fields=['balance'])
                
                return Response({
                    "click_trans_id": click_trans_id,
                    "merchant_trans_id": merchant_trans_id,
                    "merchant_confirm_id": txn.id,
                    "error": 0,
                    "error_note": "Success"
                })
                
        return Response({"error": -3, "error_note": "Action not found"})
