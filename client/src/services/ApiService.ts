import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useToast } from '@/hooks/use-toast';

// Configure base API settings
const API_URL = 'https://flexcrm-ui-suite-production-ec9f.up.railway.app/api';

// Response interfaces
export interface ApiResponse {
  success: boolean;
  message?: string;
}

export interface ApiUserResponse extends ApiResponse {
  user: {
    _id: string;
    name: string;
    email: string;
    industry: string;
    role?: string;
    phone?: string;
    bio?: string;
    membershipType?: string;
    joinDate?: string;
  };
}

export interface ApiInvoiceResponse extends ApiResponse {
  invoice: any;
}

export interface ApiInvoicesResponse extends ApiResponse {
  invoices: any[];
  total: number;
}

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for handling errors globally
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    // Handle auth errors
    if (error.response && error.response.status === 401) {
      // If we're already on a login page, don't redirect
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Request interceptor for handling auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // You can add auth token handling here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { apiClient };

// Helper methods for common API operations
export const ApiService = {
  // GET request
  get: async <T>(url: string, params?: any): Promise<T> => {
    try {
      console.log('Making GET request to:', url);
      console.log('With params:', params);
      const response = await apiClient.get<T>(url, { params });
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`GET request failed: ${url}`, error);
      throw error;
    }
  },
  
  // POST request
  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`POST request failed: ${url}`, error);
      throw error;
    }
  },
  
  // PUT request
  put: async <T>(url: string, data?: any): Promise<T> => {
    try {
      const response = await apiClient.put<T>(url, data);
      return response.data;
    } catch (error) {
      console.error(`PUT request failed: ${url}`, error);
      throw error;
    }
  },
  
  // PATCH request
  patch: async <T>(url: string, data?: any): Promise<T> => {
    try {
      const response = await apiClient.patch<T>(url, data);
      return response.data;
    } catch (error) {
      console.error(`PATCH request failed: ${url}`, error);
      throw error;
    }
  },
  
  // DELETE request
  delete: async <T>(url: string): Promise<T> => {
    try {
      const response = await apiClient.delete<T>(url);
      return response.data;
    } catch (error) {
      console.error(`DELETE request failed: ${url}`, error);
      throw error;
    }
  }
};
