
import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Download, Search, Filter } from 'lucide-react';
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

// Mock data for invoices
const invoices = [
  { id: 'INV-0001', customer: 'Alice Johnson', amount: '$150.00', status: 'Paid', date: '2025-05-15' },
  { id: 'INV-0002', customer: 'Bob Smith', amount: '$85.50', status: 'Pending', date: '2025-05-16' },
  { id: 'INV-0003', customer: 'Carol Davis', amount: '$220.00', status: 'Paid', date: '2025-05-10' },
  { id: 'INV-0004', customer: 'David Wilson', amount: '$75.00', status: 'Overdue', date: '2025-04-28' },
  { id: 'INV-0005', customer: 'Eve Brown', amount: '$190.00', status: 'Pending', date: '2025-05-18' },
];

const InvoicesPage: React.FC = () => {
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
          <Button>
            <CreditCard className="mr-2 h-4 w-4" /> New Invoice
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              className="pl-8"
            />
          </div>
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.customer}</TableCell>
                  <TableCell>{invoice.amount}</TableCell>
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
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default InvoicesPage;
