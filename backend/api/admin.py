from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, SpecialistProfile, Task, TaskResponse

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'phone', 'location')
    fieldsets = UserAdmin.fieldsets + (
        ('Extra Fields', {'fields': ('role', 'avatar_url', 'phone', 'location')}),
    )

@admin.register(SpecialistProfile)
class SpecialistAdmin(admin.ModelAdmin):
    list_display = ('user', 'category', 'rating', 'price_start', 'is_verified')
    list_filter = ('category', 'is_verified')
    search_fields = ('user__username', 'description')

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'client', 'category', 'status', 'created_at')
    list_filter = ('status', 'category')

@admin.register(TaskResponse)
class ResponseAdmin(admin.ModelAdmin):
    list_display = ('task', 'specialist', 'price')
