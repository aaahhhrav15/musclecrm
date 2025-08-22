import { ApiService } from './ApiService';

export interface Product {
  _id?: string;
  name: string;
  sku: string;
  price: number;
  imageBase64: string; // data URL or base64
  overview?: string;
  keyBenefits?: string[];
  fastFacts?: string;
  usage?: string;
  marketedBy?: string;
  manufacturedBy?: string;
  disclaimer?: string;
  storage?: string;
  shelfLife?: string;
  customerId?: string;
  customer?: {
    _id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export const ProductService = {
  list: async () => {
    return ApiService.get<{ success: boolean; data: Product[] }>(`/gym/products`);
  },
  get: async (id: string) => {
    return ApiService.get<{ success: boolean; data: Product }>(`/gym/products/${id}`);
  },
  create: async (payload: Product) => {
    return ApiService.post<{ success: boolean; data: Product }>(`/gym/products`, payload);
  },
  update: async (id: string, payload: Partial<Product>) => {
    return ApiService.put<{ success: boolean; data: Product }>(`/gym/products/${id}`, payload);
  },
  remove: async (id: string) => {
    return ApiService.delete<{ success: boolean; data: Record<string, never> }>(`/gym/products/${id}`);
  },
};


