import axios, { AxiosError } from 'axios';
import { API_URL } from '@/config';

export interface Booking {
  _id: string;
  userId: string;
  customerId: string | { _id: string; name: string; email: string; phone: string };
  type: 'class' | 'personal_training' | 'equipment';
  startTime: string;
  endTime: string;
  classId?: string | { _id: string; name: string };
  className?: string;
  trainerId?: string | { _id: string; name: string };
  trainerName?: string;
  equipmentId?: string | { _id: string; name: string };
  equipmentName?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  price: number;
  currency: string;
  invoiceId?: string;
}

export interface BookingFilters {
  page?: number;
  limit?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
  trainerId?: string;
  classId?: string;
  customerId?: string;
  status?: string;
}

export interface CreateBookingData {
  customerId: string;
  type: 'class' | 'personal_training' | 'equipment';
  startTime: string;
  endTime: string;
  classId?: string;
  className?: string;
  trainerId?: string;
  trainerName?: string;
  equipmentId?: string;
  equipmentName?: string;
  notes?: string;
  price: number;
  currency: string;
}

export interface UpdateBookingData {
  startTime?: string;
  endTime?: string;
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  price?: number;
}

export interface BookingResponse {
  success: boolean;
  bookings: Booking[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SingleBookingResponse {
  success: boolean;
  booking: Booking;
}

export interface CalendarResponse {
  success: boolean;
  bookings: Booking[];
}

export class BookingService {
  private static handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message: string; errors?: string[] }>;
      const response = axiosError.response?.data;
      
      if (response?.errors) {
        throw new Error(response.errors.join('\n'));
      }
      
      const message = response?.message || axiosError.message;
      throw new Error(message);
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }

  static async getBookings(filters: BookingFilters = {}): Promise<BookingResponse> {
    try {
      const response = await axios.get(`${API_URL}/bookings`, {
        params: filters,
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      BookingService.handleError(error);
      throw error;
    }
  }

  static async getCalendarData(startDate: string, endDate: string, type?: string): Promise<CalendarResponse> {
    try {
      const response = await axios.get(`${API_URL}/bookings/calendar`, {
        params: { startDate, endDate, type },
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      BookingService.handleError(error);
      throw error;
    }
  }

  static async getBooking(id: string): Promise<SingleBookingResponse> {
    try {
      const response = await axios.get(`${API_URL}/bookings/${id}`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      BookingService.handleError(error);
      throw error;
    }
  }

  static async createBooking(data: CreateBookingData): Promise<{ success: boolean; message?: string; booking?: Booking; invoiceError?: string }> {
    try {
      console.log('Creating booking with data:', data);
      const response = await axios.post(`${API_URL}/bookings`, data, {
        withCredentials: true
      });
      console.log('Booking creation response:', response.data);
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Booking created successfully',
          booking: response.data.booking
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to create booking'
        };
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  static async updateBooking(id: string, data: Partial<Booking>): Promise<Booking> {
    try {
      console.log('Updating booking with data:', { id, data });
      const response = await axios.put(`${API_URL}/bookings/${id}`, data, {
        withCredentials: true
      });
      return response.data.booking;
    } catch (error) {
      BookingService.handleError(error);
      throw error;
    }
  }

  static async deleteBooking(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.delete(`${API_URL}/bookings/${id}`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      BookingService.handleError(error);
      throw error;
    }
  }
}

export default BookingService;
