import axiosInstance from '@/lib/axios';

export interface AnalyticsMetrics {
  totalRevenue: number;
  totalMembers: number;
  activeMembers: number;
  conversionRate: number;
  avgSessionDuration: number;
  memberRetention: number;
  monthlyGrowth: number;
  customerSatisfaction: number;
  profitMargin: number;
  totalBookings: number;
  totalExpenses: number;
}

export interface AnalyticsTrends {
  revenueChange: number;
  memberChange: number;
  activeMemberChange: number;
}

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export interface RevenueBreakdown {
  category: string;
  amount: number;
}

export interface TopPerformer {
  name: string;
  revenue: number;
  members: number;
  growth: number;
}

export interface RecentActivity {
  type: string;
  action: string;
  user: string;
  time: string;
  amount: number;
}

export interface AnalyticsData {
  metrics: AnalyticsMetrics;
  trends: AnalyticsTrends;
  charts: {
    revenue: ChartData[];
    members: ChartData[];
    categories: ChartData[];
    attendance: ChartData[];
  };
  revenueBreakdown: RevenueBreakdown[];
  topPerformers: TopPerformer[];
  recentActivities: RecentActivity[];
}

export interface TimeRangeData {
  revenue: Array<{ date: string; value: number }>;
  members: Array<{ date: string; value: number }>;
  bookings: Array<{ date: string; value: number }>;
  attendance: Array<{ date: string; value: number }>;
}

class AnalyticsService {
  private baseURL = '/api/analytics';

  /**
   * Get comprehensive analytics data
   */
  async getComprehensiveAnalytics(timeRange: string = '30d'): Promise<AnalyticsData> {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/comprehensive`, {
        params: { timeRange }
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching comprehensive analytics:', error);
      throw error;
    }
  }

  /**
   * Get analytics data for specific time range
   */
  async getTimeRangeAnalytics(timeRange: string = '30d'): Promise<TimeRangeData> {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/time-range`, {
        params: { timeRange }
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch time range analytics');
      }
    } catch (error) {
      console.error('Error fetching time range analytics:', error);
      throw error;
    }
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(timeRange: string = '30d', format: 'csv' | 'pdf' = 'csv'): Promise<Blob> {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/export`, {
        params: { timeRange, format },
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw error;
    }
  }

  /**
   * Get real-time analytics updates
   */
  async getRealTimeAnalytics(): Promise<Partial<AnalyticsData>> {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/realtime`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch real-time analytics');
      }
    } catch (error) {
      console.error('Error fetching real-time analytics:', error);
      throw error;
    }
  }

  /**
   * Get analytics for specific gym
   */
  async getGymAnalytics(gymId: string, timeRange: string = '30d'): Promise<AnalyticsData> {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/gym/${gymId}`, {
        params: { timeRange }
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch gym analytics');
      }
    } catch (error) {
      console.error('Error fetching gym analytics:', error);
      throw error;
    }
  }

  /**
   * Get comparative analytics between periods
   */
  async getComparativeAnalytics(
    currentPeriod: string = '30d',
    previousPeriod: string = '30d'
  ): Promise<{
    current: AnalyticsData;
    previous: AnalyticsData;
    comparison: {
      revenueGrowth: number;
      memberGrowth: number;
      bookingGrowth: number;
    };
  }> {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/comparative`, {
        params: { currentPeriod, previousPeriod }
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch comparative analytics');
      }
    } catch (error) {
      console.error('Error fetching comparative analytics:', error);
      throw error;
    }
  }
}

export default new AnalyticsService(); 