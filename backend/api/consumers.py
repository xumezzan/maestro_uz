import json
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.core.cache import cache
from rest_framework_simplejwt.tokens import AccessToken

from .chat_rules import is_task_chat_pair_allowed
from .models import Message, Task

User = get_user_model()
CHAT_WS_RATE_LIMIT = max(getattr(settings, 'CHAT_WS_RATE_LIMIT', 30), 1)
CHAT_WS_RATE_WINDOW_SECONDS = max(getattr(settings, 'CHAT_WS_RATE_WINDOW_SECONDS', 10), 1)
CHAT_WS_MAX_TEXT_LENGTH = max(getattr(settings, 'CHAT_WS_MAX_TEXT_LENGTH', 2000), 1)

@database_sync_to_async
def get_user_from_token(token_string):
    try:
        access_token = AccessToken(token_string)
        user_id = access_token['user_id']
        return User.objects.get(id=user_id)
    except Exception:
        return AnonymousUser()

@database_sync_to_async
def is_ws_rate_limited(user_id):
    key = f"chat_ws_rate:{user_id}"
    count = cache.get(key)
    if count is None:
        cache.set(key, 1, timeout=CHAT_WS_RATE_WINDOW_SECONDS)
        return False
    if int(count) >= CHAT_WS_RATE_LIMIT:
        return True
    try:
        cache.incr(key)
    except ValueError:
        cache.set(key, int(count) + 1, timeout=CHAT_WS_RATE_WINDOW_SECONDS)
    return False

@database_sync_to_async
def create_message(sender, receiver_id, task_id, text):
    cleaned_text = (text or '').strip()
    if not cleaned_text:
        return {'error': 'EMPTY_MESSAGE', 'detail': 'Message text is required.'}
    if len(cleaned_text) > CHAT_WS_MAX_TEXT_LENGTH:
        return {'error': 'MESSAGE_TOO_LONG', 'detail': f'Message is too long (max {CHAT_WS_MAX_TEXT_LENGTH} chars).'}

    try:
        receiver_id = int(receiver_id)
    except (TypeError, ValueError):
        return {'error': 'INVALID_RECEIVER', 'detail': 'receiver_id must be an integer.'}

    if receiver_id == sender.id:
        return {'error': 'SELF_MESSAGE', 'detail': 'Cannot send messages to yourself.'}

    try:
        receiver = User.objects.get(id=receiver_id)
    except User.DoesNotExist:
        return {'error': 'RECEIVER_NOT_FOUND', 'detail': 'Receiver does not exist.'}

    task = None
    if task_id not in (None, ''):
        try:
            task_id = int(task_id)
        except (TypeError, ValueError):
            return {'error': 'INVALID_TASK', 'detail': 'task_id must be an integer.'}
        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return {'error': 'TASK_NOT_FOUND', 'detail': 'Task does not exist.'}
        if not is_task_chat_pair_allowed(task, sender.id, receiver.id):
            return {
                'error': 'TASK_CHAT_FORBIDDEN',
                'detail': 'Chat for this task is allowed only between client and responding specialist.',
            }

    try:
        msg = Message.objects.create(
            sender=sender,
            receiver=receiver,
            task=task,
            text=cleaned_text
        )
    except Exception:
        return {'error': 'SAVE_FAILED', 'detail': 'Failed to save message.'}

    return {
        'message': {
            'id': msg.id,
            'sender_id': msg.sender.id,
            'receiver_id': msg.receiver.id,
            'task_id': msg.task.id if msg.task else None,
            'text': msg.text,
            'created_at': msg.created_at.isoformat(),
        }
    }

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = AnonymousUser()
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        token = (parse_qs(query_string).get('token') or [None])[0]
                
        if token:
            self.user = await get_user_from_token(token)

        if isinstance(self.user, AnonymousUser) or not self.user.is_authenticated:
            await self.close()
            return

        self.user_group_name = f"user_{self.user.id}"

        # Join personal user group (for direct messages)
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )

    # Receive message from WebSocket
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'error': 'INVALID_JSON',
                'detail': 'Invalid JSON payload.',
            }))
            return

        receiver_id = data.get('receiver_id')
        task_id = data.get('task_id')
        text = data.get('text')

        if receiver_id is None:
            await self.send(text_data=json.dumps({
                'error': 'INVALID_RECEIVER',
                'detail': 'receiver_id is required.',
            }))
            return

        if await is_ws_rate_limited(self.user.id):
            await self.send(text_data=json.dumps({
                'error': 'RATE_LIMITED',
                'detail': 'Too many messages. Slow down.',
                'retry_after_seconds': CHAT_WS_RATE_WINDOW_SECONDS,
            }))
            return

        result = await create_message(self.user, receiver_id, task_id, text)
        if 'error' in result:
            await self.send(text_data=json.dumps(result))
            return

        saved_msg = result['message']

        # Fan out to all sender/receiver sockets
        receiver_group_name = f"user_{saved_msg['receiver_id']}"
        await self.channel_layer.group_send(
            receiver_group_name,
            {
                'type': 'chat_message',
                'message': saved_msg
            }
        )
        await self.channel_layer.group_send(
            self.user_group_name,
            {
                'type': 'chat_message',
                'message': saved_msg
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))
