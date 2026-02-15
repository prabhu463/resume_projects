"""Admin configuration for Services app."""
from django.contrib import admin
from .models import Category, Service


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['title', 'provider', 'category', 'price', 'price_type', 'is_active']
    list_filter = ['category', 'price_type', 'is_active']
    search_fields = ['title', 'description', 'provider__email']
    raw_id_fields = ['provider']
