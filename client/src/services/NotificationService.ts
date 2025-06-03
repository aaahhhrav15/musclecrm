import axios from 'axios';
import { API_URL } from '@/config';

export interface Notification {
  _id: string;
  userId: string;
  type: 'booking_created' | 'customer_created' | 'booking_updated' | 'booking_cancelled' | 'invoice_created' | 'invoice_paid';
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
}

export interface SingleNotificationResponse {
  success: boolean;
  notification: Notification;
}

export class NotificationService {
  static async getNotifications(): Promise<NotificationResponse> {
    try {
      const response = await axios.get(`${API_URL}/notifications`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  static async markAsRead(id: string): Promise<SingleNotificationResponse> {
    try {
      const response = await axios.put(`${API_URL}/notifications/${id}/read`, {}, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.put(`${API_URL}/notifications/read-all`, {}, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  static async deleteNotification(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.delete(`${API_URL}/notifications/${id}`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}

export default NotificationService;
