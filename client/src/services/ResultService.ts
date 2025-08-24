import { ApiService } from './ApiService';

export interface Result {
  _id: string;
  gymId: string;
  userId: string;
  description: string;
  imageBase64?: string;
  weight?: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface ResultListResponse {
  success: boolean;
  data: Result[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface ResultResponse {
  success: boolean;
  data: Result;
}

export const ResultService = {
  // Get all results with pagination and sorting
  list: async (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    startDate?: string;
    endDate?: string;
  }): Promise<ResultListResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    const url = `/gym/results${queryString ? `?${queryString}` : ''}`;
    
    const response = await ApiService.get<ResultListResponse>(url);
    return response;
  },

  // Get a specific result by ID
  get: async (id: string): Promise<ResultResponse> => {
    const response = await ApiService.get<ResultResponse>(`/gym/results/${id}`);
    return response;
  },

  // Get results for a specific user
  getByUser: async (userId: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ResultListResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const queryString = queryParams.toString();
    const url = `/gym/results/user/${userId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await ApiService.get<ResultListResponse>(url);
    return response;
  }
};
