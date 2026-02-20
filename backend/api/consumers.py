import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from .models import Message, Task

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token_string):
    try:
        access_token = AccessToken(token_string)
        user_id = access_token['user_id']
        return User.objects.get(id=user_id)
    except Exception:
        return AnonymousUser()

@database_sync_to_async
def save_message(sender, receiver_id, task_id, text):
    try:
        receiver = User.objects.get(id=receiver_id)
        task = Task.objects.get(id=task_id) if task_id else None
        msg = Message.objects.create(
            sender=sender,
            receiver=receiver,
            task=task,
            text=text
        )
        return {
            'id': msg.id,
            'sender_id': msg.sender.id,
            'receiver_id': msg.receiver.id,
            'task_id': msg.task.id if msg.task else None,
            'text': msg.text,
            'created_at': msg.created_at.isoformat(),
        }
    except Exception as e:
        return None

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = AnonymousUser()
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        token = None
        
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=')[1]
                break
                
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
        data = json.loads(text_data)
        receiver_id = data.get('receiver_id')
        task_id = data.get('task_id')
        text = data.get('text')

        if not receiver_id or not text:
            return

        # Save to database
        saved_msg = await save_message(self.user, receiver_id, task_id, text)
        if not saved_msg:
            return

        # Send message to receiver's group
        receiver_group_name = f"user_{receiver_id}"
        await self.channel_layer.group_send(
            receiver_group_name,
            {
                'type': 'chat_message',
                'message': saved_msg
            }
        )
        
        # Send message back to sender (to confirm it was sent)
        await self.send(text_data=json.dumps({
            'message': saved_msg
        }))

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))
