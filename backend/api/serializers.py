from rest_framework import serializers
from .models import User, SpecialistProfile, Task, TaskResponse, Message

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'avatar_url', 'location']

class SpecialistProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.get_full_name', read_only=True)
    avatarUrl = serializers.CharField(source='user.avatar_url', read_only=True)
    location = serializers.CharField(source='user.location', read_only=True)

    class Meta:
        model = SpecialistProfile
        fields = ['id', 'name', 'category', 'rating', 'reviews_count', 'location', 
                  'price_start', 'avatarUrl', 'description', 'is_verified', 'tags', 
                  'passport_image', 'profile_image', 'telegram', 'instagram']

class TaskResponseSerializer(serializers.ModelSerializer):
    specialistName = serializers.CharField(source='specialist.user.get_full_name', read_only=True)
    specialistAvatar = serializers.CharField(source='specialist.user.avatar_url', read_only=True)
    specialistRating = serializers.FloatField(source='specialist.rating', read_only=True)

    class Meta:
        model = TaskResponse
        fields = ['id', 'task', 'specialist', 'specialistName', 'specialistAvatar', 
                  'specialistRating', 'message', 'price', 'created_at']
        read_only_fields = ['specialist', 'specialistName', 'specialistAvatar', 'specialistRating']

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    sender_avatar = serializers.CharField(source='sender.avatar_url', read_only=True)
    receiver_name = serializers.CharField(source='receiver.get_full_name', read_only=True)
    receiver_avatar = serializers.CharField(source='receiver.avatar_url', read_only=True)
    is_me = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_name', 'sender_avatar', 'receiver', 'receiver_name', 'receiver_avatar', 'task', 
                  'text', 'image', 'is_read', 'created_at', 'is_me']
        read_only_fields = ['sender', 'is_me']

    def get_is_me(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.sender == request.user
        return False

class TaskSerializer(serializers.ModelSerializer):
    responses_count = serializers.IntegerField(source='responses.count', read_only=True)

    class Meta:
        model = Task
        fields = ['id', 'client', 'title', 'description', 'category', 'budget', 
                  'location', 'date_info', 'status', 'created_at', 'responses_count', 'assigned_specialist']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=User.Role.choices, default='client')

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'client')
        )
        return user
