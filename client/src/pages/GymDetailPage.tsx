import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft,
  Building2,
  Users,
  UserCheck,
  FileText,
  Calendar,
  CreditCard,
  TrendingUp,
  Activity,
  Target,
  Utensils,
  Dumbbell,
  UserPlus,
  DollarSign,
  BarChart3,
  PieChart,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Eye,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar as CalendarIcon,
  Timer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axiosInstance from '@/lib/axios';

interface GymDetailData {
  gym: {
    _id: string;
    name: string;
    gymCode: string;
    logo?: string;
    banner?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    contactInfo?: {
      phone?: string;
      email?: string;
      website?: string;
    };
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
    subscriptionStatus: 'registered' | 'active' | 'expired';
    createdAt: string;
    updatedAt: string;
  };
  statistics: {
    members: {
      total: number;
      active: number;
      inactive: number;
      newThisMonth: number;
    };
    staff: {
      total: number;
      active: number;
    };
    invoices: {
      total: number;
      totalAmount: number;
      paid: number;
      pending: number;
      thisMonth: number;
    };
    nutritionPlans: {
      total: number;
      thisMonth: number;
    };
    workoutPlans: {
      total: number;
      thisMonth: number;
    };
    assignedWorkoutPlans: {
      total: number;
    };
    trainers: {
      total: number;
      active: number;
    };
    attendance: {
      total: number;
      today: number;
      thisMonth: number;
    };
    revenue: {
      total: number;
      thisMonth: number;
      today: number;
    };
    expenses: {
      total: number;
      thisMonth: number;
      today: number;
    };
    leads: {
      total: number;
      converted: number;
      thisMonth: number;
    };
    retail: {
      totalSales: number;
      thisMonthSales: number;
      todaySales: number;
    };
  };
}

