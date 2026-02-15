"""Admin configuration for Users app."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, ProviderProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'username', 'role', 'is_verified', 'city', 'is_active']
    list_filter = ['role', 'is_verified', 'is_active', 'city']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile', {'fields': ('phone', 'role', 'avatar', 'is_verified')}),
        ('Location', {'fields': ('address', 'city', 'pincode', 'latitude', 'longitude')}),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Profile', {'fields': ('email', 'phone', 'role')}),
    )


@admin.register(ProviderProfile)
class ProviderProfileAdmin(admin.ModelAdmin):
    list_display = ['business_name', 'user', 'rating', 'total_reviews', 'is_available']
    list_filter = ['is_available', 'rating']
    search_fields = ['business_name', 'user__email']
