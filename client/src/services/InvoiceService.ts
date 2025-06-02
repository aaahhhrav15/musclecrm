import axios from 'axios';
import { API_URL } from '@/config';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  _id: string;
  bookingId: string;
  customerId: string | { _id: string; name: string; email: string };
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'cancelled';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItem[];
}

export interface CreateInvoiceData {
  bookingId: string;
  customerId: string;
  amount: number;
  currency: string;
  dueDate: string;
  items: InvoiceItem[];
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

  static async createInvoice(data: CreateInvoiceData): Promise<Invoice> {
    try {
      const response = await axios.post(`${API_URL}/invoices`, data, {
        withCredentials: true
      });
      return response.data.invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  static async downloadInvoice(id: string): Promise<Blob> {
    try {
      const response = await axios.get(`${API_URL}/invoices/${id}/pdf`, {
        responseType: 'blob',
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error;
    }
  }

  static async updateInvoiceStatus(id: string, status: 'paid' | 'cancelled'): Promise<Invoice> {
    try {
      const response = await axios.patch(`${API_URL}/invoices/${id}/status`, { status }, {
        withCredentials: true
      });
      return response.data.invoice;
    } catch (error) {
      console.error('Error updating invoice status:', error);
      throw error;
    }
  }
}

export default InvoiceService;
