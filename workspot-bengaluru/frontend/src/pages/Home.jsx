/**
 * Home Page - WORKSPOT Bengaluru
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Wrench, Zap, Droplets, Sparkles, Truck, Paintbrush } from 'lucide-react';
import { categoriesAPI, servicesAPI } from '../services/api';
import ServiceCard from '../components/ServiceCard';

const categoryIcons = {
  plumbing: Droplets,
  electrical: Zap,
  cleaning: Sparkles,
  moving: Truck,
  painting: Paintbrush,
  default: Wrench,
};

export default function Home() {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then(res => {
      // Handle both paginated and non-paginated responses
      const data = res.data;
      return Array.isArray(data) ? data : data.results;
    }),
  });

  const { data: featuredServices } = useQuery({
    queryKey: ['services', 'featured'],
    queryFn: () => servicesAPI.getAll({ page_size: 6 }).then(res => res.data.results),
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl p-8 mb-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold mb-4">
            Find Local Services in Bengaluru
          </h1>
          <p className="text-blue-100 text-lg mb-6">
            Book trusted professionals for all your home service needs.
            Plumbing, electrical, cleaning, and more - all at your fingertips.
          </p>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="What service do you need?"
                className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900"
              />
            </div>
            <button className="px-6 py-3 bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-400">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse Categories</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories?.map((category) => {
            const IconComponent = categoryIcons[category.slug] || categoryIcons.default;
            return (
              <Link
                key={category.id}
                to={`/services?category=${category.id}`}
                className="flex flex-col items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <IconComponent className="text-blue-600" size={24} />
                </div>
                <span className="text-sm font-medium text-gray-700">{category.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Services */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Services</h2>
          <Link to="/services" className="text-blue-600 font-medium hover:underline">
            View All →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredServices?.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>
    </div>
  );
}
