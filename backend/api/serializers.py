from rest_framework import serializers
from .models import User, SpecialistProfile, Task, TaskResponse

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
                  'price_start', 'avatarUrl', 'description', 'is_verified', 'tags', 'telegram', 'instagram']

class TaskResponseSerializer(serializers.ModelSerializer):
    specialistName = serializers.CharField(source='specialist.user.get_full_name', read_only=True)
    specialistAvatar = serializers.CharField(source='specialist.user.avatar_url', read_only=True)
    specialistRating = serializers.FloatField(source='specialist.rating', read_only=True)

    class Meta:
        model = TaskResponse
        fields = ['id', 'task', 'specialist', 'specialistName', 'specialistAvatar', 
                  'specialistRating', 'message', 'price', 'created_at']

class TaskSerializer(serializers.ModelSerializer):
    responses_count = serializers.IntegerField(source='responses.count', read_only=True)

    class Meta:
        model = Task
        fields = ['id', 'client', 'title', 'description', 'category', 'budget', 
                  'location', 'date_info', 'status', 'created_at', 'responses_count']
