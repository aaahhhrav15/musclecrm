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
  bookingChange?: number; // Added for booking trends
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

// New interface for real-time data
export interface RealTimeData {
  todayRevenue: number;
  todayMembers: number;
  todayBookings: number;
  lastUpdated: string;
}

// New interface for comparative analytics
export interface ComparativeAnalytics {
  current: AnalyticsData;
  previous: AnalyticsData;
  comparison: {
    revenueGrowth: number;
    memberGrowth: number;
    bookingGrowth: number;
  };
}

class AnalyticsService {
  private baseURL = '/analytics';

  /**
   * Get comprehensive analytics data with optimized caching
   */
  async getComprehensiveAnalytics(timeRange: string = '30d'): Promise<AnalyticsData> {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/comprehensive`, {
        params: { timeRange },
        // Add request timeout for better UX
        timeout: 10000
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching comprehensive analytics:', error);
      
      // Enhanced error handling
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - please try again');
      }
      
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid request parameters');
      }
      
      if (error.response?.status >= 500) {
        throw new Error('Server error - please try again later');
      }
      
      throw error;
    }
  }

  /**
   * Get analytics data for specific time range with better error handling
   */
  async getTimeRangeAnalytics(timeRange: string = '30d'): Promise<TimeRangeData> {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/time-range`, {
        params: { timeRange },
        timeout: 8000
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch time range analytics');
      }
    } catch (error) {
      console.error('Error fetching time range analytics:', error);
      
      // Return empty data structure on error to prevent UI crashes
      if (error.response?.status >= 500) {
        return {
          revenue: [],
          members: [],
          bookings: [],
          attendance: []
        };
      }
      
      throw error;
    }
  }

  /**
   * Export analytics data with enhanced format support
   */
  async exportAnalytics(timeRange: string = '30d', format: 'csv' | 'pdf' | 'json' = 'csv'): Promise<Blob> {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/export`, {
        params: { timeRange, format },
        responseType: 'blob',
        timeout: 15000 // Longer timeout for export operations
      });
      
      return response.data;
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw new Error('Failed to export analytics data. Please try again.');
    }
  }

  /**
   * Get real-time analytics updates (NEW)
   */
  async getRealTimeAnalytics(): Promise<RealTimeData> {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/realtime`, {
        timeout: 5000 // Quick timeout for real-time data
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch real-time analytics');
      }
    } catch (error) {
      console.error('Error fetching real-time analytics:', error);
      
      // Return default data structure for real-time failures
      return {
        todayRevenue: 0,
        todayMembers: 0,
        todayBookings: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Get analytics for specific gym (UPDATED)
   */
  async getGymAnalytics(gymId: string, timeRange: string = '30d'): Promise<AnalyticsData> {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/gym/${gymId}`, {
        params: { timeRange },
        timeout: 10000
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
   * Get comparative analytics between periods (UPDATED)
   */
  async getComparativeAnalytics(
    currentPeriod: string = '30d',
    previousPeriod: string = '30d'
  ): Promise<ComparativeAnalytics> {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/comparative`, {
        params: { currentPeriod, previousPeriod },
        timeout: 12000
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

  /**
   * Cache management utility (NEW)
   */
  async clearAnalyticsCache(): Promise<void> {
    try {
      const response = await axiosInstance.delete(`${this.baseURL}/cache`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to clear cache');
      }
    } catch (error) {
      console.error('Error clearing analytics cache:', error);
      throw error;
    }
  }

  /**
   * Get analytics summary for dashboard widgets (NEW)
   */
  async getAnalyticsSummary(): Promise<{
    totalRevenue: number;
    totalMembers: number;
    activeMembers: number;
    todayBookings: number;
    monthlyGrowth: number;
  }> {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/summary`, {
        timeout: 5000
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch analytics summary');
      }
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      
      // Return default summary on error
      return {
        totalRevenue: 0,
        totalMembers: 0,
        activeMembers: 0,
        todayBookings: 0,
        monthlyGrowth: 0
      };
    }
  }

  /**
   * Get analytics data with retry mechanism (NEW)
   */
  async getAnalyticsWithRetry(
    timeRange: string = '30d',
    maxRetries: number = 3
  ): Promise<AnalyticsData> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.getComprehensiveAnalytics(timeRange);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Analytics fetch attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff: wait 1s, then 2s, then 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * Validate analytics data structure (NEW)
   */
  private validateAnalyticsData(data: any): data is AnalyticsData {
    return (
      data &&
      typeof data === 'object' &&
      data.metrics &&
      data.trends &&
      data.charts &&
      Array.isArray(data.revenueBreakdown) &&
      Array.isArray(data.topPerformers) &&
      Array.isArray(data.recentActivities)
    );
  }

  /**
   * Get analytics with validation (NEW)
   */
  async getValidatedAnalytics(timeRange: string = '30d'): Promise<AnalyticsData> {
    const data = await this.getComprehensiveAnalytics(timeRange);
    
    if (!this.validateAnalyticsData(data)) {
      throw new Error('Invalid analytics data structure received');
    }
    
    return data;
  }

  /**
   * Subscribe to real-time analytics updates (NEW)
   */
  subscribeToRealTimeUpdates(
    callback: (data: RealTimeData) => void,
    intervalMs: number = 30000
  ): () => void {
    let isActive = true;
    
    const fetchAndUpdate = async () => {
      if (!isActive) return;
      
      try {
        const data = await this.getRealTimeAnalytics();
        callback(data);
      } catch (error) {
        console.error('Real-time update failed:', error);
      }
      
      if (isActive) {
        setTimeout(fetchAndUpdate, intervalMs);
      }
    };
    
    // Start immediately
    fetchAndUpdate();
    
    // Return cleanup function
    return () => {
      isActive = false;
    };
  }
}

export default new AnalyticsService();