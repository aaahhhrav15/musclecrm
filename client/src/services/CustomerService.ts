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
  membershipStartDate: string;
  membershipEndDate?: string;
  transactionDate: string;
  paymentMode: string;
  birthday?: string;
  totalSpent: number;
  personalTrainer?: string | { _id: string; name: string; email?: string; phone?: string };
  createdAt: string;
  updatedAt: string;
}

export interface PersonalTrainingAssignment {
  _id: string;
  customerId: string;
  trainerId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  gymId: string;
  startDate: string;
  duration: number;
  endDate: string;
  fees: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerTransaction {
  _id: string;
  userId: string;
  gymId: string;
  invoiceId?: string;
  transactionType: string;
  transactionDate: string;
  amount: number;
  membershipType: string;
  paymentMode: string;
  description?: string;
  status: string;
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
    membershipStartDate: string;
    membershipEndDate?: string;
    transactionDate: string;
    paymentMode: string;
    birthday?: string;
    totalSpent: number;
    personalTrainer?: string | { _id: string; name: string; email?: string; phone?: string };
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
    membershipStartDate: string;
    membershipEndDate?: string;
    transactionDate: string;
    paymentMode: string;
    birthday?: string;
    totalSpent: number;
    personalTrainer?: string | { _id: string; name: string; email?: string; phone?: string };
    createdAt: string;
    updatedAt: string;
  };
  personalTrainingAssignments?: PersonalTrainingAssignment[];
  transactions?: CustomerTransaction[];
  invoice?: {
    _id: string;
    invoiceNumber: string;
    customerId: string;
    amount: number;
    currency: string;
    status: string;
    dueDate: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }>;
    notes?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface CustomerFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  source: 'website' | 'referral' | 'walk-in' | 'social_media' | 'other';
  membershipType: 'none' | 'basic' | 'premium' | 'vip';
  membershipFees: number;
  membershipDuration: number;
  joinDate: Date;
  membershipStartDate: Date;
  membershipEndDate?: Date;
  transactionDate: Date;
  paymentMode: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';
  birthday?: Date;
  totalSpent?: number;
  notes?: string;
}

export interface CustomerApiUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  source?: 'website' | 'referral' | 'walk-in' | 'social_media' | 'other';
  membershipType?: 'none' | 'basic' | 'premium' | 'vip';
  membershipFees?: number;
  membershipDuration?: number;
  joinDate?: string;
  membershipStartDate?: string;
  membershipEndDate?: string;
  transactionDate?: string;
  paymentMode?: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';
  birthday?: string;
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

interface ApiCustomerData {
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
  membershipStartDate: string;
  membershipEndDate?: string;
  transactionDate: string;
  paymentMode: string;
  birthday?: string;
  totalSpent: number;
  personalTrainer?: string | { _id: string; name: string; email?: string; phone?: string };
  createdAt: string;
  updatedAt: string;
}

const mapCustomerFromApi = (apiCustomer: ApiCustomerData): Customer => ({
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
  membershipStartDate: apiCustomer.membershipStartDate,
  membershipEndDate: apiCustomer.membershipEndDate,
  transactionDate: apiCustomer.transactionDate,
  paymentMode: apiCustomer.paymentMode,
  birthday: apiCustomer.birthday,
  totalSpent: apiCustomer.totalSpent || 0,
  personalTrainer: apiCustomer.personalTrainer,
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
      console.log('API URL:', import.meta.env.VITE_API_URL || 'https://api.musclecrm.com/api');
      
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
  createCustomer: async (customerData: CustomerFormData): Promise<ApiCustomerResponse> => {
    try {
      const response = await ApiService.post<ApiCustomerResponse>('/customers', customerData);
      return response;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing customer
   */
  updateCustomer: async (id: string, customerData: CustomerApiUpdateData): Promise<ApiCustomerResponse> => {
    try {
      const response = await ApiService.put<ApiCustomerResponse>(`/customers/${id}`, customerData);
      return response;
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
  },

  getCustomerById: async (id: string): Promise<{ customer: Customer, personalTrainingAssignments: PersonalTrainingAssignment[], transactions: CustomerTransaction[] }> => {
    const response = await ApiService.get<ApiCustomerResponse>(`/customers/${id}`);
    if (!response.success) throw new Error(response.message || 'Failed to fetch customer');
    const customer = mapCustomerFromApi(response.customer);
    return {
      customer,
      personalTrainingAssignments: response.personalTrainingAssignments || [],
      transactions: response.transactions || []
    };
  }
};

export default CustomerService;
