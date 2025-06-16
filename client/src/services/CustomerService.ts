import { ApiService, ApiResponse } from './ApiService';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  source?: string;
  notes?: string;
  membershipType?: string;
  membershipFees: number;
  membershipDuration: number;
  joinDate: string;
  birthday?: string;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiCustomersResponse extends ApiResponse {
  customers: Array<{
    _id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    source?: string;
    notes?: string;
    membershipType?: string;
    membershipFees: number;
    membershipDuration: number;
    joinDate: string;
    birthday?: string;
    totalSpent: number;
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
}

interface ApiCustomerResponse extends ApiResponse {
  customer: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    source?: string;
    notes?: string;
    membershipType?: string;
    membershipFees: number;
    membershipDuration: number;
    joinDate: string;
    birthday?: string;
    totalSpent: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface CustomerFormData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  source: 'website' | 'referral' | 'walk-in' | 'social_media' | 'other';
  membershipType: 'none' | 'basic' | 'premium' | 'vip';
  membershipFees: number;
  membershipDuration: number;
  joinDate: Date;
  birthday?: Date;
  totalSpent?: number;
  notes?: string;
}

export interface CustomerFilterOptions {
  search?: string;
  page?: number;
  limit?: number;
  membershipType?: string;
  source?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const mapCustomerFromApi = (apiCustomer: any): Customer => ({
  id: apiCustomer._id,
  name: apiCustomer.name,
  email: apiCustomer.email,
  phone: apiCustomer.phone,
  address: apiCustomer.address,
  source: apiCustomer.source,
  notes: apiCustomer.notes,
  membershipType: apiCustomer.membershipType,
  membershipFees: apiCustomer.membershipFees || 0,
  membershipDuration: apiCustomer.membershipDuration || 0,
  joinDate: apiCustomer.joinDate,
  birthday: apiCustomer.birthday,
  totalSpent: apiCustomer.totalSpent || 0,
  createdAt: apiCustomer.createdAt,
  updatedAt: apiCustomer.updatedAt
});

export const CustomerService = {
  /**
   * Get all customers with optional filtering
   */
  getCustomers: async (filters: CustomerFilterOptions = {}): Promise<{ customers: Customer[], total: number }> => {
    try {
      console.log('Making API request to /customers with filters:', filters);
      console.log('API URL:', import.meta.env.VITE_API_URL || 'http://localhost:5001/api');
      
      const response = await ApiService.get<ApiCustomersResponse>('/customers', filters);
      console.log('Raw API response:', response);
      
      if (response.success) {
        const customers = response.customers.map(mapCustomerFromApi);
        console.log('Mapped customers:', customers);
        return {
          customers,
          total: response.total
        };
      } else {
        console.error('API returned error:', response.message);
        throw new Error(response.message || 'Failed to fetch customers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Error request:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      throw error;
    }
  },
  
  /**
   * Get a single customer by ID
   */
  getCustomer: async (id: string): Promise<Customer> => {
    try {
      const response = await ApiService.get<ApiCustomerResponse>(`/customers/${id}`);
      
      if (response.success) {
        return mapCustomerFromApi(response.customer);
      } else {
        throw new Error(response.message || 'Failed to fetch customer');
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  },
  
  /**
   * Create a new customer
   */
  createCustomer: async (customerData: CustomerFormData): Promise<ApiResponse> => {
    try {
      const response = await ApiService.post<ApiResponse>('/customers', customerData);
      return response;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing customer
   */
  updateCustomer: async (id: string, customerData: Partial<CustomerFormData>): Promise<Customer> => {
    try {
      const response = await ApiService.put<ApiCustomerResponse>(`/customers/${id}`, customerData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update customer');
      }

      return mapCustomerFromApi(response.customer);
    } catch (error: unknown) {
      console.error('Error updating customer:', error);
      if (error instanceof Error) {
        throw new Error(error.message || 'Failed to update customer');
      }
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const apiError = error as { response?: { data?: { message?: string } } };
        throw new Error(apiError.response?.data?.message || 'Failed to update customer');
      }
      throw new Error('Failed to update customer');
    }
  },
  
  /**
   * Delete a customer
   */
  deleteCustomer: async (id: string): Promise<boolean> => {
    try {
      const response = await ApiService.delete<ApiResponse>(`/customers/${id}`);
      
      return response.success;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }
};

export default CustomerService;
