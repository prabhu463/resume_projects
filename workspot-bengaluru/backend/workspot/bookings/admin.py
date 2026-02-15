"""Admin configuration for Bookings app."""
from django.contrib import admin
from .models import Booking, Review


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'service', 'status', 'scheduled_date', 'quoted_price']
    list_filter = ['status', 'scheduled_date']
    search_fields = ['customer__email', 'service__title']
    raw_id_fields = ['customer', 'service']
    date_hierarchy = 'scheduled_date'


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['booking', 'rating', 'created_at']
    list_filter = ['rating']
    search_fields = ['booking__customer__email', 'comment']
