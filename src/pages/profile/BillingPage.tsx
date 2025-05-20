
import React from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Download, 
  Clock, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  PlusCircle,
  Trash
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Mock data for payment history
const paymentHistory = [
  { id: 'PAY-001', date: '2025-05-10', amount: '₹1,200', status: 'Completed', invoice: 'INV-001', method: 'Credit Card' },
  { id: 'PAY-002', date: '2025-04-10', amount: '₹1,200', status: 'Completed', invoice: 'INV-002', method: 'Credit Card' },
  { id: 'PAY-003', date: '2025-03-10', amount: '₹1,200', status: 'Completed', invoice: 'INV-003', method: 'Credit Card' },
  { id: 'PAY-004', date: '2025-02-10', amount: '₹1,200', status: 'Completed', invoice: 'INV-004', method: 'Credit Card' },
  { id: 'PAY-005', date: '2025-01-10', amount: '₹1,200', status: 'Completed', invoice: 'INV-005', method: 'Credit Card' },
];

// Mock data for payment methods
const paymentMethods = [
  { id: 1, type: 'Credit Card', last4: '4242', expiry: '06/2027', isDefault: true },
  { id: 2, type: 'Credit Card', last4: '5678', expiry: '09/2026', isDefault: false },
];

// Mock subscription data
const subscription = {
  plan: 'Gold Membership',
  status: 'Active',
  amount: '₹1,200',
  interval: 'Monthly',
  nextBilling: '2025-06-10',
  startDate: '2025-01-10',
};

const BillingPage: React.FC = () => {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6 max-w-4xl mx-auto"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing & Payments</h1>
          <p className="text-muted-foreground">
            Manage your subscription, payment methods, and billing history.
          </p>
        </div>

        {/* Subscription Information */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">{subscription.plan}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="default">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {subscription.status}
                    </div>
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {subscription.amount} / {subscription.interval}
                  </span>
                </div>
              </div>
              <Button>Manage Subscription</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Next Billing</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{subscription.nextBilling}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Started On</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{subscription.startDate}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Amount</p>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>{subscription.amount} / {subscription.interval}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Payment Methods</CardTitle>
              <Button size="sm" variant="outline" className="gap-1">
                <PlusCircle className="h-4 w-4" /> Add Payment Method
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex justify-between items-center p-4 border rounded-md">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-2 rounded-md">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {method.type} ending in {method.last4}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expires {method.expiry}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {method.isDefault && (
                    <Badge variant="outline">Default</Badge>
                  )}
                  <Button size="sm" variant="ghost">
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Payment History</CardTitle>
              <Button size="sm" variant="outline" className="gap-1">
                <Download className="h-4 w-4" /> Download All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Invoice</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.id}</TableCell>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell>{payment.amount}</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === 'Completed' ? 'default' : 'destructive'}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{payment.invoice}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="h-8 gap-1">
                        <Download className="h-3.5 w-3.5" /> Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default BillingPage;
