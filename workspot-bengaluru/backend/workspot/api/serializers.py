"""
Serializers for WORKSPOT Bengaluru API.
"""
from rest_framework import serializers
from workspot.users.models import User, ProviderProfile
from workspot.services.models import Service, Category
from workspot.bookings.models import Booking, Review


class ProviderProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProviderProfile
        fields = ['business_name', 'description', 'experience_years', 
                  'rating', 'total_reviews', 'is_available', 'service_radius_km']


class UserSerializer(serializers.ModelSerializer):
    provider_profile = ProviderProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 
                  'phone', 'role', 'avatar', 'is_verified', 'address', 
                  'city', 'pincode', 'latitude', 'longitude', 'provider_profile']
        read_only_fields = ['id', 'email', 'is_verified']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password_confirm', 
                  'first_name', 'last_name', 'phone', 'role']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match'})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        
        # Create provider profile if role is provider
        if user.role == User.Role.PROVIDER:
            ProviderProfile.objects.create(
                user=user,
                business_name=f"{user.first_name}'s Services"
            )
        
        return user


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon']


class ServiceSerializer(serializers.ModelSerializer):
    provider = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Service
        fields = ['id', 'provider', 'category', 'category_id', 'title', 
                  'description', 'price', 'price_type', 'duration_minutes', 
                  'image', 'is_active', 'created_at']
        read_only_fields = ['id', 'provider', 'created_at']


class ReviewSerializer(serializers.ModelSerializer):
    customer = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = ['id', 'rating', 'comment', 'created_at', 'customer']
        
    def get_customer(self, obj):
        return f"{obj.booking.customer.first_name} {obj.booking.customer.last_name}"


class ReviewCreateSerializer(serializers.ModelSerializer):
    booking_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Review
        fields = ['booking_id', 'rating', 'comment']

    def validate_booking_id(self, value):
        try:
            booking = Booking.objects.get(id=value)
        except Booking.DoesNotExist:
            raise serializers.ValidationError("Booking not found")
            
        return value
        
    def create(self, validated_data):
        booking_id = validated_data.pop('booking_id')
        booking = Booking.objects.get(id=booking_id)
        review = Review.objects.create(booking=booking, **validated_data)
        return review


class BookingSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    service = ServiceSerializer(read_only=True)
    review = ReviewSerializer(read_only=True)
    
    class Meta:
        model = Booking
        fields = ['id', 'customer', 'service', 'status', 'scheduled_date', 
                  'scheduled_time', 'address', 'latitude', 'longitude',
                  'quoted_price', 'final_price', 'customer_notes', 
                  'provider_notes', 'created_at', 'completed_at', 'review']
        read_only_fields = ['id', 'customer', 'created_at', 'completed_at']


class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['service', 'scheduled_date', 'scheduled_time', 
                  'address', 'latitude', 'longitude', 'customer_notes']
    
    def create(self, validated_data):
        service = validated_data['service']
        validated_data['quoted_price'] = service.price
        # Set default status to PENDING
        validated_data['status'] = Booking.Status.PENDING
        return super().create(validated_data)
