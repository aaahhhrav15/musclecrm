import * as React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { PaymentService, Payment } from '@/services/PaymentService';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, DollarSign, User, Phone, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentsPage() {
  const { toast } = useToast();

  const { data: payments = [], isLoading, error } = useQuery<Payment[]>({
    queryKey: ['payments'],
    queryFn: () => PaymentService.getPaidPayments(),
  });

  const formatAmount = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100); // Convert from paise to rupees
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-4 border-b">
            <div className="space-y-2">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-6 w-96" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-4 border-b">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Payments
              </h1>
              <p className="text-muted-foreground text-lg">
                View all paid payments for your gym.
              </p>
            </div>
          </div>
          <Card className="shadow-lg border-0">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">Error Loading Payments</h3>
                  <p className="text-muted-foreground">Failed to load payment data. Please try again.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-4 border-b">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Payments
            </h1>
            <p className="text-muted-foreground text-lg">
              View all paid payments for your gym.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              {payments.length} Paid Payments
            </Badge>
          </div>
        </div>

        {payments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {payments.map((payment) => (
              <Card key={payment._id} className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-200">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment #{payment.razorpay_order_id.slice(-8)}
                    </CardTitle>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Paid
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Paid on {formatDateTime(payment.createdAt)}
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Amount</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatAmount(payment.amount, payment.currency)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Order ID</span>
                      <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {payment.razorpay_order_id}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{payment.customer.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{payment.customer.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">Paid on</span>
                          <span className="text-sm text-muted-foreground">{formatDateTime(payment.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {payment.meta?.products && payment.meta.products.length > 0 && (
                      <div className="pt-3 border-t">
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-foreground">Products ({payment.meta.products.length})</span>
                          {payment.meta.products.map((product, index) => (
                            <div key={index} className="bg-muted/30 rounded-lg p-3 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{product.name}</span>
                                <span className="text-sm font-medium text-green-600">
                                  {formatAmount(product.total * 100, payment.currency)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Qty: {product.quantity}</span>
                                <span>Unit: {formatAmount(product.price * 100, payment.currency)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {payment.meta?.gym && (
                      <div className="pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Gym</span>
                          <span className="text-sm font-medium">{payment.meta.gym.name}</span>
                        </div>
                      </div>
                    )}

                    {payment.meta?.isCartCheckout !== undefined && (
                      <div className="pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Checkout Type</span>
                          <span className="text-sm font-medium">
                            {payment.meta.isCartCheckout ? 'Cart Checkout' : 'Single Product'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Key ID</span>
                        <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {payment.key_id}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-lg border-0">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <div>
                  <h3 className="text-lg font-semibold">No Payments Found</h3>
                  <p className="text-muted-foreground">No paid payments have been recorded yet.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
