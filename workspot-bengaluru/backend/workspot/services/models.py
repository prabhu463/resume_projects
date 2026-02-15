"""
Service models for WORKSPOT Bengaluru.
Manages service listings and categories for the booking platform.
"""
from django.db import models
from django.conf import settings


class Category(models.Model):
    """Service categories (e.g., Plumbing, Electrical, Cleaning)."""
    
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)  # Icon class name
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Service(models.Model):
    """Service listings offered by providers."""
    
    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='services',
        limit_choices_to={'role': 'provider'}
    )
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='services')
    title = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    price_type = models.CharField(
        max_length=20,
        choices=[
            ('fixed', 'Fixed Price'),
            ('hourly', 'Per Hour'),
            ('daily', 'Per Day'),
        ],
        default='fixed'
    )
    duration_minutes = models.PositiveIntegerField(default=60)
    image = models.ImageField(upload_to='services/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'services'
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['provider']),
            models.Index(fields=['is_active', 'category']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} by {self.provider.email}"
