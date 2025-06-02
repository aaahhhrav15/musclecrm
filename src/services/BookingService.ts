
import { ApiService, ApiResponse } from './ApiService';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface Service {
  name: string;
  duration: number;
  price: number;
}

export interface Staff {
  id: string;
  name: string;
}

export interface Booking {
  id: string;
  customer: Customer;
  service: Service;
  staff?: Staff;
  date: string;
  startTime: string;
  endTime: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Completed' | 'No-show';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiBookingsResponse extends ApiResponse {
  bookings: Booking[];
  total: number;
}

interface ApiBookingResponse extends ApiResponse {
  booking: Booking;
}

export interface BookingFilterOptions {
  status?: string;
  date?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}

export const BookingService = {
  /**
   * Get all bookings with optional filtering
   */
  getBookings: async (filters: BookingFilterOptions = {}): Promise<{ bookings: Booking[], total: number }> => {
    try {
      const response = await ApiService.get<ApiBookingsResponse>('/bookings', filters);
      
      if (response.success) {
        return {
          bookings: response.bookings,
          total: response.total
        };
      } else {
        throw new Error(response.message || 'Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },
  
  /**
   * Get a single booking by ID
   */
  getBooking: async (id: string): Promise<Booking> => {
    try {
      const response = await ApiService.get<ApiBookingResponse>(`/bookings/${id}`);
      
      if (response.success) {
        return response.booking;
      } else {
        throw new Error(response.message || 'Failed to fetch booking');
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  },
  
  /**
   * Create a new booking
   */
  createBooking: async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<Booking> => {
    try {
      const response = await ApiService.post<ApiBookingResponse>('/bookings', bookingData);
      
      if (response.success) {
        return response.booking;
      } else {
        throw new Error(response.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing booking
   */
  updateBooking: async (id: string, bookingData: Partial<Booking>): Promise<Booking> => {
    try {
      const response = await ApiService.put<ApiBookingResponse>(`/bookings/${id}`, bookingData);
      
      if (response.success) {
        return response.booking;
      } else {
        throw new Error(response.message || 'Failed to update booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  },
  
  /**
   * Delete a booking
   */
  deleteBooking: async (id: string): Promise<boolean> => {
    try {
      const response = await ApiService.delete<ApiResponse>(`/bookings/${id}`);
      
      return response.success;
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw error;
    }
  }
};

export default BookingService;
