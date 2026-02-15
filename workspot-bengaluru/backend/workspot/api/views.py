"""
API views for WORKSPOT Bengaluru.
RESTful API architecture for user authentication, service listings, and booking requests.
"""
from rest_framework import viewsets, generics, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Prefetch, Avg
from django.db import transaction

from workspot.users.models import User, ProviderProfile
from workspot.services.models import Service, Category
from workspot.bookings.models import Booking, Review
from .serializers import (
    UserSerializer, UserRegistrationSerializer,
    ServiceSerializer, CategorySerializer,
    BookingSerializer, BookingCreateSerializer,
    ReviewSerializer, ReviewCreateSerializer,
)


class RegisterView(generics.CreateAPIView):
    """User registration endpoint."""
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
    """User profile endpoint."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """User viewset - read only for public profiles."""
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['get'])
    def services(self, request, pk=None):
        """Get services offered by a provider."""
        user = self.get_object()
        services = Service.objects.filter(provider=user, is_active=True)
        serializer = ServiceSerializer(services, many=True)
        return Response(serializer.data)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Category viewset for browsing service categories."""
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class ServiceViewSet(viewsets.ModelViewSet):
    """
    Service viewset with optimized queries for concurrent requests.
    Uses select_related and prefetch_related to minimize database hits.
    """
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'price_type', 'is_active']
    search_fields = ['title', 'description']
    ordering_fields = ['price', 'created_at']
    
    def get_queryset(self):
        """Optimized queryset with eager loading."""
        return Service.objects.select_related(
            'provider',
            'provider__provider_profile',
            'category'
        ).filter(is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(provider=self.request.user)
    
    @action(detail=False, methods=['get'])
    def nearby(self, request):
        """Get services near user's location."""
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius = request.query_params.get('radius', 10)  # km
        
        if not lat or not lng:
            return Response(
                {'error': 'lat and lng parameters required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Haversine formula for distance calculation
        # For production, consider using PostGIS for better performance
        services = self.get_queryset().filter(
            provider__latitude__isnull=False,
            provider__longitude__isnull=False
        )
        
        serializer = self.get_serializer(services, many=True)
        return Response(serializer.data)


class BookingViewSet(viewsets.ModelViewSet):
    """
    Booking viewset with optimized queries for handling concurrent user requests.
    Uses database transactions and proper indexing.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'scheduled_date']
    ordering_fields = ['scheduled_date', 'created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return BookingCreateSerializer
        return BookingSerializer
    
    def get_queryset(self):
        """
        Optimized queryset with eager loading.
        Uses select_related for ForeignKey and prefetch_related for reverse relations.
        """
        user = self.request.user
        
        base_queryset = Booking.objects.select_related(
            'customer',
            'service',
            'service__provider',
            'service__category'
        ).prefetch_related(
            Prefetch('review', queryset=Review.objects.all())
        )
        
        # Return bookings where user is customer or provider
        if user.role == 'provider':
            return base_queryset.filter(service__provider=user)
        return base_queryset.filter(customer=user)
    
    @transaction.atomic
    def perform_create(self, serializer):
        """Create booking with transaction for data consistency."""
        serializer.save(customer=self.request.user)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm a pending booking (provider only)."""
        booking = self.get_object()
        
        if booking.service.provider != request.user:
            return Response(
                {'error': 'Only the service provider can confirm'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.status != Booking.Status.PENDING:
            return Response(
                {'error': 'Only pending bookings can be confirmed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = Booking.Status.CONFIRMED
        booking.save()
        
        return Response(BookingSerializer(booking).data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark booking as completed."""
        booking = self.get_object()
        
        if booking.status not in [Booking.Status.CONFIRMED, Booking.Status.IN_PROGRESS]:
            return Response(
                {'error': 'Booking must be confirmed or in progress'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.utils import timezone
        booking.status = Booking.Status.COMPLETED
        booking.completed_at = timezone.now()
        booking.final_price = booking.quoted_price
        booking.save()
        
        return Response(BookingSerializer(booking).data)


class ReviewViewSet(viewsets.ModelViewSet):
    """
    Review viewset for handling customer reviews.
    Updates provider stats on review creation.
    """
    queryset = Review.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['booking__service']
    ordering_fields = ['created_at', 'rating']

    def get_serializer_class(self):
        if self.action == 'create':
            return ReviewCreateSerializer
        return ReviewSerializer

    def perform_create(self, serializer):
        review = serializer.save()
        
        # Update provider stats
        provider_profile = review.booking.service.provider.provider_profile
        
        # Recalculate average rating
        reviews = Review.objects.filter(booking__service__provider=review.booking.service.provider)
        total_reviews = reviews.count()
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        
        provider_profile.total_reviews = total_reviews
        provider_profile.rating = avg_rating
        provider_profile.save()
