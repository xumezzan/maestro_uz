from rest_framework.permissions import BasePermission


class IsSpecialistProfileOwnerOrAdmin(BasePermission):
    """Allow access only to the owner of a specialist profile or admins."""

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_staff or obj.user_id == request.user.id


class IsTaskOwnerOrAdmin(BasePermission):
    """Allow task modifications only for the task creator or admins."""

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_staff or obj.client_id == request.user.id
