/**
 * Service Card Component - Supports grid and list view modes
 */
import { Link } from 'react-router-dom';
import { Star, Clock, MapPin, ArrowRight } from 'lucide-react';

export default function ServiceCard({ service, viewMode = 'grid' }) {
  const { id, title, description, price, price_type, duration_minutes, provider, category } = service;
  
  const priceLabels = {
    fixed: '',
    hourly: '/hr',
    daily: '/day',
  };

  // List view layout
  if (viewMode === 'list') {
    return (
      <Link 
        to={`/services/${id}`}
        className="card p-5 flex flex-col md:flex-row gap-5 card-hover"
      >
        {/* Image */}
        <div className="w-full md:w-48 h-40 md:h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-4xl flex-shrink-0">
          {service.image ? (
            <img src={service.image} alt={title} className="w-full h-full object-cover rounded-xl" />
          ) : (
            '🔧'
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-blue">{category?.name || 'Service'}</span>
            {provider?.provider_profile?.is_verified && (
              <span className="badge badge-green">✓ Verified</span>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock size={16} className="text-blue-600" />
              {duration_minutes} min
            </span>
            {provider?.city && (
              <span className="flex items-center gap-1">
                <MapPin size={16} className="text-blue-600" />
                {provider.city}
              </span>
            )}
            {provider?.provider_profile && (
              <span className="flex items-center gap-1">
                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                {provider.provider_profile.rating} ({provider.provider_profile.total_reviews})
              </span>
            )}
          </div>
        </div>
        
        {/* Price & CTA */}
        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 md:border-l md:pl-5">
          <div className="text-right">
            <span className="text-2xl font-bold text-gray-900">₹{price}</span>
            <span className="text-gray-500 text-sm">{priceLabels[price_type]}</span>
          </div>
          <span className="btn-primary text-sm px-4 py-2 flex items-center gap-1">
            Book <ArrowRight size={16} />
          </span>
        </div>
      </Link>
    );
  }

  // Grid view layout (default)
  return (
    <Link 
      to={`/services/${id}`}
      className="card overflow-hidden card-hover"
    >
      {/* Image */}
      <div className="w-full h-44 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-5xl">
        {service.image ? (
          <img src={service.image} alt={title} className="w-full h-full object-cover" />
        ) : (
          '🔧'
        )}
      </div>
      
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge-blue">{category?.name || 'Service'}</span>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{title}</h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>
        
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Clock size={16} className="text-blue-600" />
            {duration_minutes} min
          </span>
          {provider?.city && (
            <span className="flex items-center gap-1">
              <MapPin size={16} className="text-blue-600" />
              {provider.city}
            </span>
          )}
        </div>
        
        {provider?.provider_profile && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded-lg">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {provider.first_name?.[0] || 'P'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{provider.provider_profile.business_name}</p>
              <div className="flex items-center gap-1">
                <Star size={12} className="text-yellow-500 fill-yellow-500" />
                <span className="text-xs text-gray-500">
                  {provider.provider_profile.rating} ({provider.provider_profile.total_reviews} reviews)
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <span className="text-xl font-bold text-gray-900">₹{price}</span>
            <span className="text-gray-500 text-sm">{priceLabels[price_type]}</span>
          </div>
          <span className="text-blue-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
            Book Now <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}
