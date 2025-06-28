import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
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
  Building2
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

// Chart components (you can replace these with actual chart libraries like recharts)
const LineChartComponent = ({ data, title }: { data: ChartDataItem[], title: string }) => (
  <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
      </div>
    </div>
    <div className="relative h-48">
      <div className="absolute inset-0 flex items-end justify-between px-4 pb-4">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <div 
              className="w-8 bg-gradient-to-t from-blue-500 to-indigo-500 rounded-t"
              style={{ height: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%` }}
            ></div>
            <span className="text-xs text-gray-500 mt-1">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PieChartComponent = ({ data, title }: { data: ChartDataItem[], title: string }) => (
  <div className="h-64 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
    <h3 className="text-sm font-medium text-gray-700 mb-4">{title}</h3>
    <div className="flex items-center justify-center h-40">
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
        <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-green-500 border-r-blue-500 border-b-purple-500 border-l-orange-500 transform rotate-45"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">{data.length}</div>
            <div className="text-xs text-gray-500">Categories</div>
          </div>
        </div>
      </div>
    </div>
    <div className="flex justify-center space-x-4 mt-4">
      {data.map((item, index) => (
        <div key={index} className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-1 ${item.color}`}></div>
          <span className="text-xs text-gray-600">{item.label}</span>
        </div>
      ))}
    </div>
  </div>
);

const BarChartComponent = ({ data, title }: { data: ChartDataItem[], title: string }) => (
  <div className="h-64 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
    <h3 className="text-sm font-medium text-gray-700 mb-4">{title}</h3>
    <div className="relative h-48">
      <div className="absolute inset-0 flex items-end justify-between px-4 pb-4">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <div 
              className="w-6 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t"
              style={{ height: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%` }}
            ></div>
            <span className="text-xs text-gray-500 mt-1">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  format?: 'number' | 'currency' | 'percentage';
  isLoading?: boolean;
  delay?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  format = 'number',
  isLoading,
  delay = 0,
}) => {
  const formatValue = (val: string | number) => {
    if (format === 'currency') {
      return formatCurrency(typeof val === 'string' ? parseFloat(val) : val);
    }
    if (format === 'percentage') {
      return `${val}%`;
    }
    return typeof val === 'string' ? val : val.toLocaleString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            {React.cloneElement(icon as React.ReactElement, {
              className: 'h-4 w-4 text-primary',
            })}
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="text-2xl font-bold">{formatValue(value)}</div>
          )}
          <div className="flex items-center mt-2">
            {change >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(change)}%
            </span>
            <span className="text-sm text-muted-foreground ml-1">vs last month</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const AnalyticsPage: React.FC = () => {
  useRequireAuth();
  const { selectedIndustry } = useIndustry();
  const { gym } = useGym();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState('30d');

  // Fetch analytics data
  const {
    data: analyticsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['analytics', gym?._id, timeRange],
    queryFn: () => AnalyticsService.getComprehensiveAnalytics(timeRange),
    enabled: !!gym?._id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Fetch time range data for detailed charts
  const {
    data: timeRangeData,
    isLoading: timeRangeLoading
  } = useQuery({
    queryKey: ['analytics-time-range', gym?._id, timeRange],
    queryFn: () => AnalyticsService.getTimeRangeAnalytics(timeRange),
    enabled: !!gym?._id,
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = () => {
    refetch();
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
      a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
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

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <MetricCard
            title="Total Revenue"
            value={analyticsData.metrics.totalRevenue}
            change={analyticsData.trends.revenueChange}
            icon={<DollarSign />}
            format="currency"
            isLoading={isLoading}
            delay={0.1}
          />
          <MetricCard
            title="Total Members"
            value={analyticsData.metrics.totalMembers}
            change={analyticsData.trends.memberChange}
            icon={<Users />}
            format="number"
            isLoading={isLoading}
            delay={0.2}
          />
          <MetricCard
            title="Active Members"
            value={analyticsData.metrics.activeMembers}
            change={analyticsData.trends.activeMemberChange}
            icon={<UserCheck />}
            format="number"
            isLoading={isLoading}
            delay={0.3}
          />
          <MetricCard
            title="Conversion Rate"
            value={analyticsData.metrics.conversionRate}
            change={-2.1}
            icon={<Target />}
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
                <LineChartComponent data={analyticsData.charts.revenue} title="Revenue Trend" />
                <PieChartComponent data={analyticsData.charts.categories} title="Membership Distribution" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BarChartComponent data={analyticsData.charts.attendance} title="Weekly Attendance" />
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
                        <div className="text-2xl font-bold text-blue-600">{analyticsData.metrics.avgSessionDuration}min</div>
                        <div className="text-sm text-blue-600">Avg Session Duration</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{analyticsData.metrics.memberRetention}%</div>
                        <div className="text-sm text-green-600">Member Retention</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{analyticsData.metrics.monthlyGrowth}%</div>
                        <div className="text-sm text-purple-600">Monthly Growth</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{analyticsData.metrics.customerSatisfaction}/5</div>
                        <div className="text-sm text-orange-600">Customer Satisfaction</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LineChartComponent data={analyticsData.charts.revenue} title="Revenue Analysis" />
                <Card className="p-6">
                  <CardHeader>
                    <CardTitle>Revenue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyticsData.revenueBreakdown.map((item, index) => (
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
                <LineChartComponent data={analyticsData.charts.members} title="Member Growth" />
                <PieChartComponent data={analyticsData.charts.categories} title="Membership Types" />
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BarChartComponent data={analyticsData.charts.attendance} title="Attendance Performance" />
                <Card className="p-6">
                  <CardHeader>
                    <CardTitle>Top Performers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyticsData.topPerformers.map((performer, index) => (
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
                <Clock className="h-5 w-5" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'membership' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'payment' ? 'bg-green-100 text-green-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {activity.type === 'membership' ? <Users className="h-4 w-4" /> :
                         activity.type === 'payment' ? <CreditCard className="h-4 w-4" /> :
                         <Calendar className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="font-medium">{activity.action}</div>
                        <div className="text-sm text-muted-foreground">
                          {activity.user} • {new Date(activity.time).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(activity.amount)}</div>
                    </div>
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