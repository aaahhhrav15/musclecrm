
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Download, Search, Filter, Loader2, Eye, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Badge
} from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import InvoiceService, { Invoice, InvoiceFilterOptions } from '@/services/InvoiceService';

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending' | 'Overdue'>('All');
  const { toast } = useToast();

  // Load invoices from backend
  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      try {
        const filters: InvoiceFilterOptions = {};
        
        if (statusFilter !== 'All') {
          filters.status = statusFilter;
        }

        const response = await InvoiceService.getInvoices(filters);
        setInvoices(response.invoices);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        toast({
          title: 'Failed to load invoices',
          description: 'There was a problem loading your invoices.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [statusFilter, toast]);

  // Handle creating a new invoice
  const handleCreateInvoice = () => {
    toast({
      title: 'Create Invoice',
      description: 'This will connect to the backend API when implemented.',
    });
    // Future implementation:
    // Navigate to create invoice page or open modal
  };

  // Filter invoices by search query
  const filteredInvoices = invoices.filter(invoice => 
    invoice.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle viewing an invoice
  const handleViewInvoice = (invoiceId: string) => {
    toast({
      title: 'View Invoice',
      description: `Viewing invoice ${invoiceId}. This will connect to the backend when implemented.`,
    });
    // Future implementation:
    // Navigate to invoice details page
  };

  // Handle downloading an invoice
  const handleDownloadInvoice = (invoiceId: string) => {
    toast({
      title: 'Download Invoice',
      description: `Downloading invoice ${invoiceId}. This will connect to the backend when implemented.`,
    });
    // Future implementation:
    // Call backend to generate PDF and download
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground">
              Manage your billing and payment collection.
            </p>
          </div>
          <Button onClick={handleCreateInvoice}>
            <CreditCard className="mr-2 h-4 w-4" /> New Invoice
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select 
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as 'All' | 'Paid' | 'Pending' | 'Overdue')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading invoices...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{invoice.customer.name}</TableCell>
                      <TableCell>${invoice.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          invoice.status === 'Paid' 
                            ? 'default' 
                            : invoice.status === 'Pending' 
                            ? 'secondary' 
                            : 'destructive'
                        }>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleViewInvoice(invoice.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDownloadInvoice(invoice.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No invoices found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default InvoicesPage;
