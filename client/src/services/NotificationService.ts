import api from './api';

export interface Notification {
  _id: string;
  userId?: string;
  gymId?: string;
  type: 'booking_created' | 'customer_created' | 'booking_updated' | 'booking_cancelled' | 'invoice_created' | 'invoice_paid' | 'broadcast' | 'general' | string;
  title: string;
  message: string;
  data: Record<string, any>;
  read?: boolean;
  createdAt: string;
  expiresAt?: string;
  broadcast?: boolean;
}

export interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
}

export interface SingleNotificationResponse {
  success: boolean;
  notification: Notification;
}

class NotificationService {
  async getNotifications() {
    try {
      const response = await api.get('/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string) {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead() {
    try {
      const response = await api.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/notifications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async getGymNotifications(gymId: string) {
    try {
      const response = await api.get(`/notifications/gym`, { params: { gymId } });
      return response.data;
    } catch (error) {
      console.error('Error fetching gym notifications:', error);
      throw error;
    }
  }

  async createGymNotification({ gymId, title, message, type, data, expiresAt, broadcast }: { gymId?: string; title: string; message: string; type: string; data?: Record<string, any>; expiresAt?: string; broadcast?: boolean }) {
    try {
      const response = await api.post(`/notifications/gym`, { gymId, title, message, type, data, expiresAt, broadcast });
      return response.data;
    } catch (error) {
      console.error('Error creating gym notification:', error);
      throw error;
    }
  }
}

export default new NotificationService();
