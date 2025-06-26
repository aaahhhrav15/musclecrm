import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  DollarSign, 
  Calendar, 
  FileText, 
  Trash2, 
  Edit2, 
  BarChart2,
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Activity,
  CreditCard,
  Building,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import axiosInstance from '@/lib/axios';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval, startOfYear, endOfYear } from 'date-fns';
import { useGym } from '@/context/GymContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import * as Papa from 'papaparse';

interface Expense {
  _id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  updatedAt: string;
}

interface FilterState {
  category?: string;
  dateRange?: string;
  amountRange?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const ExpensesPage: React.FC = () => {
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const { toast } = useToast();
  const { gym } = useGym();
  const { isLoading: isAuthLoading } = useRequireAuth();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    dateRange: 'all',
    amountRange: 'all',
    sortBy: 'newest',
    sortOrder: 'desc',
  });

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  // Client-side filtering function
  const applyClientSideFilters = (expenseList: Expense[]) => {
    let filtered = [...expenseList];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(expense => 
        expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.amount.toString().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(expense => expense.category.toLowerCase() === filters.category.toLowerCase());
    }

    // Apply date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(expense => {
        const expenseDate = parseISO(expense.date);
        
        switch (filters.dateRange) {
          case 'today':
            return format(expenseDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
          case 'this_week': {
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
            return isWithinInterval(expenseDate, { start: startOfWeek, end: endOfWeek });
          }
          case 'this_month': {
            const start = startOfMonth(now);
            const end = endOfMonth(now);
            return isWithinInterval(expenseDate, { start, end });
          }
          case 'this_year': {
            const start = startOfYear(now);
            const end = endOfYear(now);
            return isWithinInterval(expenseDate, { start, end });
          }
          case 'last_30_days': {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return expenseDate >= thirtyDaysAgo;
          }
          default:
            return true;
        }
      });
    }

    // Apply amount range filter
    if (filters.amountRange && filters.amountRange !== 'all') {
      filtered = filtered.filter(expense => {
        const amount = expense.amount;
        
        switch (filters.amountRange) {
          case 'under_1000':
            return amount < 1000;
          case '1000_5000':
            return amount >= 1000 && amount <= 5000;
          case '5000_10000':
            return amount >= 5000 && amount <= 10000;
          case 'over_10000':
            return amount > 10000;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    if (filters.sortBy && filters.sortBy !== 'none') {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (filters.sortBy) {
          case 'newest':
            aValue = new Date(a.date).getTime();
            bValue = new Date(b.date).getTime();
            break;
          case 'oldest':
            aValue = new Date(a.date).getTime();
            bValue = new Date(b.date).getTime();
            break;
          case 'amount_high':
            aValue = a.amount;
            bValue = b.amount;
            break;
          case 'amount_low':
            aValue = a.amount;
            bValue = b.amount;
            break;
          case 'description':
            aValue = a.description.toLowerCase();
            bValue = b.description.toLowerCase();
            break;
          case 'category':
            aValue = a.category.toLowerCase();
            bValue = b.category.toLowerCase();
            break;
          default:
            return 0;
        }
        
        if (filters.sortBy === 'newest' || filters.sortBy === 'amount_high') {
          return bValue - aValue; // Descending
        } else if (filters.sortBy === 'oldest' || filters.sortBy === 'amount_low') {
          return aValue - bValue; // Ascending
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0; // Alphabetical
        }
      });
    }

    return filtered;
  };

  useEffect(() => {
    if (gym?._id) {
      fetchAllExpenses();
    }
  }, [gym?._id]);

  // Apply filters when dependencies change
  useEffect(() => {
    const filteredExpenses = applyClientSideFilters(allExpenses);
    
    // Calculate pagination for filtered results
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);
    
    setExpenses(paginatedExpenses);
    setTotalExpenses(filteredExpenses.length);
  }, [allExpenses, searchQuery, filters, currentPage, rowsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, rowsPerPage]);

  const fetchAllExpenses = async () => {
    if (!gym?._id) return;
    
    setIsLoading(true);
    try {
      // Fetch all expenses (we'll filter client-side)
      const response = await axiosInstance.get(`/gym/expenses?gymId=${gym._id}`);
      setAllExpenses(response.data || []);
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch expenses',
        variant: 'destructive',
      });
      setAllExpenses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate insights from filtered data
  const insights = React.useMemo(() => {
    const filteredForMetrics = applyClientSideFilters(allExpenses);
    
    if (!filteredForMetrics.length) return {
      totalAmount: 0,
      totalCount: 0,
      avgAmount: 0,
      gymExpenses: 0,
      retailExpenses: 0,
      thisMonthExpenses: 0,
      lastMonthExpenses: 0,
      monthlyGrowth: 0
    };

    const totalAmount = filteredForMetrics.reduce((sum, expense) => sum + expense.amount, 0);
    const totalCount = filteredForMetrics.length;
    const avgAmount = totalAmount / totalCount;
    
    const gymExpenses = filteredForMetrics.filter(e => e.category.toLowerCase() === 'gym').reduce((sum, e) => sum + e.amount, 0);
    const retailExpenses = filteredForMetrics.filter(e => e.category.toLowerCase() === 'retail').reduce((sum, e) => sum + e.amount, 0);
    
    // Calculate this month and last month
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStart = startOfMonth(lastMonth);
    const lastMonthEnd = endOfMonth(lastMonth);
    
    const thisMonthExpenses = filteredForMetrics.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return isWithinInterval(expenseDate, { start: thisMonthStart, end: thisMonthEnd });
    }).reduce((sum, e) => sum + e.amount, 0);
    
    const lastMonthExpenses = filteredForMetrics.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return isWithinInterval(expenseDate, { start: lastMonthStart, end: lastMonthEnd });
    }).reduce((sum, e) => sum + e.amount, 0);
    
    const monthlyGrowth = lastMonthExpenses > 0 ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;

    return {
      totalAmount,
      totalCount,
      avgAmount,
      gymExpenses,
      retailExpenses,
      thisMonthExpenses,
      lastMonthExpenses,
      monthlyGrowth
    };
  }, [allExpenses, searchQuery, filters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gym?._id) return;
    
    setIsLoading(true);

    try {
      const response = await axiosInstance.post('/gym/expenses', {
        ...formData,
        amount: parseFloat(formData.amount),
        gymId: gym._id
      });
      
      if (response.data) {
        // Add to allExpenses state
        setAllExpenses(prev => [response.data, ...prev]);
        toast({
          title: 'Success',
          description: 'Expense added successfully',
        });
        setIsAddDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add expense',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount.toString(),
      description: expense.description,
      category: expense.category,
      date: format(parseISO(expense.date), 'yyyy-MM-dd'),
    });
    setIsEditDialogOpen(true);
  };

  const handleView = (expense: Expense) => {
    setViewingExpense(expense);
    setIsViewDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gym?._id || !editingExpense) return;
    
    setIsLoading(true);

    try {
      const response = await axiosInstance.put(`/gym/expenses/${editingExpense._id}?gymId=${gym._id}`, {
        ...formData,
        amount: parseFloat(formData.amount),
        gymId: gym._id
      });
      
      if (response.data) {
        // Update allExpenses state
        setAllExpenses(prev => prev.map(exp => exp._id === editingExpense._id ? response.data : exp));
        toast({
          title: 'Success',
          description: 'Expense updated successfully',
        });
        setIsEditDialogOpen(false);
        setEditingExpense(null);
        resetForm();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update expense',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (expenseId: string) => {
    setExpenseToDelete(expenseId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete || !gym?._id) return;
    
    setIsLoading(true);
    try {
      await axiosInstance.delete(`/gym/expenses/${expenseToDelete}?gymId=${gym._id}`);
      
      // Remove from allExpenses state
      setAllExpenses(prev => prev.filter(exp => exp._id !== expenseToDelete));
      toast({
        title: 'Success',
        description: 'Expense deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete expense',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
  };

  const handleExport = () => {
    const filteredExpenses = applyClientSideFilters(allExpenses);
    
    if (!filteredExpenses || filteredExpenses.length === 0) {
      toast({
        title: "Info",
        description: "No data to export with current filters.",
        variant: "default",
      });
      return;
    }

    const dataToExport = filteredExpenses.map(expense => ({
      "Date": format(parseISO(expense.date), 'yyyy-MM-dd'),
      "Description": expense.description,
      "Category": expense.category,
      "Amount": expense.amount,
      "Created": format(parseISO(expense.updatedAt), 'yyyy-MM-dd HH:mm:ss'),
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `expenses-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Success",
      description: `${filteredExpenses.length} expense records exported successfully!`,
    });
  };

  const clearAllFilters = () => {
    setFilters({
      category: 'all',
      dateRange: 'all',
      amountRange: 'all',
      sortBy: 'newest',
      sortOrder: 'desc',
    });
    setSearchQuery('');
  };

  const hasActiveFilters = 
    searchQuery ||
    (filters.category && filters.category !== 'all') ||
    (filters.dateRange && filters.dateRange !== 'all') ||
    (filters.amountRange && filters.amountRange !== 'all') ||
    (filters.sortBy && filters.sortBy !== 'newest');

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      category: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalExpenses / rowsPerPage);
  const startItem = (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalExpenses);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
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
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'gym':
        return <Building className="h-4 w-4" />;
      case 'retail':
        return <ShoppingCart className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category.toLowerCase()) {
      case 'gym':
        return 'default';
      case 'retail':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isAuthLoading || isLoading) {
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

  if (!gym?._id) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Please select a gym to view expenses.</p>
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
              Expense Management
            </h1>
            <p className="text-muted-foreground text-lg">
              Track and manage your gym's expenses with detailed insights and analytics.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="shadow-sm" onClick={handleExport}>
              <Download className="mr-2 h-5 w-5" /> Export Data
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} size="lg" className="shadow-sm">
              <Plus className="mr-2 h-5 w-5" /> Add Expense
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
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">₹{insights.totalAmount.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {insights.totalCount} transactions
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
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">₹{insights.thisMonthExpenses.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      {insights.monthlyGrowth >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                      )}
                      {Math.abs(insights.monthlyGrowth).toFixed(1)}% vs last month
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg Amount</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">₹{insights.avgAmount.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Per transaction</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Filtered Count</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <BarChart2 className="h-5 w-5 text-orange-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{totalExpenses}</div>
                    <p className="text-xs text-muted-foreground">Current view</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Search Bar */}
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by description, category, or amount..."
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

          {/* Right Column - Category Breakdown */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <BarChart2 className="h-5 w-5 mr-2" />
                  Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-600/5">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Gym Expenses</span>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      ₹{insights.gymExpenses.toLocaleString()}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-green-600/5">
                    <div className="flex items-center space-x-2">
                      <ShoppingCart className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Retail</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      ₹{insights.retailExpenses.toLocaleString()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex flex-wrap gap-3">
            <Select 
              value={filters.category} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="w-[140px] h-11">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Gym">Gym</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.dateRange} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
            >
              <SelectTrigger className="w-[140px] h-11">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.amountRange} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, amountRange: value }))}
            >
              <SelectTrigger className="w-[140px] h-11">
                <SelectValue placeholder="Amount" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Amounts</SelectItem>
                <SelectItem value="under_1000">Under ₹1,000</SelectItem>
                <SelectItem value="1000_5000">₹1,000 - ₹5,000</SelectItem>
                <SelectItem value="5000_10000">₹5,000 - ₹10,000</SelectItem>
                <SelectItem value="over_10000">Over ₹10,000</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.sortBy} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
            >
              <SelectTrigger className="w-[140px] h-11">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="amount_high">Highest Amount</SelectItem>
                <SelectItem value="amount_low">Lowest Amount</SelectItem>
                <SelectItem value="description">Description</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button 
                variant="outline" 
                onClick={clearAllFilters}
                className="h-11"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Table Section */}
        <div className="mt-8">
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">Expense Records</CardTitle>
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
                    {totalExpenses} expenses
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-muted/50">
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense, index) => (
                      <motion.tr
                        key={expense._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {format(parseISO(expense.date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={expense.description}>
                            {expense.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getCategoryBadgeVariant(expense.category)} className="flex items-center gap-1 w-fit">
                            {getCategoryIcon(expense.category)}
                            {expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-red-600">
                          ₹{expense.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleView(expense)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(expense)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit Expense
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDeleteClick(expense._id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Expense
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                    {(!expenses || expenses.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          <div className="flex flex-col items-center space-y-2">
                            <DollarSign className="h-12 w-12 text-muted-foreground/50" />
                            <div className="text-lg font-medium">No expenses found</div>
                            <p className="text-sm">
                              {hasActiveFilters 
                                ? 'Try adjusting your search or filter criteria' 
                                : 'Get started by adding your first expense'}
                            </p>
                            {!hasActiveFilters && (
                              <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Expense
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
                    Showing {startItem} to {endItem} of {totalExpenses} expenses
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
                      {getPageNumbers().map((page, index) => (
                        <React.Fragment key={index}>
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
                        </React.Fragment>
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

        {/* Add Expense Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Expense
              </DialogTitle>
              <DialogDescription>
                Enter the expense details below to track your gym's spending.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="Enter amount"
                    required
                    className="h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter expense description"
                    required
                    className="min-h-[80px]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger id="category" className="h-11">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gym">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Gym
                        </div>
                      </SelectItem>
                      <SelectItem value="Retail">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          Retail
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Expense'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Expense Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Edit2 className="h-5 w-5" />
                Edit Expense
              </DialogTitle>
              <DialogDescription>
                Update the expense details below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-amount">Amount (₹)</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    className="min-h-[80px]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger id="edit-category" className="h-11">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gym">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Gym
                        </div>
                      </SelectItem>
                      <SelectItem value="Retail">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          Retail
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Expense'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Expense Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Expense Details
              </DialogTitle>
            </DialogHeader>
            {viewingExpense && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Amount</div>
                    <div className="text-xl font-bold text-red-600">₹{viewingExpense.amount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Category</div>
                    <Badge variant={getCategoryBadgeVariant(viewingExpense.category)} className="mt-1">
                      {getCategoryIcon(viewingExpense.category)}
                      <span className="ml-1">{viewingExpense.category}</span>
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Date</div>
                    <div className="font-medium">{format(parseISO(viewingExpense.date), 'MMM dd, yyyy')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Created</div>
                    <div className="font-medium">{format(parseISO(viewingExpense.updatedAt), 'MMM dd, yyyy')}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Description</div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    {viewingExpense.description}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the expense record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Expense
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </DashboardLayout>
  );
};

export default ExpensesPage;