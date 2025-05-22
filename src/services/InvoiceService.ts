
import { ApiService } from './ApiService';

export interface Invoice {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  date: string;
  dueDate?: string;
  items?: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal?: number;
  tax?: number;
  total: number;
  notes?: string;
}

export interface InvoiceFilterOptions {
  status?: 'Paid' | 'Pending' | 'Overdue' | 'All';
  startDate?: string;
  endDate?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}

export interface CreateInvoiceData {
  customerId: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  dueDate?: string;
  notes?: string;
  tax?: number;
}

const InvoiceService = {
  /**
   * Get all invoices with optional filters
   */
  getInvoices: async (filters?: InvoiceFilterOptions): Promise<{ invoices: Invoice[]; total: number }> => {
    try {
      let url = '/invoices';
      
      if (filters) {
        const queryParams = new URLSearchParams();
        
        if (filters.status && filters.status !== 'All') {
          queryParams.append('status', filters.status);
        }
        
        if (filters.startDate) {
          queryParams.append('startDate', filters.startDate);
        }
        
        if (filters.endDate) {
          queryParams.append('endDate', filters.endDate);
        }
        
        if (filters.customerId) {
          queryParams.append('customerId', filters.customerId);
        }
        
        if (filters.page) {
          queryParams.append('page', filters.page.toString());
        }
        
        if (filters.limit) {
          queryParams.append('limit', filters.limit.toString());
        }
        
        if (queryParams.toString()) {
          url = `${url}?${queryParams.toString()}`;
        }
      }
      
      const response = await ApiService.get(url);
      
      if (response.success) {
        return {
          invoices: response.invoices,
          total: response.total
        };
      } else {
        throw new Error(response.message || 'Failed to fetch invoices');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  },
  
  /**
   * Get a specific invoice by ID
   */
  getInvoiceById: async (invoiceId: string): Promise<Invoice> => {
    try {
      const response = await ApiService.get(`/invoices/${invoiceId}`);
      
      if (response.success) {
        return response.invoice;
      } else {
        throw new Error(response.message || 'Failed to fetch invoice');
      }
    } catch (error) {
      console.error(`Error fetching invoice ${invoiceId}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new invoice
   */
  createInvoice: async (invoiceData: CreateInvoiceData): Promise<Invoice> => {
    try {
      const response = await ApiService.post('/invoices', invoiceData);
      
      if (response.success) {
        return response.invoice;
      } else {
        throw new Error(response.message || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },
  
  /**
   * Update an invoice's status
   */
  updateInvoiceStatus: async (invoiceId: string, status: 'Paid' | 'Pending' | 'Overdue'): Promise<Invoice> => {
    try {
      const response = await ApiService.patch(`/invoices/${invoiceId}/status`, { status });
      
      if (response.success) {
        return response.invoice;
      } else {
        throw new Error(response.message || 'Failed to update invoice status');
      }
    } catch (error) {
      console.error(`Error updating invoice ${invoiceId} status:`, error);
      throw error;
    }
  },
  
  /**
   * Delete an invoice
   */
  deleteInvoice: async (invoiceId: string): Promise<boolean> => {
    try {
      const response = await ApiService.delete(`/invoices/${invoiceId}`);
      
      return response.success;
    } catch (error) {
      console.error(`Error deleting invoice ${invoiceId}:`, error);
      throw error;
    }
  }
};

export default InvoiceService;