const GymDetailPage: React.FC = () => {
  const { gymId } = useParams<{ gymId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [gymData, setGymData] = useState<GymDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchGymData = useCallback(async () => {
    if (!gymId) return;
    
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/admin/dashboard/gym/${gymId}`);
      if (response.data.success) {
        setGymData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching gym data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch gym details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [gymId, toast]);

  useEffect(() => {
    fetchGymData();
  }, [gymId, fetchGymData]);

  const handleBackNavigation = () => {
    const returnTab = location.state?.returnTab || 'overview';
    const returnUrl = location.state?.returnUrl || '/admin/dashboard';
    
    // Navigate back with tab state
    navigate(returnUrl, { 
      state: { 
        activeTab: returnTab 
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
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSubscriptionStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'expired':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading gym details...</p>
        </div>
      </div>
    );
  }

  if (!gymData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-muted-foreground">Gym not found</p>
          <Button onClick={handleBackNavigation} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const { gym, statistics } = gymData;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackNavigation}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div className="flex items-center space-x-3">
                {gym.logo && (
                  <img
                    src={gym.logo}
                    alt={gym.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold">{gym.name}</h1>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{gym.gymCode}</Badge>
                    <Badge className={getSubscriptionStatusColor(gym.subscriptionStatus)}>
                      <div className="flex items-center space-x-1">
                        {getSubscriptionStatusIcon(gym.subscriptionStatus)}
                        <span className="capitalize">{gym.subscriptionStatus}</span>
                      </div>
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchGymData}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
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
          {/* Gym Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Gym Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">Contact Information</h3>
                  <div className="space-y-1">
                    {gym.contactInfo?.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{gym.contactInfo.phone}</span>
                      </div>
                    )}
                    {gym.contactInfo?.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{gym.contactInfo.email}</span>
                      </div>
                    )}
                    {gym.contactInfo?.website && (
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={gym.contactInfo.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {gym.contactInfo.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">Address</h3>
                  {gym.address && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        {gym.address.street && <div>{gym.address.street}</div>}
                        {(gym.address.city || gym.address.state || gym.address.zipCode) && (
                          <div>
                            {gym.address.city}
                            {gym.address.city && gym.address.state && ', '}
                            {gym.address.state} {gym.address.zipCode}
                          </div>
                        )}
                        {gym.address.country && <div>{gym.address.country}</div>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">Subscription Details</h3>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Created: {formatDate(gym.createdAt)}
                      </span>
                    </div>
                    {gym.subscriptionStartDate && (
                      <div className="flex items-center space-x-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Started: {formatDate(gym.subscriptionStartDate)}
                        </span>
                      </div>
                    )}
                    {gym.subscriptionEndDate && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Ends: {formatDate(gym.subscriptionEndDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="members">Members & Staff</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-2xl font-bold">{statistics.members.total}</div>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Activity className="h-3 w-3 mr-1" />
                        {statistics.members.active} active
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
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-2xl font-bold">{formatCurrency(statistics.revenue.total)}</div>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Activity className="h-3 w-3 mr-1" />
                        {formatCurrency(statistics.revenue.thisMonth)} this month
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
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-2xl font-bold">{statistics.invoices.total}</div>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Activity className="h-3 w-3 mr-1" />
                        {statistics.invoices.paid} paid
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <UserCheck className="h-5 w-5" />
                      <span>Membership Status</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Active Members</span>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {statistics.members.active}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Inactive Members</span>
                        <Badge variant="secondary">
                          {statistics.members.inactive}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">New This Month</span>
                        <Badge variant="outline">
                          {statistics.members.newThisMonth}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5" />
                      <span>Attendance</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Check-ins</span>
                        <Badge variant="outline">
                          {statistics.attendance.total}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Today</span>
                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                          {statistics.attendance.today}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">This Month</span>
                        <Badge variant="outline">
                          {statistics.attendance.thisMonth}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>Leads</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Leads</span>
                        <Badge variant="outline">
                          {statistics.leads.total}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Converted</span>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {statistics.leads.converted}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">This Month</span>
                        <Badge variant="outline">
                          {statistics.leads.thisMonth}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Members & Staff Tab */}
            <TabsContent value="members" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Members Overview</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{statistics.members.total}</div>
                          <div className="text-sm text-blue-600">Total Members</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{statistics.members.active}</div>
                          <div className="text-sm text-green-600">Active Members</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-600">{statistics.members.inactive}</div>
                          <div className="text-sm text-gray-600">Inactive Members</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{statistics.members.newThisMonth}</div>
                          <div className="text-sm text-purple-600">New This Month</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <UserCheck className="h-5 w-5" />
                      <span>Staff Overview</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{statistics.staff.total}</div>
                          <div className="text-sm text-blue-600">Total Staff</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{statistics.staff.active}</div>
                          <div className="text-sm text-green-600">Active Staff</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Dumbbell className="h-5 w-5" />
                    <span>Trainers</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{statistics.trainers.total}</div>
                      <div className="text-sm text-blue-600">Total Trainers</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{statistics.trainers.active}</div>
                      <div className="text-sm text-green-600">Active Trainers</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Utensils className="h-5 w-5" />
                      <span>Nutrition Plans</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{statistics.nutritionPlans.total}</div>
                          <div className="text-sm text-blue-600">Total Plans</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{statistics.nutritionPlans.thisMonth}</div>
                          <div className="text-sm text-green-600">This Month</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Dumbbell className="h-5 w-5" />
                      <span>Workout Plans</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{statistics.workoutPlans.total}</div>
                          <div className="text-sm text-blue-600">Total Plans</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{statistics.workoutPlans.thisMonth}</div>
                          <div className="text-sm text-green-600">This Month</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <UserCheck className="h-5 w-5" />
                      <span>Assigned Workout Plans</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{statistics.assignedWorkoutPlans.total}</div>
                        <div className="text-sm text-purple-600">Total Assigned</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Revenue</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{formatCurrency(statistics.revenue.total)}</div>
                          <div className="text-sm text-green-600">Total Revenue</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{formatCurrency(statistics.revenue.thisMonth)}</div>
                          <div className="text-sm text-blue-600">This Month</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{formatCurrency(statistics.revenue.today)}</div>
                          <div className="text-sm text-purple-600">Today</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5" />
                      <span>Expenses</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">{formatCurrency(statistics.expenses.total)}</div>
                          <div className="text-sm text-red-600">Total Expenses</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{formatCurrency(statistics.expenses.thisMonth)}</div>
                          <div className="text-sm text-orange-600">This Month</div>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">{formatCurrency(statistics.expenses.today)}</div>
                          <div className="text-sm text-yellow-600">Today</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Invoices</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{statistics.invoices.total}</div>
                          <div className="text-sm text-blue-600">Total Invoices</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{statistics.invoices.paid}</div>
                          <div className="text-sm text-green-600">Paid</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{statistics.invoices.pending}</div>
                          <div className="text-sm text-orange-600">Pending</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{statistics.invoices.thisMonth}</div>
                          <div className="text-sm text-purple-600">This Month</div>
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-600">{formatCurrency(statistics.invoices.totalAmount)}</div>
                        <div className="text-sm text-gray-600">Total Invoice Amount</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Retail Sales</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{formatCurrency(statistics.retail.totalSales)}</div>
                          <div className="text-sm text-green-600">Total Sales</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{formatCurrency(statistics.retail.thisMonthSales)}</div>
                          <div className="text-sm text-blue-600">This Month</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{formatCurrency(statistics.retail.todaySales)}</div>
                          <div className="text-sm text-purple-600">Today</div>
                        </div>
                      </div>
                    </div>
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

export default GymDetailPage;
