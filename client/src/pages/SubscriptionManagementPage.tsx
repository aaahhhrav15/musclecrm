import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Calendar, 
  Users, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Smartphone,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Filter,
  Search,
  ArrowLeft,
  Shield,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axios';
import { Skeleton } from '@/components/ui/skeleton';
import * as Papa from 'papaparse';

interface Subscription {
  _id: string;
  gymId: string;
  gymName: string;
  crmSubscription: {
    status: string;
    planType: string;
    amount: number;
    startDate: string;
    endDate: string;
  };
  appAccess: {
    enabled: boolean;
    registeredUsers: number;
    totalAppCost: number;
    userSubscriptions: Array<{
      userId: string;
      userName: string;
      startDate: string;
      endDate: string;
      status: string;
      monthlyAmount: number;
    }>;
  };
  totalCost: number;
  createdAt: string;
  updatedAt: string;
}

interface Analytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  appAccessRevenue: number;
  totalRegisteredUsers: number;
  expiringSoon: number;
}

const SubscriptionManagementPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [monthlyBilling, setMonthlyBilling] = useState<{
    totalRevenue?: number;
    totalGyms?: number;
    totalMembers?: number;
    monthName?: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);

  // This page is ONLY for Master CRM users (Admin)
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      // Redirect to login if not admin
      window.location.href = '/admin/login';
      return;
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Only admin endpoints - this page is for Master CRM only
      console.log('Fetching data as Master CRM admin...');
      const [subscriptionsResponse, analyticsResponse, billingResponse] = await Promise.all([
        axiosInstance.get('/admin/dashboard/subscriptions'),
        axiosInstance.get('/subscriptions/master/analytics'),
        axiosInstance.get('/gym/billing/master/current-month')
      ]);

      console.log('Subscriptions response:', subscriptionsResponse.data);
      console.log('Analytics response:', analyticsResponse.data);
      console.log('Billing response:', billingResponse.data);

      if (subscriptionsResponse.data.success) {
        setSubscriptions(subscriptionsResponse.data.data || subscriptionsResponse.data.subscriptions);
      }

      if (analyticsResponse.data.success) {
        setAnalytics(analyticsResponse.data.analytics);
      }

      if (billingResponse.data.success) {
        setMonthlyBilling(billingResponse.data.billing || billingResponse.data.masterBilling);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowEditDialog(true);
  };

  const handleDelete = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowDeleteDialog(true);
  };

  const handleView = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowViewDialog(true);
  };

  const handleAdd = () => {
    setSelectedSubscription(null);
    setShowAddDialog(true);
  };

  const handleRefresh = () => {
    fetchData();
    toast.success('Data refreshed successfully');
  };

  const handleSync = async () => {
    try {
      await axiosInstance.post('/subscriptions/master/sync');
      toast.success('All subscriptions synced successfully');
      fetchData();
    } catch (error) {
      console.error('Error syncing subscriptions:', error);
      toast.error('Failed to sync subscriptions');
    }
  };

  const handleExport = () => {
    const csvData = subscriptions.map(sub => ({
      'Gym Name': sub.gymName,
      'Status': sub.crmSubscription.status,
      'Plan Type': sub.crmSubscription.planType,
      'Amount': sub.crmSubscription.amount,
      'Start Date': new Date(sub.crmSubscription.startDate).toLocaleDateString(),
      'End Date': new Date(sub.crmSubscription.endDate).toLocaleDateString(),
      'App Access': sub.appAccess.enabled ? 'Enabled' : 'Disabled',
      'Registered Users': sub.appAccess.registeredUsers,
      'Total Cost': sub.totalCost,
      'Created At': new Date(sub.createdAt).toLocaleDateString()
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `subscriptions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Subscriptions exported successfully');
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.gymName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.crmSubscription.planType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.crmSubscription.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedSubscriptions = filteredSubscriptions.sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'gymName':
        aValue = a.gymName.toLowerCase();
        bValue = b.gymName.toLowerCase();
        break;
      case 'amount':
        aValue = a.crmSubscription.amount;
        bValue = b.crmSubscription.amount;
        break;
      case 'status':
        aValue = a.crmSubscription.status;
        bValue = b.crmSubscription.status;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        aValue = a.gymName.toLowerCase();
        bValue = b.gymName.toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'expired':
        return <XCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Master CRM Header Skeleton */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-32" />
                <div className="h-6 w-px bg-border" />
                <div>
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-48 mt-2" />
                </div>
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96 mt-2" />
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Master CRM only - no DashboardLayout needed
  return (
    <div className="min-h-screen bg-background">
      {/* Master CRM Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Admin Dashboard</span>
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Master CRM - Subscription Management</h1>
                <p className="text-sm text-muted-foreground">Comprehensive subscription tracking for all gyms</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span>Master CRM Access</span>
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Master CRM - Subscription Management
            </h1>
            <p className="text-muted-foreground">
              Comprehensive subscription tracking and management for all gyms
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleSync}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync All
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Subscription
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalSubscriptions}</div>
                <p className="text-xs text-muted-foreground">
                  Active: {analytics.activeSubscriptions}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{analytics.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Monthly: ₹{analytics.monthlyRevenue.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">App Access Revenue</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{analytics.appAccessRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.totalRegisteredUsers} users
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.expiringSoon}</div>
                <p className="text-xs text-muted-foreground">
                  Next 30 days
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Monthly Billing Section - Master CRM Only */}
        {monthlyBilling && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-green-600 rounded-full" />
              <h2 className="text-2xl font-bold">Master Monthly Billing - {monthlyBilling.monthName || 'Current Month'}</h2>
            </div>
            
            {/* Master billing view for all gyms */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="relative overflow-hidden border-0 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-2xl font-bold">₹{monthlyBilling.totalRevenue?.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Gyms</CardTitle>
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-2xl font-bold">{monthlyBilling.totalGyms || 0}</div>
                  <p className="text-xs text-muted-foreground">Active gyms</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
                  <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-2xl font-bold">{monthlyBilling.totalMembers || 0}</div>
                  <p className="text-xs text-muted-foreground">Active members</p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg per Gym</CardTitle>
                  <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-2xl font-bold">₹{monthlyBilling.totalGyms ? Math.round(monthlyBilling.totalRevenue / monthlyBilling.totalGyms) : 0}</div>
                  <p className="text-xs text-muted-foreground">Per gym</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by gym name or plan type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gymName">Gym Name</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Gym Subscriptions ({sortedSubscriptions.length})</CardTitle>
            <CardDescription>
              Comprehensive view of all gym subscriptions and their details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedSubscriptions.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No subscriptions found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your filters'
                    : 'Get started by adding your first subscription'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={handleAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subscription
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedSubscriptions.map((subscription) => (
                  <Card key={subscription._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <CreditCard className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{subscription.gymName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {subscription.crmSubscription.planType} • ₹{subscription.crmSubscription.amount.toLocaleString()}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <Badge className={getStatusColor(subscription.crmSubscription.status)}>
                                {getStatusIcon(subscription.crmSubscription.status)}
                                <span className="ml-1">{subscription.crmSubscription.status}</span>
                              </Badge>
                              {subscription.appAccess.enabled && (
                                <Badge variant="outline" className="flex items-center">
                                  <Smartphone className="h-3 w-3 mr-1" />
                                  {subscription.appAccess.registeredUsers} users
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(subscription)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(subscription)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(subscription)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionManagementPage;
