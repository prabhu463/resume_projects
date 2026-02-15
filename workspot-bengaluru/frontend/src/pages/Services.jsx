/**
 * Services Page - Browse all services with filters
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, SlidersHorizontal, Grid3X3, List, X,
  Wrench, Zap, Droplets, Sparkles, Truck, Paintbrush, Home
} from 'lucide-react';
import { servicesAPI, categoriesAPI } from '../services/api';
import ServiceCard from '../components/ServiceCard';
import { PageLoader } from '../components/LoadingSpinner';

const categoryIcons = {
  plumbing: Droplets,
  electrical: Zap,
  cleaning: Sparkles,
  moving: Truck,
  painting: Paintbrush,
  handyman: Wrench,
  default: Home,
};

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  const categoryId = searchParams.get('category');
  const priceType = searchParams.get('price_type');

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then((res) => res.data),
  });

  // Fetch services
  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['services', categoryId, priceType, searchQuery],
    queryFn: () =>
      servicesAPI
        .getAll({
          category: categoryId,
          price_type: priceType,
          search: searchQuery,
        })
        .then((res) => res.data),
  });

  const services = servicesData?.results || [];

  const handleCategoryFilter = (catId) => {
    if (catId === categoryId) {
      searchParams.delete('category');
    } else {
      searchParams.set('category', catId);
    }
    setSearchParams(searchParams);
  };

  const handlePriceTypeFilter = (type) => {
    if (type === priceType) {
      searchParams.delete('price_type');
    } else {
      searchParams.set('price_type', type);
    }
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchQuery('');
  };

  const activeFiltersCount = [categoryId, priceType].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title">Browse Services</h1>
        <p className="section-subtitle">
          Find trusted professionals for all your home service needs
        </p>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services..."
            className="input-field pl-12"
          />
        </div>

        {/* Filter & View Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
              showFilters || activeFiltersCount > 0
                ? 'border-blue-600 bg-blue-50 text-blue-600'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <SlidersHorizontal size={20} />
            <span className="font-medium">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* View Toggle */}
          <div className="hidden sm:flex items-center border border-gray-200 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid3X3 size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card p-6 mb-8 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filter Services</h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <X size={16} />
                Clear all
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Categories</h4>
            <div className="flex flex-wrap gap-2">
              {categories?.map((cat) => {
                const IconComponent = categoryIcons[cat.slug] || categoryIcons.default;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryFilter(cat.id.toString())}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                      categoryId === cat.id.toString()
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent size={18} />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Type */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Pricing</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'fixed', label: 'Fixed Price' },
                { value: 'hourly', label: 'Hourly Rate' },
                { value: 'daily', label: 'Daily Rate' },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => handlePriceTypeFilter(type.value)}
                  className={`px-4 py-2 rounded-xl border transition-all ${
                    priceType === type.value
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">
          {services.length} service{services.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Services Grid/List */}
      {isLoading ? (
        <PageLoader />
      ) : services.length > 0 ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} viewMode={viewMode} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your filters or search query
          </p>
          <button onClick={clearFilters} className="btn-primary">
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
