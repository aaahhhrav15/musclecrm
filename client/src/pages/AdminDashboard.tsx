import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Users, 
  Building2, 
  UserCheck, 
  FileText, 
  Calendar, 
  CreditCard, 
  TrendingUp,
  LogOut,
  RefreshCw,
  Eye,
  Shield,
  ArrowLeft,
  Home,
  Activity,
  AlertCircle,
  Search,
  Filter,
  X,
  ChevronDown,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axiosInstance from '@/lib/axios';
import { useNavigate, useLocation } from 'react-router-dom';

interface OverviewStats {
  totalUsers: number;
  totalGyms: number;
  totalCustomers: number;
  totalInvoices: number;
  totalRevenue: number;
  activeSubscriptions: number;
  subscriptionStats: {
    registeredGyms: number;
    activeGyms: number;
    expiredGyms: number;
  };
}

interface Gym {
  _id: string;
  name: string;
  gymCode: string;
  createdAt: string;
  logo?: string;
  address?: any;
  contactInfo?: any;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  subscriptionStatus: 'registered' | 'active' | 'expired';
  memberCount: number;
  pendingMonths?: number;
}

interface IndustryStats {
  industry: string;
  count: number;
  gymCount: number;
}

const AdminDashboard: React.FC = () => {
  const { admin, logout } = useAdminAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [filteredGyms, setFilteredGyms] = useState<Gym[]>([]);
  const [industryStats, setIndustryStats] = useState<IndustryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [memberCountFilter, setMemberCountFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [pendingMonthsFilter, setPendingMonthsFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  const fetchOverviewStats = async () => {
    try {
      const response = await axiosInstance.get('/admin/dashboard/overview');
      if (response.data.success) {
        setOverviewStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching overview stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch overview statistics",
        variant: "destructive",
      });
    }
  };

  const fetchGyms = async () => {
    try {
      const response = await axiosInstance.get('/admin/dashboard/gyms');
      if (response.data.success) {
        setGyms(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching gyms:', error);
      toast({
        title: "Error",
        description: "Failed to fetch gym data",
        variant: "destructive",
      });
    }
  };

  const fetchIndustryStats = async () => {
    try {
      const response = await axiosInstance.get('/admin/dashboard/users-by-industry');
      if (response.data.success) {
        setIndustryStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching industry stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch industry statistics",
        variant: "destructive",
      });
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchOverviewStats(),
      fetchGyms(),
      fetchIndustryStats()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handle tab state from navigation
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const handleLogout = async () => {
    await logout();
  };

  const handleViewGym = (gymId: string) => {
    navigate(`/admin/gym/${gymId}`, { 
      state: { 
        returnTab: activeTab,
        returnUrl: '/admin/dashboard' 
      } 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Filter and sort gyms
  useEffect(() => {
    let filtered = [...gyms];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(gym => 
        gym.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gym.gymCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(gym => gym.subscriptionStatus === statusFilter);
    }

    // Member count filter
    if (memberCountFilter !== 'all') {
      const ranges = {
        '0-10': (count: number) => count >= 0 && count <= 10,
        '11-50': (count: number) => count >= 11 && count <= 50,
        '51-100': (count: number) => count >= 51 && count <= 100,
        '100+': (count: number) => count > 100
      };
      filtered = filtered.filter(gym => ranges[memberCountFilter as keyof typeof ranges](gym.memberCount));
    }

    // Date range filter
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      const ranges = {
        'today': (date: string) => {
          const gymDate = new Date(date);
          return gymDate.toDateString() === now.toDateString();
        },
        'this-week': (date: string) => {
          const gymDate = new Date(date);
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return gymDate >= weekAgo;
        },
        'this-month': (date: string) => {
          const gymDate = new Date(date);
          return gymDate.getMonth() === now.getMonth() && gymDate.getFullYear() === now.getFullYear();
        },
        'this-year': (date: string) => {
          const gymDate = new Date(date);
          return gymDate.getFullYear() === now.getFullYear();
        }
      };
      filtered = filtered.filter(gym => ranges[dateRangeFilter as keyof typeof ranges](gym.createdAt));
    }

    // Pending months filter
    if (pendingMonthsFilter !== 'all') {
      const ranges: Record<string, (count: number) => boolean> = {
        '0': (count) => count === 0,
        '1-2': (count) => count >= 1 && count <= 2,
        '3-5': (count) => count >= 3 && count <= 5,
        '5+': (count) => count >= 5
      };
      const predicate = ranges[pendingMonthsFilter];
      if (predicate) {
        filtered = filtered.filter(gym => predicate(gym.pendingMonths || 0));
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'memberCount':
          aValue = a.memberCount;
          bValue = b.memberCount;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'gymCode':
          aValue = a.gymCode.toLowerCase();
          bValue = b.gymCode.toLowerCase();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredGyms(filtered);
  }, [gyms, searchTerm, statusFilter, memberCountFilter, dateRangeFilter, pendingMonthsFilter, sortBy, sortOrder]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setMemberCountFilter('all');
    setDateRangeFilter('all');
    setPendingMonthsFilter('all');
    setSortBy('name');
    setSortOrder('asc');
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== 'all') count++;
    if (memberCountFilter !== 'all') count++;
    if (dateRangeFilter !== 'all') count++;
    if (pendingMonthsFilter !== 'all') count++;
    return count;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Master CRM Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Welcome, {admin?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAllData}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/'}
                className="flex items-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Main Site</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-4 border-b border-border">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Master CRM Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                Comprehensive overview of all CRMs and their performance metrics.
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="gyms">Gyms</TabsTrigger>
            </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {overviewStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-2xl font-bold">{overviewStats.totalUsers.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Activity className="h-3 w-3 mr-1" />
                        Across all industries
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Gyms</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-green-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-2xl font-bold">{overviewStats.totalGyms.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Activity className="h-3 w-3 mr-1" />
                        Active gym accounts
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-2xl font-bold">{formatCurrency(overviewStats.totalRevenue)}</div>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Activity className="h-3 w-3 mr-1" />
                        From all transactions
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-orange-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-2xl font-bold">{overviewStats.activeSubscriptions.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Activity className="h-3 w-3 mr-1" />
                        Paid subscriptions
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}

            {/* Subscription Overview Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-green-600 rounded-full" />
                <h2 className="text-2xl font-bold">Subscription Overview</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-green-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-2xl font-bold">{overviewStats?.subscriptionStats?.activeGyms || 0}</div>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Activity className="h-3 w-3 mr-1" />
                        Currently active
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Expired Subscriptions</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-2xl font-bold">{overviewStats?.subscriptionStats?.expiredGyms || 0}</div>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Activity className="h-3 w-3 mr-1" />
                        Need renewal
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-500/10 to-gray-600/5" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Registered Only</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-gray-500/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-2xl font-bold">{overviewStats?.subscriptionStats?.registeredGyms || 0}</div>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Activity className="h-3 w-3 mr-1" />
                        No subscription
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>

            {/* System Insights Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
                <h2 className="text-2xl font-bold">System Insights</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Industry Distribution</CardTitle>
                    <CardDescription>
                      Users by industry type
                    </CardDescription>
                  </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {industryStats.map((stat) => (
                      <div key={stat.industry} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{stat.industry}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {stat.gymCount} gyms
                          </span>
                        </div>
                        <span className="font-medium">{stat.count} users</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Statistics</CardTitle>
                  <CardDescription>
                    Overall system metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Customers</span>
                      <span className="font-medium">{overviewStats?.totalCustomers.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Invoices</span>
                      <span className="font-medium">{overviewStats?.totalInvoices.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Customers</span>
                      <span className="font-medium">{overviewStats?.totalCustomers.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            </div>
          </TabsContent>

          {/* Gyms Tab */}
          <TabsContent value="gyms" className="space-y-6">
            {/* Gym Management Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-green-600 rounded-full" />
                  <h2 className="text-2xl font-bold">Gym Management</h2>
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing {filteredGyms.length} of {gyms.length} gyms
                </div>
              </div>

              {/* Search and Filter Bar */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-4 flex-1">
                      {/* Search Input */}
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search gyms by name or code..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* Filter Toggle */}
                      <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2"
                      >
                        <Filter className="h-4 w-4" />
                        Filters
                        {getActiveFiltersCount() > 0 && (
                          <Badge variant="secondary" className="ml-1">
                            {getActiveFiltersCount()}
                          </Badge>
                        )}
                      </Button>

                      {/* Clear Filters */}
                      {getActiveFiltersCount() > 0 && (
                        <Button
                          variant="ghost"
                          onClick={clearFilters}
                          className="flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Advanced Filters */}
                <Collapsible open={showFilters} onOpenChange={setShowFilters}>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Status Filter */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Status</label>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="registered">Registered</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="expired">Expired</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Member Count Filter */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Member Count</label>
                          <Select value={memberCountFilter} onValueChange={setMemberCountFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Ranges" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Ranges</SelectItem>
                              <SelectItem value="0-10">0 - 10 members</SelectItem>
                              <SelectItem value="11-50">11 - 50 members</SelectItem>
                              <SelectItem value="51-100">51 - 100 members</SelectItem>
                              <SelectItem value="100+">100+ members</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Date Range Filter */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Created</label>
                          <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Time</SelectItem>
                              <SelectItem value="today">Today</SelectItem>
                              <SelectItem value="this-week">This Week</SelectItem>
                              <SelectItem value="this-month">This Month</SelectItem>
                              <SelectItem value="this-year">This Year</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Pending Bills Filter */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Pending Bills</label>
                          <Select value={pendingMonthsFilter} onValueChange={setPendingMonthsFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="Any Pending" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Any Pending</SelectItem>
                              <SelectItem value="0">No Pending Bills</SelectItem>
                              <SelectItem value="1-2">1 - 2 Months Pending</SelectItem>
                              <SelectItem value="3-5">3 - 5 Months Pending</SelectItem>
                              <SelectItem value="5+">5+ Months Pending</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Sort Options */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Sort By</label>
                          <div className="flex gap-2">
                            <Select value={sortBy} onValueChange={setSortBy}>
                              <SelectTrigger className="flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="name">Name</SelectItem>
                                <SelectItem value="memberCount">Member Count</SelectItem>
                                <SelectItem value="createdAt">Created Date</SelectItem>
                                <SelectItem value="gymCode">Gym Code</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                              className="px-2"
                            >
                              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Gyms Table */}
              <Card>
                <CardHeader>
                  <CardTitle>All Gyms</CardTitle>
                  <CardDescription>
                    Complete list of registered gyms and their statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredGyms.length === 0 ? (
                    <div className="text-center py-8">
                      <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No gyms found</h3>
                      <p className="text-muted-foreground">
                        {getActiveFiltersCount() > 0 
                          ? "Try adjusting your filters to see more results"
                          : "No gyms have been registered yet"
                        }
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Gym Name</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Members</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Pending Bills</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredGyms.map((gym) => (
                          <TableRow key={gym._id}>
                            <TableCell className="font-medium">{gym.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{gym.gymCode}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-blue-600">{gym.memberCount}</span>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  gym.subscriptionStatus === 'active' 
                                    ? 'default' 
                                    : gym.subscriptionStatus === 'expired' 
                                    ? 'destructive' 
                                    : 'secondary'
                                }
                              >
                                {gym.subscriptionStatus === 'registered' && 'Registered'}
                                {gym.subscriptionStatus === 'active' && 'Active'}
                                {gym.subscriptionStatus === 'expired' && 'Expired'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={(gym.pendingMonths || 0) > 0 ? 'destructive' : 'secondary'}
                              >
                                {(gym.pendingMonths || 0)} {(gym.pendingMonths || 0) === 1 ? 'month' : 'months'}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(gym.createdAt)}</TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewGym(gym._id)}
                                className="hover:bg-primary hover:text-primary-foreground"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminDashboard;
