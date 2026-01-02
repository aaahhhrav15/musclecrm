import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { 
  Download, 
  Filter, 
  MoreHorizontal, 
  Plus, 
  Eye, 
  Pencil,
  Search,
  FileText,
  DollarSign,
  Calendar as CalendarIcon,
  TrendingUp,
  Users,
  Trash2,
  X
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import InvoiceService, { Invoice } from '@/services/InvoiceService';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from '@tanstack/react-query';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import { EditInvoiceModal } from '@/components/invoices/EditInvoiceModal';
import axios from 'axios';
import { API_URL } from '@/lib/constants';
import * as Papa from 'papaparse';
import { addMonths, startOfMonth, endOfMonth, isSameDay, isSameMonth, isWithinInterval } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import InvoicePDF from '@/components/invoices/InvoicePDF';
import { useGym } from '@/context/GymContext';

const InvoicesPage: React.FC = () => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const [filterMode, setFilterMode] = useState<'daily' | 'monthly' | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMonthNumber, setSelectedMonthNumber] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedDayYear, setSelectedDayYear] = useState<number>(new Date().getFullYear());
  const [selectedDayMonth, setSelectedDayMonth] = useState<number>(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [pdfInvoice, setPdfInvoice] = useState<unknown>(null);
  const { gym } = useGym();

  // Fetch invoices
  const { data: invoices, isLoading, error, refetch } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      try {
        const response = await InvoiceService.getInvoices();
        return response;
      } catch (error: unknown) {
        console.error('Error fetching invoices:', error);
        toast.error('Failed to fetch invoices');
        throw error;
      }
    }
  });

  // Calculate invoice insights
  const invoiceInsights = React.useMemo(() => {
    if (!invoices) return {
      totalInvoices: 0,
      totalRevenue: 0,
      averageInvoiceValue: 0,
      thisMonthRevenue: 0,
      thisMonthInvoices: 0,
      todayRevenue: 0,
      todayInvoices: 0
    };

    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const todayStr = today.toISOString().split('T')[0];
    
    return {
      totalInvoices: invoices.length,
      totalRevenue: invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
      averageInvoiceValue: invoices.length > 0 ? invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0) / invoices.length : 0,
      thisMonthRevenue: invoices.filter(inv => new Date(inv.createdAt) >= thisMonth).reduce((sum, inv) => sum + (inv.amount || 0), 0),
      thisMonthInvoices: invoices.filter(inv => new Date(inv.createdAt) >= thisMonth).length,
      todayRevenue: invoices.filter(inv => new Date(inv.createdAt).toISOString().split('T')[0] === todayStr).reduce((sum, inv) => sum + (inv.amount || 0), 0),
      todayInvoices: invoices.filter(inv => new Date(inv.createdAt).toISOString().split('T')[0] === todayStr).length
    };
  }, [invoices]);

  // Calculate selected day and month metrics
  const selectedDayMetrics = React.useMemo(() => {
    if (filterMode === 'daily' && selectedDate) {
      const dayInvoices = invoices?.filter(inv => isSameDay(new Date(inv.createdAt), selectedDate)) || [];
      const total = dayInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      return { total, count: dayInvoices.length };
    }
    return { total: 0, count: 0 };
  }, [invoices, filterMode, selectedDate]);

  const selectedMonthMetrics = React.useMemo(() => {
    if (filterMode === 'monthly' && selectedMonth) {
      const monthInvoices = invoices?.filter(inv => isSameMonth(new Date(inv.createdAt), selectedMonth)) || [];
      const total = monthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      return { total, count: monthInvoices.length };
    }
    return { total: 0, count: 0 };
  }, [invoices, filterMode, selectedMonth]);

  // Filter invoices based on search query and date filters
  const filteredInvoices = invoices?.filter(invoice => {
    const query = searchQuery.toLowerCase();
    const customerName = typeof invoice.customerId === 'object' 
      ? invoice.customerId?.name?.toLowerCase() || '' 
      : '';
    const invoiceNumber = invoice.invoiceNumber?.toLowerCase() || '';
    const description = Array.isArray(invoice.items) && invoice.items.length > 0 
      ? invoice.items.map(item => item.description).join(', ').toLowerCase()
      : '';
    const invDate = new Date(invoice.createdAt);
    
    let matchesDate = true;
    if (filterMode === 'daily' && selectedDate) {
      matchesDate = isSameDay(invDate, selectedDate);
    } else if (filterMode === 'monthly' && selectedMonth) {
      matchesDate = isSameMonth(invDate, selectedMonth);
    }
    // If filterMode is 'all', show all invoices
    const matchesSearch = customerName.includes(query) || 
                         invoiceNumber.includes(query) || 
                         description.includes(query);
    return matchesSearch && matchesDate;
  }) || [];

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: {
      customerId: string;
      items: Array<{ description: string; amount: number; quantity?: number; unitPrice?: number }>;
      amount: number;
      dueDate: string;
      notes?: string;
      paymentMode?: string;
    }) => {
      console.log('Creating invoice with data:', data);
      try {
        const response = await axios.post(`${API_URL}/invoices`, {
          customerId: data.customerId,
          items: data.items,
          amount: data.amount,
          dueDate: data.dueDate,
          notes: data.notes,
          status: 'paid',
          currency: 'INR',
          paymentMode: data.paymentMode,
        }, { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Server response:', response.data);
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to create invoice');
        }
        return response.data;
      } catch (error: unknown) {
        let errorMessage = 'Failed to create invoice';
        if (typeof error === 'object' && error !== null && 'response' in error) {
          const err = error as { response?: { data?: { message?: string } } };
          errorMessage = err.response?.data?.message || errorMessage;
        } else if (error instanceof Error) {
          errorMessage = error.message || errorMessage;
        }
        console.error('Error in mutation function:', error);
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data) => {
      console.log('Invoice created successfully:', data);
      
      if (data.transaction) {
        toast.success(`Invoice created successfully! Transaction record has been automatically generated for tracking.`);
      } else {
        toast.success('Invoice created successfully');
      }
      
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setIsCreateInvoiceOpen(false);
    },
    onError: (error: unknown) => {
      const err = error as Error;
      console.error('Invoice creation failed:', err);
      toast.error(err.message || 'Failed to create invoice');
    },
  });

  const handleCreateInvoice = async (data: {
    customerId: string;
    items: Array<{ description: string; amount: number; quantity?: number; unitPrice?: number }>;
    amount: number;
    dueDate: string;
    notes?: string;
    paymentMode?: string;
  }) => {
    console.log('handleCreateInvoice called with data:', data);
    try {
      await createInvoiceMutation.mutateAsync(data);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error in handleCreateInvoice:', err);
      toast.error(err.message || 'Failed to create invoice. Please try again.');
    }
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteDialog(true);
  };

  const confirmDeleteInvoice = async () => {
    if (!invoiceToDelete?._id) {
      toast.error('Invalid invoice selected for deletion');
      return;
    }

    try {
      await InvoiceService.deleteInvoice(invoiceToDelete._id);
      toast.success('Invoice deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error deleting invoice:', err);
      toast.error('Failed to delete invoice');
    } finally {
      setShowDeleteDialog(false);
      setInvoiceToDelete(null);
    }
  };

  const handleEditInvoice = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEditModalOpen(true);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setPdfInvoice({ ...invoice, gym });
    setIsPDFModalOpen(true);
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    // The new InvoicePDF component handles PDF generation internally
    // Just open the invoice view modal
    setPdfInvoice({ ...invoice, gym });
    setIsPDFModalOpen(true);
  };

  const handleExport = () => {
    if (!filteredInvoices || filteredInvoices.length === 0) {
      toast("No data to export.");
      return;
    }

    const dataToExport = filteredInvoices.map(invoice => {
      const customer = typeof invoice.customerId === 'object' 
        ? invoice.customerId 
        : null;
      return {
        "Invoice Number": invoice.invoiceNumber,
        "Customer Name": customer?.name || 'N/A',
        "Customer Email": customer?.email || 'N/A',
        "Description": Array.isArray(invoice.items) && invoice.items.length > 0 
          ? invoice.items.map(item => item.description).join(', ') 
          : 'N/A',
        "Amount": invoice.amount || 0,
        "Currency": invoice.currency || 'INR',
        "Issue Date": format(new Date(invoice.createdAt), 'yyyy-MM-dd'),
        // Remove status if not present on Invoice type
        // "Status": invoice.status || 'N/A',
        "Notes": invoice.notes || ''
      };
    });

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `invoices-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Invoice data exported successfully!");
  };

  const clearFilters = () => {
    setSelectedDate(null);
    setSelectedMonth(null);
    setSearchQuery('');
  };

  // When either month or year changes, update selectedMonth
  useEffect(() => {
    setSelectedMonth(new Date(selectedYear, selectedMonthNumber, 1));
  }, [selectedMonthNumber, selectedYear]);

  // Helper to get days in month
  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  // When any daily dropdown changes, update selectedDate
  useEffect(() => {
    setSelectedDate(new Date(selectedDayYear, selectedDayMonth, selectedDay));
  }, [selectedDayYear, selectedDayMonth, selectedDay]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-6">
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

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-4 p-6">
          <div className="text-red-500">Error loading invoices. Please try again.</div>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Invoice Management
            </h1>
            <p className="text-muted-foreground">
              Create, track, and manage invoices with comprehensive financial insights.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button onClick={() => setIsCreateInvoiceOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> New Invoice
            </Button>
            <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" /> Export Data
            </Button>
          </div>
        </motion.div>

        {/* Metrics Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">{formatCurrency(invoiceInsights.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">From all invoices</p>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">{formatCurrency(invoiceInsights.todayRevenue)}</div>
                <p className="text-xs text-muted-foreground">{invoiceInsights.todayInvoices} invoices today</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Selected Day</CardTitle>
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">
                  {selectedDate
                    ? formatCurrency(selectedDayMetrics.total)
                    : formatCurrency(invoiceInsights.todayRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedDate
                    ? `${selectedDayMetrics.count} invoices`
                    : `${invoiceInsights.todayInvoices} invoices today`}
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Selected Month</CardTitle>
                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">
                  {selectedMonth
                    ? formatCurrency(selectedMonthMetrics.total)
                    : formatCurrency(invoiceInsights.thisMonthRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedMonth
                    ? `${selectedMonthMetrics.count} invoices`
                    : `${invoiceInsights.thisMonthInvoices} invoices this month`}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full sm:w-auto"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {(selectedDate || selectedMonth) && (
                <Badge variant="secondary" className="ml-2">
                  {selectedDate || selectedMonth ? '1' : '0'}
                </Badge>
              )}
            </Button>
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Filter Options</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Filter Mode</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant={filterMode === 'daily' ? 'default' : 'outline'}
                          onClick={() => setFilterMode('daily')}
                        >
                          Daily
                        </Button>
                        <Button
                          size="sm"
                          variant={filterMode === 'monthly' ? 'default' : 'outline'}
                          onClick={() => setFilterMode('monthly')}
                        >
                          Monthly
                        </Button>
                        <Button
                          size="sm"
                          variant={filterMode === 'all' ? 'default' : 'outline'}
                          onClick={() => setFilterMode('all')}
                        >
                          All
                        </Button>
                      </div>
                    </div>

                    {filterMode === 'daily' && (
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground">Select Day, Month & Year</label>
                        <div className="flex gap-2">
                          <Select
                            value={selectedDayYear.toString()}
                            onValueChange={val => setSelectedDayYear(Number(val))}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 21 }, (_, i) => {
                                const year = new Date().getFullYear() - 10 + i;
                                return (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <Select
                            value={selectedDayMonth.toString()}
                            onValueChange={val => setSelectedDayMonth(Number(val))}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                              {[...Array(12)].map((_, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={selectedDay.toString()}
                            onValueChange={val => setSelectedDay(Number(val))}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue placeholder="Day" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: getDaysInMonth(selectedDayYear, selectedDayMonth) }, (_, i) => (
                                <SelectItem key={i + 1} value={(i + 1).toString()}>
                                  {i + 1}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedDate && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => {
                              setSelectedDate(null);
                              setSelectedDayYear(new Date().getFullYear());
                              setSelectedDayMonth(new Date().getMonth());
                              setSelectedDay(new Date().getDate());
                            }}
                            className="w-full text-muted-foreground hover:text-foreground"
                          >
                            Clear Selection
                          </Button>
                        )}
                      </div>
                    )}

                    {filterMode === 'monthly' && (
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground">Select Month & Year</label>
                        <div className="flex gap-2">
                          <Select
                            value={selectedMonthNumber.toString()}
                            onValueChange={val => setSelectedMonthNumber(Number(val))}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                              {[...Array(12)].map((_, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={selectedYear.toString()}
                            onValueChange={val => setSelectedYear(Number(val))}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 21 }, (_, i) => {
                                const year = new Date().getFullYear() - 10 + i;
                                return (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedMonth && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => {
                              setSelectedMonth(null);
                              setSelectedMonthNumber(new Date().getMonth());
                              setSelectedYear(new Date().getFullYear());
                            }}
                            className="w-full text-muted-foreground hover:text-foreground"
                          >
                            Clear Selection
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Actions</label>
                      <Button 
                        variant="ghost" 
                        onClick={clearFilters} 
                        className="w-full"
                        size="sm"
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Table Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Invoices ({filteredInvoices?.length || 0})</CardTitle>
                <Badge variant="secondary">
                  {filteredInvoices?.length || 0} of {invoices?.length || 0}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                      {/* <TableHead className="hidden sm:table-cell">Due Date</TableHead> */}
                      <TableHead className="hidden sm:table-cell">Issue Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices?.map((invoice, index) => (
                      <TableRow key={invoice._id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {invoice.customerName || (typeof invoice.customerId === 'object' ? invoice.customerId?.name : 'N/A')}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                          {Array.isArray(invoice.items) && invoice.items.length > 0 
                            ? invoice.items.map(item => item.description).join(', ') 
                            : '-'}
                        </TableCell>
                        {/* <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                        </TableCell> */}
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(invoice.amount)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadInvoice(invoice)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDeleteInvoice(invoice)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!filteredInvoices || filteredInvoices.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center space-y-2">
                            <FileText className="h-12 w-12 text-muted-foreground/50" />
                            <div className="text-lg font-medium">No invoices found</div>
                            <p className="text-sm text-muted-foreground">
                              {searchQuery || selectedDate || selectedMonth
                                ? 'Try adjusting your search or filter criteria'
                                : 'Create your first invoice to get started'
                              }
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Modals */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the invoice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteInvoice}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InvoiceForm
        open={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        onSubmit={handleCreateInvoice}
      />

      <EditInvoiceModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
        }}
      />

      {isPDFModalOpen && pdfInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 h-5/6 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold">Invoice Preview</h2>
              <button onClick={() => setIsPDFModalOpen(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <InvoicePDF invoice={pdfInvoice as Invoice & { gym: any }} />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default InvoicesPage;