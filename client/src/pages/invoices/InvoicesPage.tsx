import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Download, Filter, MoreHorizontal, Plus, Eye, Pencil } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const InvoicesPage: React.FC = () => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
      } catch (error: any) {
        console.error('Error in mutation function:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to create invoice';
        throw new Error(errorMessage);
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Invoices</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowFilterModal(true)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button onClick={() => setIsCreateInvoiceOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices?.map((invoice) => (
                    <TableRow key={invoice._id}>
                      <TableCell>{invoice.customerId?.name || 'N/A'}</TableCell>
                      <TableCell>{invoice.invoiceNumber}</TableCell>
                      <TableCell>{Array.isArray(invoice.items) && invoice.items.length > 0 ? invoice.items.map(item => item.description).join(', ') : '-'}</TableCell>
                      <TableCell>{format(new Date(invoice.dueDate), 'PPP')}</TableCell>
                      <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadInvoice(invoice)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteInvoice(invoice)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

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
      </div>
    </DashboardLayout>
  );
};

export default InvoicesPage;
