import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // This is important for handling cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    // Redirect to subscriptions page if backend signals subscription is required
    if (
      response.data &&
      response.data.redirectToSubscription &&
      window.location.pathname !== '/subscriptions'
    ) {
      window.location.href = '/subscriptions';
      // Optionally, reject the promise to prevent further processing
      return Promise.reject(new Error('Redirecting to subscriptions page'));
    }
    return response;
  },
  (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      // Only redirect to login if on a protected route
      const protectedPrefixes = ['/dashboard', '/setup'];
      const currentPath = window.location.pathname;
      const isProtected = protectedPrefixes.some(prefix => currentPath.startsWith(prefix));
      if (isProtected && !currentPath.includes('/login')) {
        window.location.href = '/login';
      }
      // On public pages, do not redirect
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 