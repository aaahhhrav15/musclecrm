
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export interface Purchase {
  _id: string;
  userId: string;
  industry: string;
  purchaseDate: string;
  amount: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  stripeSessionId?: string;
}

export interface PurchaseCheckResponse {
  success: boolean;
  hasPurchased: boolean;
  purchase: Purchase | null;
}

export interface PurchasesResponse {
  success: boolean;
  purchases: Purchase[];
}

export interface CreatePurchaseResponse {
  success: boolean;
  message: string;
  purchase: Purchase;
}

export const PurchaseService = {
  // Check if user has purchased a specific industry CRM
  checkPurchase: async (industry: string): Promise<PurchaseCheckResponse> => {
    const response = await axios.get(`${API_URL}/purchases/check/${industry}`, {
      withCredentials: true
    });
    return response.data;
  },

  // Get all user purchases
  getUserPurchases: async (): Promise<PurchasesResponse> => {
    const response = await axios.get(`${API_URL}/purchases/my-purchases`, {
      withCredentials: true
    });
    return response.data;
  },

  // Create a new purchase
  createPurchase: async (industry: string, amount?: number, stripeSessionId?: string): Promise<CreatePurchaseResponse> => {
    const response = await axios.post(`${API_URL}/purchases/create`, {
      industry,
      amount,
      stripeSessionId
    }, {
      withCredentials: true
    });
    return response.data;
  }
};
