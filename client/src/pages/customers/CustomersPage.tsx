import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp,
  Star,
  Crown,
  Zap,
  Calendar,
  DollarSign,
  PhoneCall,
  Mail,
  Award,
  Download,
  Eye,
  Pencil,
  Trash2,
  AlertCircle,
  Gift
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { CustomerService, Customer } from '@/services/CustomerService';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddCustomerModal } from '@/components/customers/AddCustomerModal';
import { EditCustomerModal } from '@/components/customers/EditCustomerModal';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FilterModal } from '@/components/customers/FilterModal';
import { ViewCustomerModal } from '@/components/customers/ViewCustomerModal';
import { Skeleton } from '@/components/ui/skeleton';
import * as Papa from 'papaparse';
import { differenceInDays, addDays, addMonths, format, isToday, isTomorrow, isThisWeek, isThisMonth, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface FilterState {
  membershipType?: string;
  source?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  expiryFilter?: string;
  birthdayFilter?: string;
  statusFilter?: string;
}

function handleViewCustomer(customer: Customer, setSelectedCustomer: any, setIsViewModalOpen: any) {
  setSelectedCustomer(customer);
  setIsViewModalOpen(true);
}

function handleEditCustomer(customer: Customer, setSelectedCustomer: any, setIsEditModalOpen: any) {
  setSelectedCustomer(customer);
  setIsEditModalOpen(true);
}

function handleDeleteCustomer(customerId: string, handleDelete: any) {
  handleDelete(customerId);
}

// Helper to safely format dates
function safeFormatDate(date: Date | null | undefined, fmt: string = 'MMM d, yyyy') {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return 'N/A';
  return format(date, fmt);
}

export function CustomersPage() {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    membershipType: 'none',
    source: 'none',
    sortBy: 'none',
    sortOrder: 'asc',
    expiryFilter: 'none',
    birthdayFilter: 'none',
    statusFilter: 'none',
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch all customers once on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const data = await CustomerService.getCustomers();
        setCustomers(data.customers || []);
      } catch (error) {
        setCustomers([]);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load customers",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, [toast]);

  // Helper functions for filtering
  const calculateExpiryDate = (customer: Customer) => {
    if (!customer.membershipStartDate || !customer.membershipDuration) return null;
    const startDate = new Date(customer.membershipStartDate);
    return addMonths(startDate, customer.membershipDuration);
  };

  const isCustomerExpired = (customer: Customer) => {
    const expiryDate = calculateExpiryDate(customer);
    if (!expiryDate) return false;
    return new Date() > expiryDate;
  };

  const isCustomerExpiringSoon = (customer: Customer, days: number) => {
    const expiryDate = calculateExpiryDate(customer);
    if (!expiryDate) return false;
    const daysUntilExpiry = differenceInDays(expiryDate, new Date());
    return daysUntilExpiry >= 0 && daysUntilExpiry <= days;
  };

  const isBirthdayInRange = (customer: Customer, range: string) => {
    if (!customer.birthday) return false;
    const birthday = new Date(customer.birthday);
    const today = new Date();

    // Set birthday to current year for comparison
    const currentYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());

    switch (range) {
      case 'today':
        return today.getDate() === birthday.getDate() && today.getMonth() === birthday.getMonth();
      case 'tomorrow': {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return tomorrow.getDate() === birthday.getDate() && tomorrow.getMonth() === birthday.getMonth();
      }
      case 'thisWeek': {
        const start = startOfWeek(today);
        const end = endOfWeek(today);
        return currentYearBirthday >= start && currentYearBirthday <= end;
      }
      case 'thisMonth':
        return today.getMonth() === birthday.getMonth();
      case 'next7days': {
        const next7Days = new Date(today);
        next7Days.setDate(today.getDate() + 7);
        return currentYearBirthday >= today && currentYearBirthday <= next7Days;
      }
      case 'next30days': {
        const next30Days = new Date(today);
        next30Days.setDate(today.getDate() + 30);
        return currentYearBirthday >= today && currentYearBirthday <= next30Days;
      }
      default:
        return false;
    }
  };

  // Enhanced filtering with all new filters
  const filteredCustomers = customers.filter(customer => {
    // Search query filter
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      (customer.phone && customer.phone.toLowerCase().includes(query))
    );

    if (!matchesSearch) return false;

    // Membership type filter
    if (filters.membershipType && filters.membershipType !== 'none' && customer.membershipType !== filters.membershipType) {
      return false;
    }

    // Source filter
    if (filters.source && filters.source !== 'none' && customer.source !== filters.source) {
      return false;
    }

    // Expiry filter
    if (filters.expiryFilter && filters.expiryFilter !== 'none') {
      const days = parseInt(filters.expiryFilter.replace(/\D/g, ''));
      if (!isCustomerExpiringSoon(customer, days)) {
        return false;
      }
    }

    // Birthday filter
    if (filters.birthdayFilter && filters.birthdayFilter !== 'none' && !isBirthdayInRange(customer, filters.birthdayFilter)) {
      return false;
    }

    // Status filter
    if (filters.statusFilter && filters.statusFilter !== 'none') {
      switch (filters.statusFilter) {
        case 'active':
          if (isCustomerExpired(customer)) return false;
          break;
        case 'expired':
          if (!isCustomerExpired(customer)) return false;
          break;
        case 'expiringSoon':
          if (!isCustomerExpiringSoon(customer, 7)) return false;
          break;
      }
    }

    return true;
  }).sort((a, b) => {
    if (!filters.sortBy || filters.sortBy === 'none') return 0;
    
    const order = filters.sortOrder === 'desc' ? -1 : 1;
    
    switch (filters.sortBy) {
      case 'name':
        return order * a.name.localeCompare(b.name);
      case 'joinDate':
        const dateA = new Date(a.createdAt || '');
        const dateB = new Date(b.createdAt || '');
        return order * (dateA.getTime() - dateB.getTime());
      case 'expiryDate':
        const expiryA = calculateExpiryDate(a);
        const expiryB = calculateExpiryDate(b);
        if (!expiryA && !expiryB) return 0;
        if (!expiryA) return 1;
        if (!expiryB) return -1;
        return order * (expiryA.getTime() - expiryB.getTime());
      case 'totalSpent':
        return order * ((a.totalSpent || 0) - (b.totalSpent || 0));
      case 'membershipFees':
        return order * ((a.membershipFees || 0) - (b.membershipFees || 0));
      default:
        return 0;
    }
  });

  // Calculate customer insights
  const customerInsights = React.useMemo(() => {
    if (!customers.length) return {
      totalCustomers: 0,
      vipCustomers: 0,
      premiumCustomers: 0,
      basicCustomers: 0,
      totalRevenue: 0,
      averageSpending: 0,
      recentCustomers: 0,
      expiringCustomers: 0,
      birthdaysThisMonth: 0,
      expiredCustomers: 0
    };

    const vipCustomers = customers.filter(c => c.membershipType === 'vip').length;
    const premiumCustomers = customers.filter(c => c.membershipType === 'premium').length;
    const basicCustomers = customers.filter(c => c.membershipType === 'basic').length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const averageSpending = totalRevenue / customers.length;
    
    // Calculate recent customers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCustomers = customers.filter(c => 
      new Date(c.createdAt || '') > thirtyDaysAgo
    ).length;

    // Calculate expiring customers (next 7 days)
    const expiringCustomers = customers.filter(c => isCustomerExpiringSoon(c, 7)).length;

    // Calculate birthdays this month
    const birthdaysThisMonth = customers.filter(c => isBirthdayInRange(c, 'thisMonth')).length;

    // Calculate expired customers
    const expiredCustomers = customers.filter(c => isCustomerExpired(c)).length;

    return {
      totalCustomers: customers.length,
      vipCustomers,
      premiumCustomers,
      basicCustomers,
      totalRevenue,
      averageSpending,
      recentCustomers,
      expiringCustomers,
      birthdaysThisMonth,
      expiredCustomers
    };
  }, [customers]);

  const deleteMutation = useMutation({
    mutationFn: CustomerService.deleteCustomer,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      deleteMutation.mutate(customerId);
    }
  };

  const handleFilterApply = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleCustomerUpdated = (updatedCustomer: Customer) => {
    setSelectedCustomer(updatedCustomer);
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  };

  const handleExport = () => {
    if (!filteredCustomers || filteredCustomers.length === 0) {
      toast({
        title: "Info",
        description: "No data to export.",
      });
      return;
    }

    const dataToExport = filteredCustomers.map(customer => {
      const expiryDate = calculateExpiryDate(customer);
      return {
        "Name": customer.name,
        "Email": customer.email,
        "Phone": customer.phone || '',
        "Membership Type": customer.membershipType || '',
        "Membership Fees": customer.membershipFees || 0,
        "Total Spent": customer.totalSpent || 0,
        "Source": customer.source || '',
        "Start Date": customer.membershipStartDate ? format(new Date(customer.membershipStartDate), 'yyyy-MM-dd') : '',
        "Expiry Date": expiryDate ? format(expiryDate, 'yyyy-MM-dd') : '',
        "Days Until Expiry": expiryDate ? differenceInDays(expiryDate, new Date()) : '',
        "Status": isCustomerExpired(customer) ? 'Expired' : 'Active',
        "Date of Birth": customer.birthday ? format(new Date(customer.birthday), 'yyyy-MM-dd') : '',
        "Created Date": customer.createdAt ? format(new Date(customer.createdAt), 'yyyy-MM-dd') : ''
      };
    });

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `customers-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Success",
      description: "Customer data exported successfully!",
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-[500px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-8"
      >
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-4 border-b">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Customer Management
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your gym members and track their progress with detailed insights.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setIsAddModalOpen(true)} size="lg" className="shadow-sm">
              <Plus className="mr-2 h-5 w-5" /> Add Customer
            </Button>
            <Button variant="outline" size="lg" className="shadow-sm" onClick={handleExport}>
              <Download className="mr-2 h-5 w-5" /> Export Data
            </Button>
          </div>
        </div>

        {/* Enhanced Insights Dashboard */}
        <div className="grid grid-cols-1 xl:grid-cols-6 gap-6">
          {/* Left Column - Main Metrics */}
          <div className="xl:col-span-4 space-y-6">
            {/* Primary Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{customerInsights.totalCustomers}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Active members
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
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{customerInsights.expiringCustomers}</div>
                    <p className="text-xs text-muted-foreground">Next 7 days</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-pink-600/5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Birthdays</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-pink-500/10 flex items-center justify-center">
                      <Gift className="h-5 w-5 text-pink-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{customerInsights.birthdaysThisMonth}</div>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <UserX className="h-5 w-5 text-red-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{customerInsights.expiredCustomers}</div>
                    <p className="text-xs text-muted-foreground">Need renewal</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Search Bar */}
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  className="pl-10 h-11 shadow-sm border-muted-foreground/20 focus:ring-2 focus:ring-primary/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                  type="text"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Membership Breakdown */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Membership Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-yellow-600/5">
                    <div className="flex items-center space-x-2">
                      <Crown className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium">VIP Members</span>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {customerInsights.vipCustomers}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-600/5">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Premium</span>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {customerInsights.premiumCustomers}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-green-600/5">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Basic</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {customerInsights.basicCustomers}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Table Section */}
        <div className="mt-8">
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">Customer Directory</CardTitle>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {filteredCustomers?.length || 0} customers
                  </Badge>
                  <Button type="button" variant="outline" onClick={() => setIsFilterModalOpen(true)}>
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-muted/50">
                      <TableHead className="font-semibold">Customer</TableHead>
                      <TableHead className="font-semibold">Contact</TableHead>
                      <TableHead className="font-semibold">Membership</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Expiry</TableHead>
                      <TableHead className="font-semibold">Total Spent</TableHead>
                      <TableHead className="font-semibold w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer: Customer, index) => {
                      const expiryDate = calculateExpiryDate(customer);
                      const isExpired = isCustomerExpired(customer);
                      const isExpiringSoon = isCustomerExpiringSoon(customer, 7);
                      const daysUntilExpiry = expiryDate ? differenceInDays(expiryDate, new Date()) : null;
                      
                      return (
                        <motion.tr
                          key={customer.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {customer.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{customer.name}</div>
                                <div className="text-sm text-muted-foreground">{customer.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center text-sm">
                                <PhoneCall className="h-3 w-3 mr-1 text-muted-foreground" />
                                {customer.phone || 'N/A'}
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Mail className="h-3 w-3 mr-1" />
                                {customer.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              customer.membershipType === 'vip' ? 'default' :
                              customer.membershipType === 'premium' ? 'secondary' :
                              customer.membershipType === 'basic' ? 'outline' :
                              'secondary'
                            }>
                              {customer.membershipType?.charAt(0).toUpperCase() + customer.membershipType?.slice(1) || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              isExpired ? 'destructive' :
                              isExpiringSoon ? 'secondary' :
                              'default'
                            } className={
                              isExpired ? 'bg-red-100 text-red-800' :
                              isExpiringSoon ? 'bg-orange-100 text-orange-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {expiryDate ? (
                              <div className="space-y-1">
                                <div className="text-sm font-medium">
                                  {safeFormatDate(expiryDate, 'MMM d, yyyy')}
                                </div>
                                <div className={`text-xs ${
                                  isExpired ? 'text-red-600' :
                                  isExpiringSoon ? 'text-orange-600' :
                                  'text-muted-foreground'
                                }`}>
                                  {daysUntilExpiry !== null ? (
                                    daysUntilExpiry < 0 ? 
                                      `${Math.abs(daysUntilExpiry)} days ago` :
                                      `${daysUntilExpiry} days left`
                                  ) : 'N/A'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {formatCurrency(customer.totalSpent)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleViewCustomer(customer, setSelectedCustomer, setIsViewModalOpen)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditCustomer(customer, setSelectedCustomer, setIsEditModalOpen)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit Customer
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => handleDeleteCustomer(customer.id, handleDelete)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Customer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                    {(!filteredCustomers || filteredCustomers.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          <div className="flex flex-col items-center space-y-2">
                            <Users className="h-12 w-12 text-muted-foreground/50" />
                            <div className="text-lg font-medium">No customers found</div>
                            <p className="text-sm">Try adjusting your search or filter criteria</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Modals */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {selectedCustomer && (
        <>
          <EditCustomerModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            customer={selectedCustomer}
            onCustomerUpdated={handleCustomerUpdated}
          />
          <ViewCustomerModal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            customer={selectedCustomer}
            onCustomerUpdated={handleCustomerUpdated}
          />
        </>
      )}

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleFilterApply}
        currentFilters={filters}
      />
    </DashboardLayout>
  );
}

export default CustomersPage;