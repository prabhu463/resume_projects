/**
 * API Service for WORKSPOT Bengaluru
 * Handles RESTful API calls to Django backend
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
          refresh: refreshToken,
        });
        
        localStorage.setItem('access_token', response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => 
    api.post('/token/', { email, password }),
  
  register: (userData) => 
    api.post('/v1/auth/register/', userData),
  
  getProfile: () => 
    api.get('/v1/auth/profile/'),
  
  updateProfile: (data) => 
    api.patch('/v1/auth/profile/', data),
};

// Services API
export const servicesAPI = {
  getAll: (params) => 
    api.get('/v1/services/', { params }),
  
  getById: (id) => 
    api.get(`/v1/services/${id}/`),
  
  create: (data) => 
    api.post('/v1/services/', data),
  
  update: (id, data) => 
    api.patch(`/v1/services/${id}/`, data),
  
  getNearby: (lat, lng, radius) => 
    api.get('/v1/services/nearby/', { params: { lat, lng, radius } }),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/v1/categories/'),
};

// Bookings API
export const bookingsAPI = {
  getAll: (params) => 
    api.get('/v1/bookings/', { params }),
  
  getById: (id) => 
    api.get(`/v1/bookings/${id}/`),
  
  create: (data) => 
    api.post('/v1/bookings/', data),
  
  confirm: (id) => 
    api.post(`/v1/bookings/${id}/confirm/`),
  
  complete: (id) => 
    api.post(`/v1/bookings/${id}/complete/`),
  
  cancel: (id) => 
    api.patch(`/v1/bookings/${id}/`, { status: 'cancelled' }),
};

// Reviews API
export const reviewsAPI = {
  create: (data) => api.post('/v1/reviews/', data),
  getByService: (serviceId) => api.get(`/v1/reviews/?booking__service=${serviceId}`),
};

export default api;
