from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User, SpecialistProfile, Task, TaskResponse, Message, Review


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role',
                  'avatar_url', 'phone', 'location', 'is_staff', 'is_superuser']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=User.Role.choices, default=User.Role.CLIENT)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'role',
                  'password', 'password_confirm']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Пароли не совпадают."})

        # Run Django's password validators
        try:
            validate_password(attrs['password'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})

        return attrs

    def validate_email(self, value):
        qs = User.objects.filter(email=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Пользователь с таким email уже существует.")
        return value

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=password,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', User.Role.CLIENT),
            is_active=False  # Must verify email first
        )
        return user

    def update(self, instance, validated_data):
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if password:
            instance.set_password(password)
            
        instance.save()
        return instance


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Пароли не совпадают."})

        try:
            validate_password(attrs['password'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})

        return attrs


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'location', 'avatar_url']


class SpecialistProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.get_full_name', read_only=True)
    avatarUrl = serializers.CharField(source='user.avatar_url', read_only=True)
    location = serializers.CharField(source='user.location', read_only=True)

    class Meta:
        model = SpecialistProfile
        fields = ['id', 'user', 'name', 'category', 'rating', 'reviews_count', 'location',
                  'price_start', 'avatarUrl', 'description', 'is_verified', 'tags',
                  'passport_image', 'profile_image', 'telegram', 'instagram', 'balance']
        read_only_fields = ['is_verified']


class TaskResponseSerializer(serializers.ModelSerializer):
    specialistName = serializers.CharField(source='specialist.user.get_full_name', read_only=True)
    specialistAvatar = serializers.CharField(source='specialist.user.avatar_url', read_only=True)
    specialistRating = serializers.FloatField(source='specialist.rating', read_only=True)
    specialist_user_id = serializers.ReadOnlyField(source='specialist.user.id')

    class Meta:
        model = TaskResponse
        fields = ['id', 'task', 'specialist', 'specialist_user_id', 'specialistName', 'specialistAvatar',
                  'specialistRating', 'message', 'price', 'created_at']
        read_only_fields = ['specialist', 'specialist_user_id', 'specialistName', 'specialistAvatar', 'specialistRating']


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
        read_only_fields = ['client']


class ReviewSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    author_avatar = serializers.CharField(source='author.avatar_url', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'specialist', 'author', 'author_name', 'author_avatar',
            'task', 'text',
            'score_overall', 'score_punctuality', 'score_quality',
            'score_friendliness', 'score_honesty',
            'created_at'
        ]
        read_only_fields = ['author', 'author_name', 'author_avatar']
