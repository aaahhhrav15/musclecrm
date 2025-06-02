import { ApiService, ApiResponse } from './ApiService';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'upi' | 'other';
  paymentStatus: 'pending' | 'paid' | 'partial' | 'failed';
  paidAmount: number;
  remainingAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiInvoicesResponse extends ApiResponse {
  invoices: Array<{
    _id: string;
    invoiceNumber: string;
    customerId: {
      _id: string;
      name: string;
      email: string;
      phone?: string;
      address?: string;
    };
    date: string;
    dueDate: string;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    total: number;
    status: string;
    notes?: string;
    paymentMethod: string;
    paymentStatus: string;
    paidAmount: number;
    remainingAmount: number;
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
}

interface ApiInvoiceResponse extends ApiResponse {
  invoice: {
    _id: string;
    invoiceNumber: string;
    customerId: {
      _id: string;
      name: string;
      email: string;
      phone?: string;
      address?: string;
    };
    date: string;
    dueDate: string;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    total: number;
    status: string;
    notes?: string;
    paymentMethod: string;
    paymentStatus: string;
    paidAmount: number;
    remainingAmount: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface InvoiceFilterOptions {
  search?: string;
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

const mapInvoiceFromApi = (apiInvoice: any): Invoice => ({
  id: apiInvoice._id,
  invoiceNumber: apiInvoice.invoiceNumber,
  customerId: apiInvoice.customerId._id,
  customer: {
    id: apiInvoice.customerId._id,
    name: apiInvoice.customerId.name,
    email: apiInvoice.customerId.email,
    phone: apiInvoice.customerId.phone,
    address: apiInvoice.customerId.address
  },
  date: apiInvoice.date,
  dueDate: apiInvoice.dueDate,
  items: apiInvoice.items,
  subtotal: apiInvoice.subtotal,
  tax: apiInvoice.tax,
  total: apiInvoice.total,
  status: apiInvoice.status,
  notes: apiInvoice.notes,
  paymentMethod: apiInvoice.paymentMethod,
  paymentStatus: apiInvoice.paymentStatus,
  paidAmount: apiInvoice.paidAmount,
  remainingAmount: apiInvoice.remainingAmount,
  createdAt: apiInvoice.createdAt,
  updatedAt: apiInvoice.updatedAt
});

export const InvoiceService = {
  /**
   * Get all invoices with optional filtering
   */
  getInvoices: async (filters: InvoiceFilterOptions = {}): Promise<{ invoices: Invoice[], total: number }> => {
    try {
      const response = await ApiService.get<ApiInvoicesResponse>('/invoices', filters);
      
      if (response.success) {
        const invoices = response.invoices.map(mapInvoiceFromApi);
        return {
          invoices,
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
   * Get a single invoice by ID
   */
  getInvoice: async (id: string): Promise<Invoice> => {
    try {
      const response = await ApiService.get<ApiInvoiceResponse>(`/invoices/${id}`);
      
      if (response.success) {
        return mapInvoiceFromApi(response.invoice);
      } else {
        throw new Error(response.message || 'Failed to fetch invoice');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  },

  /**
   * Create a new invoice
   */
  createInvoice: async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>): Promise<Invoice> => {
    try {
      const response = await ApiService.post<ApiInvoiceResponse>('/invoices', invoiceData);
      
      if (response.success) {
        return mapInvoiceFromApi(response.invoice);
      } else {
        throw new Error(response.message || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },

  /**
   * Update an existing invoice
   */
  updateInvoice: async (id: string, invoiceData: Partial<Invoice>): Promise<Invoice> => {
    try {
      const response = await ApiService.put<ApiInvoiceResponse>(`/invoices/${id}`, invoiceData);
      
      if (response.success) {
        return mapInvoiceFromApi(response.invoice);
      } else {
        throw new Error(response.message || 'Failed to update invoice');
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  },

  /**
   * Delete an invoice
   */
  deleteInvoice: async (id: string): Promise<boolean> => {
    try {
      const response = await ApiService.delete<ApiResponse>(`/invoices/${id}`);
      
      return response.success;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }
};

export default InvoiceService;
