
import { ApiService, ApiResponse } from './ApiService';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

interface ApiNotificationsResponse extends ApiResponse {
  notifications: Notification[];
  total: number;
}

interface ApiNotificationResponse extends ApiResponse {
  notification: Notification;
}

export const NotificationService = {
  /**
   * Get all notifications
   */
  getNotifications: async (page = 1, limit = 10): Promise<{ notifications: Notification[], total: number }> => {
    try {
      const response = await ApiService.get<ApiNotificationsResponse>('/notifications', { page, limit });
      
      if (response.success) {
        return {
          notifications: response.notifications,
          total: response.total
        };
      } else {
        throw new Error(response.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },
  
  /**
   * Mark notification as read
   */
  markAsRead: async (id: string): Promise<Notification> => {
    try {
      const response = await ApiService.put<ApiNotificationResponse>(`/notifications/${id}/read`);
      
      if (response.success) {
        return response.notification;
      } else {
        throw new Error(response.message || 'Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },
  
  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ success: boolean }> => {
    try {
      const response = await ApiService.put<ApiResponse>('/notifications/read-all');
      
      return {
        success: response.success
      };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },
  
  /**
   * Delete a notification
   */
  deleteNotification: async (id: string): Promise<{ success: boolean }> => {
    try {
      const response = await ApiService.delete<ApiResponse>(`/notifications/${id}`);
      
      return {
        success: response.success
      };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
};

export default NotificationService;
