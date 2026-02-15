/**
 * Bookings Page - Manage user bookings
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Phone, MessageSquare,
  CheckCircle, XCircle, AlertCircle, RefreshCw, Star
} from 'lucide-react';
import { bookingsAPI, reviewsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { PageLoader } from '../components/LoadingSpinner';
import ReviewModal from '../components/ReviewModal';

const statusConfig = {
  pending: { label: 'Pending', color: 'amber', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'blue', icon: CheckCircle },
  in_progress: { label: 'In Progress', color: 'purple', icon: RefreshCw },
  completed: { label: 'Completed', color: 'green', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'red', icon: XCircle },
};

export default function Bookings() {
  const [activeTab, setActiveTab] = useState('all');
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const isProvider = user?.role === 'provider';

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings', activeTab],
    queryFn: () =>
      bookingsAPI
        .getAll(activeTab !== 'all' ? { status: activeTab } : {})
        .then((res) => res.data),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => bookingsAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id) => bookingsAPI.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id) => bookingsAPI.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (data) => reviewsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      setIsReviewOpen(false);
      setSelectedBookingId(null);
    },
  });

  const handleReviewClick = (bookingId) => {
    setSelectedBookingId(bookingId);
    setIsReviewOpen(true);
  };

  const handleReviewSubmit = (data) => {
    reviewMutation.mutate({
      booking_id: selectedBookingId,
      ...data,
    });
  };

  const bookings = bookingsData?.results || [];

  const tabs = [
    { id: 'all', label: 'All Bookings' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'completed', label: 'Completed' },
  ];

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title">
          {isProvider ? 'Service Requests' : 'My Bookings'}
        </h1>
        <p className="section-subtitle">
          {isProvider
            ? 'Manage incoming booking requests from customers'
            : 'Track and manage your service bookings'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <PageLoader />
      ) : bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const status = statusConfig[booking.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <div
                key={booking.id}
                className="card p-6 hover:shadow-lg transition-all animate-fade-in"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Service Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl">
                        🔧
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`badge bg-${status.color}-100 text-${status.color}-700`}>
                            <StatusIcon size={14} className="mr-1" />
                            {status.label}
                          </span>
                          <span className="text-gray-400 text-sm">
                            #{booking.id}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {booking.service?.title || 'Service'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {isProvider
                            ? `Customer: ${booking.customer?.first_name} ${booking.customer?.last_name}`
                            : `by ${booking.service?.provider?.provider_profile?.business_name || 'Provider'}`
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={18} className="text-blue-600" />
                      <span>{formatDate(booking.scheduled_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={18} className="text-blue-600" />
                      <span>{formatTime(booking.scheduled_time)}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      ₹{booking.quoted_price}
                    </div>
                    {booking.final_price && booking.final_price !== booking.quoted_price && (
                      <div className="text-sm text-green-600">
                        Final: ₹{booking.final_price}
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="text-gray-400 mt-0.5" />
                    <span>{booking.address}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Provider Actions */}
                    {isProvider && booking.status === 'pending' && (
                      <button
                        onClick={() => confirmMutation.mutate(booking.id)}
                        disabled={confirmMutation.isPending}
                        className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        {confirmMutation.isPending ? 'Confirming...' : 'Confirm Request'}
                      </button>
                    )}

                    {isProvider && booking.status === 'confirmed' && (
                      <button
                        onClick={() => completeMutation.mutate(booking.id)}
                        disabled={completeMutation.isPending}
                        className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                      >
                        {completeMutation.isPending ? 'Updating...' : 'Mark Completed'}
                      </button>
                    )}

                    {/* Customer Actions */}
                    {!isProvider && booking.status === 'pending' && (
                      <button
                        onClick={() => cancelMutation.mutate(booking.id)}
                        disabled={cancelMutation.isPending}
                        className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Cancel Booking
                      </button>
                    )}

                    {!isProvider && booking.status === 'confirmed' && (
                      <button className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1">
                        <Phone size={16} />
                        Contact Provider
                      </button>
                    )}

                    {!isProvider && booking.status === 'completed' && !booking.review && (
                      <button
                        onClick={() => handleReviewClick(booking.id)}
                        className="px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Star size={16} />
                        Leave a Review
                      </button>
                    )}

                    {!isProvider && booking.review && (
                      <div className="flex items-center gap-1 text-yellow-500 text-sm font-medium">
                        <Star size={16} fill="currentColor" />
                        <span>{booking.review.rating}/5</span>
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/services/${booking.service?.id}`}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Service →
                  </Link>
                </div>

                {/* Notes */}
                {(booking.customer_notes || booking.provider_notes) && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    {booking.customer_notes && (
                      <div className="flex items-start gap-2 text-sm mb-2">
                        <MessageSquare size={16} className="text-gray-400 mt-0.5" />
                        <div>
                          <span className="font-medium text-gray-700">Customer Notes: </span>
                          <span className="text-gray-600">{booking.customer_notes}</span>
                        </div>
                      </div>
                    )}
                    {booking.provider_notes && (
                      <div className="flex items-start gap-2 text-sm">
                        <MessageSquare size={16} className="text-blue-400 mt-0.5" />
                        <div>
                          <span className="font-medium text-gray-700">Provider Notes: </span>
                          <span className="text-gray-600">{booking.provider_notes}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Calendar size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isProvider ? 'No service requests' : 'No bookings yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {isProvider
              ? 'You usually receive requests when customers book your services.'
              : "You haven't made any bookings yet. Browse our services to get started."}
          </p>
          {!isProvider && (
            <Link to="/services" className="btn-primary">
              Browse Services
            </Link>
          )}
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onSubmit={handleReviewSubmit}
        isSubmitting={reviewMutation.isPending}
      />
    </div>
  );
}
