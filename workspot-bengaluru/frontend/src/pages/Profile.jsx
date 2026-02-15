/**
 * Profile Page - View and edit user profile
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  User, Mail, Phone, MapPin, Camera, Save, Edit2,
  Shield, Star, Calendar, CheckCircle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Profile() {
  const { user, updateProfile, isLoading } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || 'Bengaluru',
      pincode: user?.pincode || '',
    },
  });

  const onSubmit = async (data) => {
    const success = await updateProfile(data);
    if (success) {
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  if (!user) {
    console.log('Profile: User is null/undefined');
    return <LoadingSpinner />;
  }

  console.log('Profile: User loaded', user);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title">My Profile</h1>
        <p className="section-subtitle">
          Manage your account information
        </p>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 animate-scale-in">
          <CheckCircle size={20} />
          <span>Profile updated successfully!</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="card p-6 text-center">
            {/* Avatar */}
            <div className="relative inline-block mb-4">
              <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                {(user?.first_name && user.first_name[0]) || (user?.email && user.email[0].toUpperCase()) || 'U'}
              </div>
              <button className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors">
                <Camera size={18} />
              </button>
            </div>

            <h2 className="text-xl font-bold text-gray-900">
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-gray-500 capitalize">{user?.role || 'Customer'}</p>

            {/* Stats */}
            {user?.role === 'provider' && user?.provider_profile && (
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {user.provider_profile.total_reviews || 0}
                  </div>
                  <div className="text-xs text-gray-500">Reviews</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {user.provider_profile.rating || 'New'}
                  </div>
                  <div className="text-xs text-gray-500">Rating</div>
                </div>
              </div>
            )}

            {/* Verification Badge */}
            <div className="mt-6 p-4 bg-green-50 rounded-xl">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <Shield size={20} />
                <span className="font-medium">
                  {user?.is_verified ? 'Verified Account' : 'Unverified'}
                </span>
              </div>
            </div>

            {/* Member Since */}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Calendar size={16} />
              <span>Member since {new Date(user?.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Edit2 size={18} />
                  Edit Profile
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Name */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      {...register('first_name', { required: 'First name is required' })}
                      disabled={!isEditing}
                      className={`input-field pl-11 ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    {...register('last_name', { required: 'Last name is required' })}
                    disabled={!isEditing}
                    className={`input-field ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input-field pl-11 bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    {...register('phone', {
                      pattern: {
                        value: /^[6-9]\d{9}$/,
                        message: 'Enter a valid 10-digit mobile number',
                      },
                    })}
                    disabled={!isEditing}
                    className={`input-field pl-11 ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-gray-400" size={18} />
                  <textarea
                    {...register('address')}
                    disabled={!isEditing}
                    rows={3}
                    className={`input-field pl-11 resize-none ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="Enter your address"
                  />
                </div>
              </div>

              {/* City & Pincode */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    {...register('city')}
                    disabled={!isEditing}
                    className={`input-field ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    {...register('pincode', {
                      pattern: {
                        value: /^\d{6}$/,
                        message: 'Enter a valid 6-digit pincode',
                      },
                    })}
                    disabled={!isEditing}
                    className={`input-field ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                  {errors.pincode && (
                    <p className="mt-1 text-sm text-red-600">{errors.pincode.message}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex items-center gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Security Section */}
          <div className="card p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <h3 className="font-medium text-gray-900">Password</h3>
                <p className="text-sm text-gray-500">Last changed 3 months ago</p>
              </div>
              <button className="btn-outline">
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
