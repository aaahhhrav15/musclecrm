import React from 'react';
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
  MoreHorizontal
} from 'lucide-react';
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

// Mock data for invoices
const invoices = [
  { id: 'INV-001', member: 'John Smith', amount: '₹1,200', status: 'Paid', date: '2025-05-10', type: 'Membership', tax: '₹183', total: '₹1,383' },
  { id: 'INV-002', member: 'Alice Johnson', amount: '₹800', status: 'Pending', date: '2025-05-12', type: 'Personal Training', tax: '₹122', total: '₹922' },
  { id: 'INV-003', member: 'Robert Brown', amount: '₹1,500', status: 'Paid', date: '2025-05-14', type: 'Membership', tax: '₹229', total: '₹1,729' },
  { id: 'INV-004', member: 'Emma Wilson', amount: '₹500', status: 'Overdue', date: '2025-04-28', type: 'Supplement', tax: '₹76', total: '₹576' },
  { id: 'INV-005', member: 'Michael Davis', amount: '₹1,800', status: 'Paid', date: '2025-05-16', type: 'Membership', tax: '₹275', total: '₹2,075' },
  { id: 'INV-006', member: 'Sarah Garcia', amount: '₹700', status: 'Processing', date: '2025-05-18', type: 'Personal Training', tax: '₹107', total: '₹807' },
];

// Monthly revenue data
const monthlyRevenue = {
  current: '₹58,500',
  previous: '₹52,200',
  percentageChange: 12
};

const FinancePage: React.FC = () => {
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
            <h1 className="text-2xl font-bold tracking-tight">Finance & Billing</h1>
            <p className="text-muted-foreground">
              Manage your gym's financial transactions and invoices.
            </p>
          </div>
          <div className="flex gap-2">
            <Button>
              <File className="mr-2 h-4 w-4" /> Create Invoice
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthlyRevenue.current}</div>
              <p className="text-xs flex items-center">
                {monthlyRevenue.percentageChange > 0 ? (
                  <>
                    <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
                    <span className="text-green-500">{monthlyRevenue.percentageChange}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
                    <span className="text-red-500">{Math.abs(monthlyRevenue.percentageChange)}%</span>
                  </>
                )}
                <span className="text-muted-foreground ml-1">from last month</span>
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
              <File className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invoices.filter(inv => inv.status === 'Paid').length}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invoices.filter(inv => inv.status === 'Pending' || inv.status === 'Processing').length}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting payment</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invoices.filter(inv => inv.status === 'Overdue').length}
              </div>
              <p className="text-xs text-muted-foreground">Require follow-up</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="relative flex-1">
            <Input
              placeholder="Search invoices..."
              className="pl-8"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>
        </div>

        <Tabs defaultValue="invoices" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-4">
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden md:table-cell">Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Tax (GST)</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map(invoice => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{invoice.member}</TableCell>
                    <TableCell>{invoice.type}</TableCell>
                    <TableCell className="hidden md:table-cell">{invoice.date}</TableCell>
                    <TableCell className="hidden md:table-cell">{invoice.amount}</TableCell>
                    <TableCell className="hidden md:table-cell">{invoice.tax}</TableCell>
                    <TableCell>{invoice.total}</TableCell>
                    <TableCell>
                      <Badge variant={
                        invoice.status === 'Paid' ? 'default' :
                        invoice.status === 'Pending' ? 'secondary' :
                        invoice.status === 'Processing' ? 'outline' : 'destructive'
                      }>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost">
                          <Printer className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Invoice</DropdownMenuItem>
                            <DropdownMenuItem>Edit Invoice</DropdownMenuItem>
                            <DropdownMenuItem>Send to Member</DropdownMenuItem>
                            <DropdownMenuItem>Record Payment</DropdownMenuItem>
                            <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="payments">
            <div className="p-8 text-center text-muted-foreground">
              Payment history and transactions will be shown here.
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="p-8 text-center text-muted-foreground">
              Financial reports and analytics will be shown here.
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default FinancePage;
