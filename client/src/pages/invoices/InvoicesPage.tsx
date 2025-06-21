import React, { useState } from 'react';
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
  Calendar,
  TrendingUp,
  Users,
  Trash2
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

const InvoicesPage: React.FC = () => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch invoices
  const { data: invoices, isLoading, error, refetch } = useQuery({
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

  // Filter invoices based on search query
  const filteredInvoices = invoices?.filter(invoice => {
    const query = searchQuery.toLowerCase();
    const customerName = typeof invoice.customerId === 'object' 
      ? invoice.customerId?.name?.toLowerCase() || '' 
      : '';
    const invoiceNumber = invoice.invoiceNumber?.toLowerCase() || '';
    const description = Array.isArray(invoice.items) && invoice.items.length > 0 
      ? invoice.items.map(item => item.description).join(', ').toLowerCase()
      : '';
    
    return (
      customerName.includes(query) ||
      invoiceNumber.includes(query) ||
      description.includes(query)
    );
  }) || [];

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
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
      } catch (error: any) {
        console.error('Error in mutation function:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to create invoice';
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data) => {
      console.log('Invoice created successfully:', data);
      
      // Show success message with transaction information if created
      if (data.transaction) {
        toast.success(`Invoice created successfully! Transaction record has been automatically generated for tracking.`);
      } else {
        toast.success('Invoice created successfully');
      }
      
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      // Also invalidate transactions query to refresh transaction history
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setIsCreateInvoiceOpen(false);
    },
    onError: (error: Error) => {
      console.error('Invoice creation failed:', error);
      toast.error(error.message || 'Failed to create invoice');
    },
  });

  const handleCreateInvoice = async (data: any) => {
    console.log('handleCreateInvoice called with data:', data);
    try {
      await createInvoiceMutation.mutateAsync(data);
    } catch (error: any) {
      console.error('Error in handleCreateInvoice:', error);
      toast.error(error.message || 'Failed to create invoice. Please try again.');
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      const blob = await InvoiceService.downloadInvoice(invoice._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
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
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    } finally {
      setShowDeleteDialog(false);
      setInvoiceToDelete(null);
    }
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    try {
      const blob = await InvoiceService.downloadInvoice(invoice._id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      toast.success('Invoice opened in new tab');
    } catch (error) {
      console.error('Error viewing invoice:', error);
      toast.error('Failed to view invoice');
    }
  };

  const handleEditInvoice = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEditModalOpen(true);
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
        "Due Date": format(new Date(invoice.dueDate), 'yyyy-MM-dd'),
        "Created Date": format(new Date(invoice.createdAt), 'yyyy-MM-dd'),
        "Status": invoice.status || 'N/A',
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
          <Button onClick={() => refetch()}>Retry</Button>
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
              Invoice Management
            </h1>
            <p className="text-muted-foreground text-lg">
              Create, track, and manage invoices with comprehensive financial insights.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setIsCreateInvoiceOpen(true)} size="lg" className="shadow-sm">
              <Plus className="mr-2 h-5 w-5" /> New Invoice
            </Button>
            <Button variant="outline" size="lg" className="shadow-sm" onClick={handleExport}>
              <Download className="mr-2 h-5 w-5" /> Export Data
            </Button>
          </div>
        </div>

        {/* Insights Dashboard */}
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
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{invoiceInsights.totalInvoices}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      All invoices
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
                transition={{ delay: 0.3 }}
              >
                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Average Value</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{formatCurrency(invoiceInsights.averageInvoiceValue)}</div>
                    <p className="text-xs text-muted-foreground">Per invoice</p>
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
                    <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{formatCurrency(invoiceInsights.todayRevenue)}</div>
                    <p className="text-xs text-muted-foreground">{invoiceInsights.todayInvoices} invoices today</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Search Bar */}
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice number, customer name, or description..."
                  className="pl-10 h-11 shadow-sm border-muted-foreground/20 focus:ring-2 focus:ring-primary/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Monthly Breakdown */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Monthly Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-600/5">
                    <div className="text-sm font-medium text-muted-foreground mb-2">This Month Revenue</div>
                    <div className="text-2xl font-bold">{formatCurrency(invoiceInsights.thisMonthRevenue)}</div>
                    <div className="text-xs text-muted-foreground">{invoiceInsights.thisMonthInvoices} invoices generated</div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-green-600/5">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Average Invoice Value</div>
                    <div className="text-2xl font-bold">{formatCurrency(invoiceInsights.averageInvoiceValue)}</div>
                    <div className="text-xs text-muted-foreground">Per invoice average</div>
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
                <CardTitle className="text-xl font-semibold">Invoice Directory</CardTitle>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {filteredInvoices?.length || 0} invoices
                  </Badge>
                  <Button
                    variant="outline"
                    onClick={() => setShowFilterModal(true)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
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
                      <TableHead className="font-semibold">Invoice Number</TableHead>
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="font-semibold">Due Date</TableHead>
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
                        <TableCell className="font-medium">
                          {typeof invoice.customerId === 'object' ? invoice.customerId?.name : 'N/A'}
                        </TableCell>
                        <TableCell className="font-mono text-primary">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {Array.isArray(invoice.items) && invoice.items.length > 0 
                            ? invoice.items.map(item => item.description).join(', ') 
                            : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(invoice.amount)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadInvoice(invoice)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDeleteInvoice(invoice)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Invoice
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                    {(!filteredInvoices || filteredInvoices.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          <div className="flex flex-col items-center space-y-2">
                            <FileText className="h-12 w-12 text-muted-foreground/50" />
                            <div className="text-lg font-medium">No invoices found</div>
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
    </DashboardLayout>
  );
};

export default InvoicesPage;