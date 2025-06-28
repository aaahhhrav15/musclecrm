import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar, 
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Award,
  Clock,
  UserCheck,
  UserX,
  ShoppingCart,
  CreditCard,
  Eye,
  Download,
  Filter,
  RefreshCw,
  Building2,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useIndustry } from '@/context/IndustryContext';
import { useGym } from '@/context/GymContext';
import AnalyticsService, { 
  AnalyticsData, 
  TimeRangeData,
  type AnalyticsMetrics,
  type AnalyticsTrends 
} from '@/services/AnalyticsService';
import { useToast } from '@/hooks/use-toast';

interface ChartDataItem {
  label: string;
  value: number;
  color?: string;
}

// Optimized Chart Components with better performance
const LineChartComponent = React.memo(({ data, title }: { data: ChartDataItem[], title: string }) => {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);
  
  return (
    <Card className="p-6 h-80">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <LineChart className="h-4 w-4 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-48">
        <div className="relative h-full">
          <div className="absolute inset-0 flex items-end justify-between px-2 pb-4">
            {data.slice(-10).map((item, index) => (
              <div key={index} className="flex flex-col items-center flex-1 mx-1">
                <div 
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                  style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: '2px' }}
                  title={`${item.label}: ${item.value}`}
                />
                <span className="text-xs text-muted-foreground mt-1 rotate-45 origin-left">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

const PieChartComponent = React.memo(({ data, title }: { data: ChartDataItem[], title: string }) => {
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
  
  return (
    <Card className="p-6 h-80">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <PieChart className="h-4 w-4 text-purple-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.value / total * 100) : 0;
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-3 h-3 rounded-full ${item.color || 'bg-gray-400'}`}
                  />
                  <span className="text-sm">{item.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{item.value}</div>
                  <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

const BarChartComponent = React.memo(({ data, title }: { data: ChartDataItem[], title: string }) => {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);
  
  return (
    <Card className="p-6 h-80">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-green-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-48">
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{item.label}</span>
                <span className="font-semibold">{item.value}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

// Optimized Metric Card Component
interface MetricCardProps {
  title: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  format: 'currency' | 'number' | 'percentage';
  isLoading: boolean;
  delay: number;
}

const MetricCard = React.memo(({ title, value, change, icon, format, isLoading, delay }: MetricCardProps) => {
  const formatValue = (val: number, fmt: string) => {
    switch (fmt) {
      case 'currency':
        return formatCurrency(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString();
    }
  };

  const isPositive = change >= 0;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{formatValue(value, format)}</p>
                <div className="flex items-center space-x-1">
                  {isPositive ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(change).toFixed(1)}%
                  </span>
                  <span className="text-sm text-muted-foreground">vs last period</span>
                </div>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
              <div className={isPositive ? 'text-green-600' : 'text-red-600'}>
                {icon}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

const AnalyticsPage: React.FC = () => {
  useRequireAuth();
  const { selectedIndustry } = useIndustry();
  const { gym } = useGym();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState('30d');

  // Fetch comprehensive analytics data with optimized caching
  const {
    data: analyticsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['analytics-comprehensive', gym?._id, timeRange],
    queryFn: () => AnalyticsService.getComprehensiveAnalytics(timeRange),
    enabled: !!gym?._id,
    staleTime: 3 * 60 * 1000, // 3 minutes stale time
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch time range data for detailed charts
  const {
    data: timeRangeData,
    isLoading: timeRangeLoading
  } = useQuery({
    queryKey: ['analytics-time-range', gym?._id, timeRange],
    queryFn: () => AnalyticsService.getTimeRangeAnalytics(timeRange),
    enabled: !!gym?._id,
    staleTime: 3 * 60 * 1000,
  });

  // Real-time data polling (lightweight)
  const { data: realTimeData } = useQuery({
    queryKey: ['analytics-realtime', gym?._id],
    queryFn: () => AnalyticsService.getRealTimeAnalytics(),
    enabled: !!gym?._id,
    refetchInterval: 30 * 1000, // Every 30 seconds
    staleTime: 0,
  });

  const handleRefresh = () => {
    // Invalidate all analytics queries for fresh data
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    toast({
      title: "Refreshing data...",
      description: "Analytics data is being updated.",
    });
  };

  const handleExport = async () => {
    try {
      const blob = await AnalyticsService.exportAnalytics(timeRange, 'csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gym-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export successful",
        description: "Analytics data has been exported.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export analytics data.",
        variant: "destructive",
      });
    }
  };

  // Memoized data to prevent unnecessary re-renders
  const memoizedAnalyticsData = useMemo(() => {
    if (!analyticsData) {
      return {
        metrics: {
          totalRevenue: 0,
          totalMembers: 0,
          activeMembers: 0,
          conversionRate: 0,
          avgSessionDuration: 0,
          memberRetention: 0,
          monthlyGrowth: 0,
          customerSatisfaction: 0,
          profitMargin: 0,
          totalBookings: 0,
          totalExpenses: 0
        },
        trends: {
          revenueChange: 0,
          memberChange: 0,
          activeMemberChange: 0
        },
        charts: {
          revenue: [],
          members: [],
          categories: [],
          attendance: []
        },
        revenueBreakdown: [],
        topPerformers: [],
        recentActivities: []
      };
    }
    return analyticsData;
  }, [analyticsData]);

  // Show error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">Error Loading Analytics</h2>
            <p className="text-muted-foreground mt-2">
              {error instanceof Error ? error.message : 'Failed to load analytics data'}
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Show loading state
  if (isLoading || !analyticsData) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96 mt-2" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-20" />
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your {selectedIndustry} performance
              {gym && (
                <span className="flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4" />
                  {gym.name}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="icon" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Real-time Data Banner */}
        {realTimeData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    <span className="font-semibold">Today's Performance</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div>Revenue: {formatCurrency(realTimeData.todayRevenue)}</div>
                    <div>New Members: {realTimeData.todayMembers}</div>
                    <div>Bookings: {realTimeData.todayBookings}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <MetricCard
            title="Total Revenue"
            value={memoizedAnalyticsData.metrics.totalRevenue}
            change={memoizedAnalyticsData.trends.revenueChange}
            icon={<DollarSign className="h-5 w-5" />}
            format="currency"
            isLoading={isLoading}
            delay={0.1}
          />
          <MetricCard
            title="Total Members"
            value={memoizedAnalyticsData.metrics.totalMembers}
            change={memoizedAnalyticsData.trends.memberChange}
            icon={<Users className="h-5 w-5" />}
            format="number"
            isLoading={isLoading}
            delay={0.2}
          />
          <MetricCard
            title="Active Members"
            value={memoizedAnalyticsData.metrics.activeMembers}
            change={memoizedAnalyticsData.trends.activeMemberChange}
            icon={<UserCheck className="h-5 w-5" />}
            format="number"
            isLoading={isLoading}
            delay={0.3}
          />
          <MetricCard
            title="Conversion Rate"
            value={memoizedAnalyticsData.metrics.conversionRate}
            change={-2.1}
            icon={<Target className="h-5 w-5" />}
            format="percentage"
            isLoading={isLoading}
            delay={0.4}
          />
        </motion.div>

        {/* Charts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LineChartComponent 
                  data={memoizedAnalyticsData.charts.revenue} 
                  title="Revenue Trend" 
                />
                <PieChartComponent 
                  data={memoizedAnalyticsData.charts.categories} 
                  title="Membership Distribution" 
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BarChartComponent 
                  data={memoizedAnalyticsData.charts.attendance} 
                  title="Weekly Attendance" 
                />
                <Card className="p-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Key Performance Indicators
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {memoizedAnalyticsData.metrics.avgSessionDuration}min
                        </div>
                        <div className="text-sm text-blue-600">Avg Session Duration</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {memoizedAnalyticsData.metrics.memberRetention}%
                        </div>
                        <div className="text-sm text-green-600">Member Retention</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {memoizedAnalyticsData.metrics.monthlyGrowth}%
                        </div>
                        <div className="text-sm text-purple-600">Monthly Growth</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {memoizedAnalyticsData.metrics.customerSatisfaction}/5
                        </div>
                        <div className="text-sm text-orange-600">Customer Satisfaction</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LineChartComponent 
                  data={memoizedAnalyticsData.charts.revenue} 
                  title="Revenue Analysis" 
                />
                <Card className="p-6">
                  <CardHeader>
                    <CardTitle>Revenue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {memoizedAnalyticsData.revenueBreakdown.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span>{item.category}</span>
                          <span className="font-semibold">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="members" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LineChartComponent 
                  data={memoizedAnalyticsData.charts.members} 
                  title="Member Growth" 
                />
                <PieChartComponent 
                  data={memoizedAnalyticsData.charts.categories} 
                  title="Membership Types" 
                />
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BarChartComponent 
                  data={memoizedAnalyticsData.charts.attendance} 
                  title="Attendance Performance" 
                />
                <Card className="p-6">
                  <CardHeader>
                    <CardTitle>Top Performers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {memoizedAnalyticsData.topPerformers.map((performer, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <div className="font-medium">{performer.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {performer.members} members • {formatCurrency(performer.revenue)}
                            </div>
                          </div>
                          <Badge variant={performer.growth > 10 ? 'default' : 'secondary'}>
                            +{performer.growth}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {memoizedAnalyticsData.recentActivities.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{activity.action}</div>
                        <div className="text-sm text-muted-foreground">
                          by {activity.user} • {new Date(activity.time).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {activity.amount > 0 && (
                      <Badge variant="outline">
                        {formatCurrency(activity.amount)}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;