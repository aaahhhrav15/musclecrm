import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Gift,
  ChevronLeft,
  ChevronRight
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

// **OPTIMIZATION: Use stored membershipEndDate from database (no calculation needed)**
const getStoredExpiryDate = (customer: Customer) => {
  if (customer.membershipEndDate) {
    return new Date(customer.membershipEndDate);
  }
  return null;
};

// **OPTIMIZATION: Updated helper functions using stored end dates**
const isCustomerExpired = (customer: Customer) => {
  const expiryDate = getStoredExpiryDate(customer);
  if (!expiryDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);
  return expiryDate < today;
};

const isCustomerExpiringSoon = (customer: Customer, days: number) => {
  const expiryDate = getStoredExpiryDate(customer);
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
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch all customers once using React Query
  const { data: customersData, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const data = await CustomerService.getCustomers({
        page: 1,
        limit: 10000, // Large enough to get all customers
      });
      return data.customers || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Update allCustomers when data changes
  useEffect(() => {
    if (customersData) {
      setAllCustomers(customersData);
    }
  }, [customersData]);

  // Client-side filtering function - now memoized
  const filteredCustomers = useMemo(() => {
    if (!allCustomers.length) return [];
    
    let filtered = [...allCustomers];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(customer => 
        (customer.name && customer.name.toLowerCase().includes(query)) ||
        (customer.email && customer.email.toLowerCase().includes(query)) ||
        (customer.phone && customer.phone.toLowerCase().includes(query))
      );
    }

    // Apply membership type filter
    if (filters.membershipType && filters.membershipType !== 'none') {
      filtered = filtered.filter(customer => customer.membershipType === filters.membershipType);
    }

    // Apply source filter
    if (filters.source && filters.source !== 'none') {
      filtered = filtered.filter(customer => customer.source === filters.source);
    }

    // Apply status filter (active, expired, expiring)
    if (filters.statusFilter && filters.statusFilter !== 'none') {
      filtered = filtered.filter(customer => {
        const isExpired = isCustomerExpired(customer);
        const isExpiring = isCustomerExpiringSoon(customer, 7);
        
        switch (filters.statusFilter) {
          case 'active':
            return !isExpired && !isExpiring;
          case 'expired':
            return isExpired;
          case 'expiringSoon':
            return isExpiring && !isExpired;
          default:
            return true;
        }
      });
    }

    // Apply expiry filter
    if (filters.expiryFilter && filters.expiryFilter !== 'none') {
      filtered = filtered.filter(customer => {
        const expiryDate = getStoredExpiryDate(customer);
        if (!expiryDate) return false; // Exclude customers without expiry dates
        
        const daysUntilExpiry = differenceInDays(expiryDate, new Date());
        
        switch (filters.expiryFilter) {
          case '1day':
            return daysUntilExpiry >= 0 && daysUntilExpiry <= 1;
          case '2days':
            return daysUntilExpiry >= 0 && daysUntilExpiry <= 2;
          case '3days':
            return daysUntilExpiry >= 0 && daysUntilExpiry <= 3;
          case '5days':
            return daysUntilExpiry >= 0 && daysUntilExpiry <= 5;
          case '10days':
            return daysUntilExpiry >= 0 && daysUntilExpiry <= 10;
          case '30days':
            return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
          default:
            return true;
        }
      });
    }

    // Apply birthday filter
    if (filters.birthdayFilter && filters.birthdayFilter !== 'none') {
      filtered = filtered.filter(customer => {
        // Only include customers who have a birthday set
        if (!customer.birthday) return false;
        
        return isBirthdayInRange(customer, filters.birthdayFilter);
      });
    }

    // Apply sorting
    if (filters.sortBy && filters.sortBy !== 'none') {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (filters.sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'email':
            aValue = a.email.toLowerCase();
            bValue = b.email.toLowerCase();
            break;
          case 'membershipType':
            aValue = a.membershipType || '';
            bValue = b.membershipType || '';
            break;
          case 'totalSpent':
            aValue = a.totalSpent || 0;
            bValue = b.totalSpent || 0;
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt || 0).getTime();
            bValue = new Date(b.createdAt || 0).getTime();
            break;
          case 'expiryDate':
            aValue = getStoredExpiryDate(a)?.getTime() || 0;
            bValue = getStoredExpiryDate(b)?.getTime() || 0;
            break;
          default:
            return 0;
        }
        
        if (filters.sortOrder === 'desc') {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
    }

    return filtered;
  }, [allCustomers, searchQuery, filters]);

  // Paginated customers - now derived from filteredCustomers
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredCustomers.slice(startIndex, endIndex);
  }, [filteredCustomers, currentPage, rowsPerPage]);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, rowsPerPage]);

  // **OPTIMIZATION: Customer insights using stored end dates**
  const customerInsights = useMemo(() => {
    if (!filteredCustomers.length) return {
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

    const vipCustomers = filteredCustomers.filter(c => c.membershipType === 'vip').length;
    const premiumCustomers = filteredCustomers.filter(c => c.membershipType === 'premium').length;
    const basicCustomers = filteredCustomers.filter(c => c.membershipType === 'basic').length;
    const totalRevenue = filteredCustomers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const averageSpending = totalRevenue / filteredCustomers.length;
    
    // Calculate recent customers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCustomers = filteredCustomers.filter(c => 
      new Date(c.createdAt || '') > thirtyDaysAgo
    ).length;

    // **OPTIMIZATION: Calculate expiring customers using stored end dates**
    const expiringCustomers = filteredCustomers.filter(c => {
      const expiryDate = getStoredExpiryDate(c);
      return expiryDate && isCustomerExpiringSoon(c, 7);
    }).length;

    // Calculate birthdays this month - only those with birthdays
    const birthdaysThisMonth = filteredCustomers.filter(c => {
      return c.birthday && isBirthdayInRange(c, 'thisMonth');
    }).length;

    // **OPTIMIZATION: Calculate expired customers using stored end dates**
    const expiredCustomers = filteredCustomers.filter(c => {
      const expiryDate = getStoredExpiryDate(c);
      return expiryDate && isCustomerExpired(c);
    }).length;

    return {
      totalCustomers: filteredCustomers.length,
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
  }, [filteredCustomers]);

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

  // **OPTIMIZATION: Updated export function using stored end dates**
  const handleExport = useCallback(() => {
    if (!filteredCustomers || filteredCustomers.length === 0) {
      toast({
        title: "Info",
        description: "No data to export with current filters.",
      });
      return;
    }

    const dataToExport = filteredCustomers.map(customer => {
      const expiryDate = getStoredExpiryDate(customer); // Use stored date
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
        "Status": isCustomerExpired(customer) ? 'Expired' : isCustomerExpiringSoon(customer, 7) ? 'Expiring Soon' : 'Active',
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
      description: `${filteredCustomers.length} customer records exported successfully!`,
    });
  }, [filteredCustomers, toast]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({
      membershipType: 'none',
      source: 'none',
      sortBy: 'none',
      sortOrder: 'asc',
      expiryFilter: 'none',
      birthdayFilter: 'none',
      statusFilter: 'none',
    });
    setSearchQuery('');
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => 
    searchQuery ||
    (filters.membershipType && filters.membershipType !== 'none') ||
    (filters.source && filters.source !== 'none') ||
    (filters.sortBy && filters.sortBy !== 'none') ||
    (filters.statusFilter && filters.statusFilter !== 'none') ||
    (filters.expiryFilter && filters.expiryFilter !== 'none') ||
    (filters.birthdayFilter && filters.birthdayFilter !== 'none'),
    [searchQuery, filters]
  );

  // Calculate pagination
  const totalCustomers = filteredCustomers.length;
  const totalPages = Math.ceil(totalCustomers / rowsPerPage);
  const startItem = (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalCustomers);

  // Generate page numbers for pagination
  const getPageNumbers = useMemo(() => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [totalPages, currentPage]);

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
                      Total members
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <Select value={rowsPerPage.toString()} onValueChange={(value) => setRowsPerPage(Number(value))}>
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {totalCustomers} customers
                  </Badge>
                  <Button type="button" variant="outline" onClick={() => setIsFilterModalOpen(true)}>
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  {hasActiveFilters && (
                    <Button type="button" variant="ghost" onClick={clearAllFilters} size="sm">
                      Clear All
                    </Button>
                  )}
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
                    {paginatedCustomers.map((customer: Customer, index) => {
                      const expiryDate = getStoredExpiryDate(customer); // Use stored date
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
                                  {format(expiryDate, 'MMM d, yyyy')}
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
                    {(!paginatedCustomers || paginatedCustomers.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          <div className="flex flex-col items-center space-y-2">
                            <Users className="h-12 w-12 text-muted-foreground/50" />
                            <div className="text-lg font-medium">No customers found</div>
                            <p className="text-sm">
                              {hasActiveFilters 
                                ? 'Try adjusting your search or filter criteria' 
                                : 'Get started by adding your first customer'}
                            </p>
                            {!hasActiveFilters && (
                              <Button onClick={() => setIsAddModalOpen(true)} className="mt-4">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Customer
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Enhanced Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="flex items-center text-sm text-muted-foreground">
                    Showing {startItem} to {endItem} of {totalCustomers} customers
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="hidden sm:flex"
                    >
                      First
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers.map((page, index) => (
                        <div key={index}>
                          {page === '...' ? (
                            <span className="px-2 py-1 text-muted-foreground">...</span>
                          ) : (
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page as number)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="hidden sm:flex"
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
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