import { ApiService } from './ApiService';

export interface Accountability {
  _id?: string;
  gymId: string;
  userId: string;
  description: string;
  s3Key?: string; // S3 object key like folder/filename.jpg
  createdAt?: string;
  updatedAt?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface AccountabilityListResponse {
  success: boolean;
  data: Accountability[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface AccountabilityResponse {
  success: boolean;
  data: Accountability;
}

export const AccountabilityService = {
  // Get all accountabilities with pagination
  list: async (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    startDate?: string;
    endDate?: string;
  }): Promise<AccountabilityListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    const url = `/gym/accountabilities${queryString ? `?${queryString}` : ''}`;
    
    const response = await ApiService.get<AccountabilityListResponse>(url);
    return response;
  },

  // Get accountability by ID
  get: async (id: string): Promise<AccountabilityResponse> => {
    return ApiService.get<AccountabilityResponse>(`/gym/accountabilities/${id}`);
  },

  // Get accountabilities by user ID
  getByUser: async (userId: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<AccountabilityListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const url = `/gym/accountabilities/user/${userId}${queryString ? `?${queryString}` : ''}`;
    
    return ApiService.get<AccountabilityListResponse>(url);
  },
};
