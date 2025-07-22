import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  CreditCard, 
  File, 
  PlusCircle, 
  Filter, 
  Download, 
  Printer,
  BarChart,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Search,
  Eye,
  Pencil,
  Trash,
  Calendar as CalendarIcon,
  TrendingUp
} from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import InvoiceService, { Invoice, CreateInvoiceData } from '@/services/InvoiceService';
import { formatCurrency } from '@/lib/utils';
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
import InvoiceForm from '@/components/invoices/InvoiceForm';
import axios from 'axios';
import { API_URL } from '@/lib/constants';
import { EditInvoiceModal } from '@/components/invoices/EditInvoiceModal';
import CustomerService, { Customer } from '@/services/CustomerService';
import { Calendar } from '@/components/ui/calendar';
import { addMonths, startOfMonth, endOfMonth, isSameDay, isSameMonth, isWithinInterval } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import * as Papa from 'papaparse';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import InvoicePDF from '@/components/invoices/InvoicePDF';
import { useGym } from '@/context/GymContext';

type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};
type InvoiceSubmitData = {
  customerId: string;
  items: InvoiceItem[];
  amount: number;
  dueDate: Date;
  notes?: string;
  currency: string;
  paymentMode: string;
};

const FinancePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const [filterMode, setFilterMode] = useState<'daily' | 'monthly' | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDayYear, setSelectedDayYear] = useState<number>(new Date().getFullYear());
  const [selectedDayMonth, setSelectedDayMonth] = useState<number>(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [selectedMonthNumber, setSelectedMonthNumber] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [pdfInvoice, setPdfInvoice] = useState<unknown>(null);
  const { gym } = useGym();

  // Fetch customers
  const { data: customersData } = useQuery<{ customers: Customer[]; total: number }>({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        const response = await CustomerService.getCustomers();
        return response;
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast.error('Failed to fetch customers');
        return { customers: [], total: 0 };
      }
    }
  });

  const customers: Customer[] = customersData?.customers || [];

  // Fetch invoices
  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      try {
        const response = await InvoiceService.getInvoices();
        return response;
      } catch (error) {
        console.error('Error fetching invoices:', error);
        toast.error('Failed to fetch invoices');
        throw error;
      }
    }
  });

  // Calculate financial metrics
  const metrics = {
    totalRevenue: invoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0,
    invoiceCount: invoices?.length || 0,
  };

  // Helper: get today's revenue
  const today = new Date();
  const todayRevenue = invoices?.reduce((sum, inv) => {
    const invDate = new Date(inv.createdAt);
    return isSameDay(invDate, today) ? sum + inv.amount : sum;
  }, 0) || 0;

  // Helper: get this month's revenue
  const thisMonthStart = startOfMonth(today);
  const thisMonthEnd = endOfMonth(today);
  const thisMonthRevenue = invoices?.reduce((sum, inv) => {
    const invDate = new Date(inv.createdAt);
    return isWithinInterval(invDate, { start: thisMonthStart, end: thisMonthEnd }) ? sum + inv.amount : sum;
  }, 0) || 0;

  // Revenue for selected day
  const selectedDayRevenue = selectedDate
    ? invoices?.reduce((sum, inv) => {
        const invDate = new Date(inv.createdAt);
        return isSameDay(invDate, selectedDate) ? sum + inv.amount : sum;
      }, 0) || 0
    : null;

  // Revenue for selected month
  const selectedMonthRevenue = selectedMonth
    ? invoices?.reduce((sum, inv) => {
        const invDate = new Date(inv.createdAt);
        return isSameMonth(invDate, selectedMonth) ? sum + inv.amount : sum;
      }, 0) || 0
    : null;

  // Helper to get days in month
  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  // When any daily dropdown changes, update selectedDate
  useEffect(() => {
    setSelectedDate(new Date(selectedDayYear, selectedDayMonth, selectedDay));
  }, [selectedDayYear, selectedDayMonth, selectedDay]);

  // When either month or year changes, update selectedMonth
  useEffect(() => {
    setSelectedMonth(new Date(selectedYear, selectedMonthNumber, 1));
  }, [selectedMonthNumber, selectedYear]);

  const handleViewInvoice = (invoiceId: string) => {
    const invoice = invoices?.find((inv) => inv._id === invoiceId);
    if (invoice) {
      setPdfInvoice({ ...invoice, gym });
      setIsPDFModalOpen(true);
    } else {
      toast.error('Invoice not found');
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    const invoice = invoices?.find((inv) => inv._id === invoiceId);
    if (!invoice) {
      toast.error('Invoice not found');
      return;
    }
    try {
      const blob = await pdf(<InvoicePDF invoice={{ ...invoice, gym }} />).toBlob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber || invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  const handlePrintInvoice = async (invoiceId: string) => {
    try {
      const blob = await InvoiceService.downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      toast.success('Invoice opened for printing');
    } catch (error) {
      console.error('Error printing invoice:', error);
      toast.error('Failed to print invoice');
    }
  };

  const handleEditInvoice = async (invoiceId: string) => {
    try {
      const invoice = await InvoiceService.getInvoice(invoiceId);
      setSelectedInvoice(invoice);
      setIsEditModalOpen(true);
      toast.success('Invoice loaded for editing');
    } catch (error) {
      console.error('Error loading invoice for editing:', error);
      toast.error('Failed to load invoice for editing');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      await InvoiceService.deleteInvoice(invoiceId);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted successfully');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    }
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
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    } finally {
      setShowDeleteDialog(false);
      setInvoiceToDelete(null);
    }
  };

  // Filter invoices based on search query and selected date/month
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
    mutationFn: async (data: CreateInvoiceData) => {
      console.log('Creating invoice with data:', data);
      try {
        const response = await axios.post(`${API_URL}/invoices`, {
          customerId: data.customerId,
          items: data.items,
          amount: data.amount,
          dueDate: data.dueDate,
          notes: data.notes,
          status: 'pending',
          currency: 'INR'
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
        if (typeof error === 'object' && error !== null && 'response' in error) {
          // @ts-ignore
          throw new Error(error.response?.data?.message || 'Failed to create invoice');
        }
        throw new Error('Failed to create invoice');
      }
    },
    onSuccess: (data) => {
      console.log('Invoice created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created successfully');
      setIsCreateInvoiceOpen(false);
    },
    onError: (error: Error) => {
      console.error('Invoice creation failed:', error);
      toast.error(error.message || 'Failed to create invoice');
    },
  });

  const handleCreateInvoice = async (data: InvoiceSubmitData) => {
    // Convert dueDate to string if it's a Date
    const dueDateString = data.dueDate instanceof Date ? data.dueDate.toISOString() : data.dueDate;
    const createData: CreateInvoiceData = {
      customerId: data.customerId,
      amount: data.amount,
      currency: data.currency,
      dueDate: dueDateString,
      items: data.items,
      notes: data.notes,
    };
    try {
      await createInvoiceMutation.mutateAsync(createData);
    } catch (error) {
      console.error('Error in handleCreateInvoice:', error);
      toast.error('Failed to create invoice. Please try again.');
    }
  };

  const handleExport = () => {
    if (!filteredInvoices || filteredInvoices.length === 0) {
      toast.info("No data to export.");
      return;
    }

    const dataToExport = filteredInvoices.map(invoice => {
      const customer = typeof invoice.customerId === 'object' 
        ? invoice.customerId 
        : customers.find(c => c.id === invoice.customerId);

      return {
        "Invoice Number": invoice.invoiceNumber,
        "Customer Name": customer?.name || 'N/A',
        "Customer Email": customer?.email || 'N/A',
        "Date": format(new Date(invoice.createdAt), 'yyyy-MM-dd'),
        "Cost": invoice.amount,
        "Description": invoice.items.map(item => item.description).join(', '),
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
    toast.success("Data exported successfully!");
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

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="text-red-500">Error loading invoices. Please try again.</div>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['invoices'] })}>
            Retry
          </Button>
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
        {/* Header Section with Better Spacing */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-4 border-b">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Finance & Billing
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your gym's financial transactions and invoices with ease.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setIsCreateInvoiceOpen(true)} size="lg" className="shadow-sm">
              <PlusCircle className="mr-2 h-5 w-5" /> Create Invoice
            </Button>
            <Button variant="outline" size="lg" className="shadow-sm" onClick={handleExport}>
              <Download className="mr-2 h-5 w-5" /> Export Data
            </Button>
          </div>
        </div>

        {/* Combined Layout - Metrics, Filters, and Search */}
        <div className="grid grid-cols-1 xl:grid-cols-6 gap-6">
          {/* Left Column - Main Metrics (4 columns on xl screens) */}
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
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      All time earnings
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
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <File className="h-5 w-5 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{metrics.invoiceCount}</div>
                    <p className="text-xs text-muted-foreground">Generated invoices</p>
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
                    <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <BarChart className="h-5 w-5 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{formatCurrency(thisMonthRevenue)}</div>
                    <p className="text-xs text-muted-foreground">Current month revenue</p>
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
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {filterMode === 'daily' && selectedDate ? 'Selected Day' : filterMode === 'monthly' && selectedMonth ? 'Selected Month' : 'Today'}
                    </CardTitle>
                    <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <CalendarIcon className="h-5 w-5 text-orange-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">
                      {filterMode === 'daily' && selectedDate
                        ? formatCurrency(selectedDayRevenue || 0)
                        : filterMode === 'monthly' && selectedMonth
                        ? formatCurrency(selectedMonthRevenue || 0)
                        : formatCurrency(todayRevenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {filterMode === 'daily' && selectedDate
                        ? selectedDate.toLocaleDateString()
                        : filterMode === 'monthly' && selectedMonth
                        ? selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
                        : 'Today\'s revenue'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Search Bar - directly below metrics, full width */}
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice number or customer..."
                  className="pl-10 h-11 shadow-sm border-muted-foreground/20 focus:ring-2 focus:ring-primary/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Filters only (no search bar) */}
          <div className="xl:col-span-2 space-y-6">
            {/* Filter Controls */}
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Filter Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground">Filter Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant={filterMode === 'all' ? 'default' : 'outline'}
                      onClick={() => setFilterMode('all')}
                      className="w-full"
                    >
                      All Invoices
                    </Button>
                    <Button
                      size="sm"
                      variant={filterMode === 'daily' ? 'default' : 'outline'}
                      onClick={() => setFilterMode('daily')}
                      className="w-full"
                    >
                      Daily
                    </Button>
                    <Button
                      size="sm"
                      variant={filterMode === 'monthly' ? 'default' : 'outline'}
                      onClick={() => setFilterMode('monthly')}
                      className="w-full"
                    >
                      Monthly
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
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Table Section - Full width and lower */}
        <div className="mt-8">
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">Invoice Management</CardTitle>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {filteredInvoices?.length || 0} invoices
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-muted/50">
                      <TableHead className="font-semibold">Invoice Number</TableHead>
                      <TableHead className="font-semibold">Customer</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices?.map((invoice, index) => (
                      <motion.tr
                        key={invoice._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-medium text-primary">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell className="font-medium">
                          {typeof invoice.customerId === 'string'
                            ? (customers.find((c) => c.id === invoice.customerId)?.name || 'N/A')
                            : invoice.customerId?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleViewInvoice(invoice._id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditInvoice(invoice._id)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadInvoice(invoice._id)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDeleteInvoice(invoice._id)}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete Invoice
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the invoice
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteInvoice}>
              Delete
            </AlertDialogAction>
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
            <div className="flex-1 overflow-auto">
              <PDFViewer width="100%" height="100%">
                <InvoicePDF invoice={pdfInvoice as Invoice} />
              </PDFViewer>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default FinancePage;