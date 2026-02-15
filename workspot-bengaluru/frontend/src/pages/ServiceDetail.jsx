/**
 * Service Detail Page - Full service info with booking
 */
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft, Star, Clock, MapPin, Calendar, User,
  Phone, Mail, CheckCircle, Shield, Award, AlertCircle
} from 'lucide-react';
import { servicesAPI, bookingsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { PageLoader } from '../components/LoadingSpinner';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  // Fetch service details
  const { data: service, isLoading, error } = useQuery({
    queryKey: ['service', id],
    queryFn: () => servicesAPI.getById(id).then((res) => res.data),
  });

  // Booking mutation
  const bookingMutation = useMutation({
    mutationFn: (data) => bookingsAPI.create(data),
    onSuccess: () => {
      setBookingSuccess(true);
      queryClient.invalidateQueries(['bookings']);
    },
  });

  const onSubmitBooking = (data) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/services/${id}` } } });
      return;
    }

    bookingMutation.mutate({
      service: parseInt(id),
      scheduled_date: data.date,
      scheduled_time: data.time,
      address: data.address,
      latitude: 12.9716, // Default Bengaluru coordinates
      longitude: 77.5946,
      customer_notes: data.notes,
    });
  };

  if (isLoading) return <PageLoader />;

  if (error || !service) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Service not found</h2>
        <p className="text-gray-500 mb-4">The service you're looking for doesn't exist.</p>
        <Link to="/services" className="btn-primary">
          Browse Services
        </Link>
      </div>
    );
  }

  const priceLabels = { fixed: '', hourly: '/hr', daily: '/day' };
  const provider = service.provider;

  if (bookingSuccess) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 animate-scale-in">
        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-500 mb-6">
          Your booking request has been sent to the service provider.
          They will confirm your booking shortly.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/bookings" className="btn-primary">
            View My Bookings
          </Link>
          <Link to="/services" className="btn-secondary">
            Browse More Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back to services</span>
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Header Card */}
          <div className="card p-6">
            {service.image && (
              <img
                src={service.image}
                alt={service.title}
                className="w-full h-64 object-cover rounded-xl mb-6"
              />
            )}

            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="badge badge-blue mb-2">{service.category?.name}</span>
                <h1 className="text-2xl font-bold text-gray-900">{service.title}</h1>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  ₹{service.price}
                  <span className="text-lg text-gray-500">{priceLabels[service.price_type]}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-gray-500 mb-6">
              <span className="flex items-center gap-1">
                <Clock size={18} />
                {service.duration_minutes} min
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={18} />
                {provider?.city || 'Bengaluru'}
              </span>
            </div>

            <p className="text-gray-600 leading-relaxed">{service.description}</p>
          </div>

          {/* Provider Card */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">About the Provider</h2>

            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                {provider?.first_name?.[0] || 'P'}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {provider?.provider_profile?.business_name || `${provider?.first_name}'s Services`}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star size={16} fill="currentColor" />
                    <span className="font-medium">{provider?.provider_profile?.rating || '4.5'}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">
                    {provider?.provider_profile?.total_reviews || 0} reviews
                  </span>
                </div>
                {provider?.provider_profile?.description && (
                  <p className="text-gray-600 mt-2">{provider.provider_profile.description}</p>
                )}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <Shield size={20} className="text-green-600" />
                </div>
                <p className="text-xs text-gray-600">Verified Provider</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <Award size={20} className="text-blue-600" />
                </div>
                <p className="text-xs text-gray-600">{provider?.provider_profile?.experience_years || 3}+ Years Exp</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle size={20} className="text-purple-600" />
                </div>
                <p className="text-xs text-gray-600">100% Satisfaction</p>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <ReviewsSection serviceId={id} />
        </div>

        {/* Booking Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Book This Service</h2>

            {bookingMutation.isError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl mb-4">
                <AlertCircle size={18} />
                <span className="text-sm">Failed to create booking. Please try again.</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmitBooking)} className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  Select Date
                </label>
                <input
                  type="date"
                  {...register('date', { required: 'Date is required' })}
                  min={new Date().toISOString().split('T')[0]}
                  className={`input-field ${errors.date ? 'border-red-500' : ''}`}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                )}
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock size={16} className="inline mr-1" />
                  Select Time
                </label>
                <select
                  {...register('time', { required: 'Time is required' })}
                  className={`input-field ${errors.time ? 'border-red-500' : ''}`}
                >
                  <option value="">Choose a time slot</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                </select>
                {errors.time && (
                  <p className="mt-1 text-sm text-red-600">{errors.time.message}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-1" />
                  Service Address
                </label>
                <textarea
                  {...register('address', { required: 'Address is required' })}
                  rows={3}
                  className={`input-field resize-none ${errors.address ? 'border-red-500' : ''}`}
                  placeholder="Enter your complete address"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  className="input-field resize-none"
                  placeholder="Any specific requirements..."
                />
              </div>

              {/* Price Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between text-gray-600 mb-2">
                  <span>Service Price</span>
                  <span>₹{service.price}</span>
                </div>
                <div className="flex justify-between text-gray-600 mb-2">
                  <span>Platform Fee</span>
                  <span>₹0</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold text-gray-900">
                  <span>Total</span>
                  <span>₹{service.price}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={bookingMutation.isPending}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {bookingMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : isAuthenticated ? (
                  'Confirm Booking'
                ) : (
                  'Sign in to Book'
                )}
              </button>
            </form>

            <p className="text-xs text-gray-500 text-center mt-4">
              You won't be charged until the service is completed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewsSection({ serviceId }) {
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['reviews', serviceId],
    queryFn: () => import('../services/api').then(m => m.reviewsAPI.getByService(serviceId).then(res => res.data)),
  });

  const reviews = reviewsData?.results || [];

  if (isLoading) return <div className="py-8 text-center">Loading reviews...</div>;

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Customer Reviews</h2>

      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-sm font-bold">
                    {review.customer ? review.customer[0].toUpperCase() : 'U'}
                  </div>
                  <span className="font-medium text-gray-900">{review.customer || 'User'}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-1 text-yellow-500 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < review.rating ? "currentColor" : "none"}
                    className={i < review.rating ? "text-yellow-500" : "text-gray-300"}
                  />
                ))}
              </div>
              <p className="text-gray-600">{review.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No reviews yet. Be the first to review this service!
        </div>
      )}
    </div>
  );
}
