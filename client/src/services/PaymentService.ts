import { ApiService } from './ApiService';

export interface Payment {
  _id: string;
  razorpay_order_id: string;
  key_id: string;
  amount: number;
  currency: string;
  customer: {
    name: string;
    phone: string;
  };
  status: 'paid' | 'created' | 'failed';
  meta: {
    order: {
      amount: number;
      amount_due: number;
      amount_paid: number;
      attempts: number;
      created_at: number;
      currency: string;
      entity: string;
      id: string;
      notes: string[];
      offer_id: string | null;
      receipt: string | null;
      status: string;
    };
    products: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      total: number;
    }>;
    gym: {
      id: string;
      name: string;
    };
    isCartCheckout: boolean;
  };
  gymId: string;
  createdAt: string;
  updatedAt: string;
}

export const PaymentService = {
  getPaidPayments: async (): Promise<Payment[]> => {
    const response = await ApiService.get<any>('/payment/paid');
    return response.data;
  },
};
