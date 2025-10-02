
import { apiClient } from './ApiService';

export interface AttendanceRecord {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    membershipType?: string;
  };
  gymId: string;
  gymCode: string;
  markedAt: string;
  dateKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceStats {
  totalToday: number;
  currentlyIn: number;
  membersToday: number;
  staffToday: number;
}

export interface CheckInData {
  userId: string;
  gymId: string;
  gymCode: string;
}

export interface CheckOutData {
  attendanceId: string;
  checkOutMethod?: 'QR' | 'Biometric' | 'Manual';
}

export interface AttendanceFilterOptions {
  date?: string;
  startDate?: string;
  endDate?: string;
  type?: 'Member' | 'Staff' | 'All';
  status?: 'Checked In' | 'Checked Out' | 'All';
  page?: number;
  limit?: number;
}

const AttendanceService = {
  /**
   * Get attendance records with optional filters
   */
  getAttendance: async (
    filters?: AttendanceFilterOptions
  ): Promise<{ attendance: AttendanceRecord[]; stats: AttendanceStats; total: number }> => {
    try {
      const response = await apiClient.get('/attendance', { params: filters });
      
      return {
        attendance: response.data.attendance,
        stats: response.data.stats,
        total: response.data.total
      };
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      throw error;
    }
  },
  
  /**
   * Get attendance statistics
   */
  getAttendanceStats: async (): Promise<AttendanceStats> => {
    try {
      const response = await apiClient.get('/attendance/stats');
      return response.data.stats;
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      throw error;
    }
  },
  
  /**
   * Record check-in for a member or staff
   */
  checkIn: async (data: CheckInData): Promise<AttendanceRecord> => {
    try {
      const response = await apiClient.post('/attendance/check-in', data);
      return response.data.attendance;
    } catch (error) {
      console.error('Error recording check-in:', error);
      throw error;
    }
  },
  
  /**
   * Record check-out for a member or staff
   */
  checkOut: async (data: CheckOutData): Promise<AttendanceRecord> => {
    try {
      const response = await apiClient.put(`/attendance/check-out/${data.attendanceId}`, {
        checkOutMethod: data.checkOutMethod
      });
      return response.data.attendance;
    } catch (error) {
      console.error('Error recording check-out:', error);
      throw error;
    }
  },
  
  /**
   * Check-in with QR code
   */
  qrCheckIn: async (qrCode: string): Promise<AttendanceRecord> => {
    try {
      const response = await apiClient.post('/attendance/qr-check-in', { qrCode });
      return response.data.attendance;
    } catch (error) {
      console.error('Error with QR check-in:', error);
      throw error;
    }
  },
  
  /**
   * Check-out with QR code
   */
  qrCheckOut: async (qrCode: string): Promise<AttendanceRecord> => {
    try {
      const response = await apiClient.post('/attendance/qr-check-out', { qrCode });
      return response.data.attendance;
    } catch (error) {
      console.error('Error with QR check-out:', error);
      throw error;
    }
  },
  
  /**
   * Get all active check-ins (people currently in the facility)
   */
  getActiveCheckIns: async (): Promise<AttendanceRecord[]> => {
    try {
      const response = await apiClient.get('/attendance/active');
      return response.data.activeCheckIns;
    } catch (error) {
      console.error('Error fetching active check-ins:', error);
      throw error;
    }
  },
  
  /**
   * Delete an attendance record (admin function)
   */
  deleteAttendanceRecord: async (attendanceId: string): Promise<boolean> => {
    try {
      const response = await apiClient.delete(`/attendance/${attendanceId}`);
      return response.data.success;
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      throw error;
    }
  }
};

export default AttendanceService;
