import axios from 'axios';
import { API_URL } from '@/lib/constants';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerId: string | { _id: string; name: string; email: string };
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  bookingId?: string | { _id: string; type: string; startTime: string; endTime: string };
  amount: number;
  currency: string;
  dueDate: string;
  items: InvoiceItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceData {
  customerId: string;
  amount: number;
  currency: string;
  dueDate: string;
  items: InvoiceItem[];
  notes?: string;
}

export interface UpdateInvoiceData {
  amount?: number;
  currency?: string;
  dueDate?: string;
  items?: InvoiceItem[];
  notes?: string;
}

export interface CreateInvoiceResponse {
  success: boolean;
  data: Invoice;
  transaction?: {
    _id: string;
    userId: string;
    gymId: string;
    transactionType: string;
    transactionDate: string;
    amount: number;
    membershipType: string;
    paymentMode: string;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
}

export class InvoiceService {
  static async getInvoices(): Promise<Invoice[]> {
    try {
      const response = await axios.get(`${API_URL}/invoices`, {
        withCredentials: true
      });
      return response.data.invoices;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  static async getInvoice(id: string): Promise<Invoice> {
    try {
      const response = await axios.get(`${API_URL}/invoices/${id}`, {
        withCredentials: true
      });
      return response.data.invoice;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  }

  static async createInvoice(data: CreateInvoiceData): Promise<CreateInvoiceResponse> {
    try {
      const response = await axios.post(`${API_URL}/invoices`, data, {
        withCredentials: true
      });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create invoice');
      }
      return response.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  static async updateInvoice(id: string, data: UpdateInvoiceData): Promise<Invoice> {
    try {
      const response = await axios.put(`${API_URL}/invoices/${id}`, data, {
        withCredentials: true
      });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update invoice');
      }
      return response.data.invoice;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  static async deleteInvoice(id: string): Promise<void> {
    try {
      const response = await axios.delete(`${API_URL}/invoices/${id}`, {
        withCredentials: true
      });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete invoice');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  static async downloadInvoice(id: string): Promise<Blob> {
    try {
      const response = await axios.get(`${API_URL}/invoices/${id}/pdf`, {
        withCredentials: true,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading invoice:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      throw error;
    }
  }
}

export default InvoiceService;
