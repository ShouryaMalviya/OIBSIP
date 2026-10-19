import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL,
  withCredentials: true, // Enables transmitting HTTP-only cookies for cross-origin authentication
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Authorization header if token is stored in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pizzaverse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: normalize error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend sent a formatted message, preserve it
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred. Please try again.';
    
    // Attach user-friendly message to error object
    error.userMessage = message;
    return Promise.reject(error);
  }
);

export default api;
