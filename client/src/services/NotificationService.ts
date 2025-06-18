import api from './api';

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
}

export default new NotificationService();
