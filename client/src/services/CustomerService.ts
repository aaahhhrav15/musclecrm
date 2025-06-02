
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
  joinDate: string;
  birthday?: string;
  totalSpent: number;
  lastVisit?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiCustomersResponse extends ApiResponse {
  customers: Customer[];
  total: number;
}

interface ApiCustomerResponse extends ApiResponse {
  customer: Customer;
}

export interface CustomerFilterOptions {
  search?: string;
  page?: number;
  limit?: number;
}

export const CustomerService = {
  /**
   * Get all customers with optional filtering
   */
  getCustomers: async (filters: CustomerFilterOptions = {}): Promise<{ customers: Customer[], total: number }> => {
    try {
      const response = await ApiService.get<ApiCustomersResponse>('/customers', filters);
      
      if (response.success) {
        return {
          customers: response.customers,
          total: response.total
        };
      } else {
        throw new Error(response.message || 'Failed to fetch customers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
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
        return response.customer;
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
  createCustomer: async (customerData: Omit<Customer, 'id' | 'totalSpent' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
    try {
      const response = await ApiService.post<ApiCustomerResponse>('/customers', customerData);
      
      if (response.success) {
        return response.customer;
      } else {
        throw new Error(response.message || 'Failed to create customer');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing customer
   */
  updateCustomer: async (id: string, customerData: Partial<Customer>): Promise<Customer> => {
    try {
      const response = await ApiService.put<ApiCustomerResponse>(`/customers/${id}`, customerData);
      
      if (response.success) {
        return response.customer;
      } else {
        throw new Error(response.message || 'Failed to update customer');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
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
