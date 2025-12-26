import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Calendar, 
  DollarSign,
  Clock,
  CheckCircle,
  ArrowLeft,
  Download,
  Filter,
  Search,
  Receipt,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronUp,
  Archive,
  Clock3,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import axiosInstance from '@/lib/axios';
import { loadRazorpayScript, RazorpayResponse, RazorpayOptions, RazorpayInstance } from '@/lib/razorpay';
import { toast } from 'sonner';
import * as Papa from 'papaparse';
import { useAuth } from '@/context/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';

interface PaymentHistory {
  _id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  amount: number;
  currency: string;
  status: string;
  subscriptionType: string;
  subscriptionDuration: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  createdAt: string;
  gymName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
}

interface ApiMemberBill {
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  monthlyFee: number;
  originalMonthlyFee?: number;
  daysActive?: number;
  membershipType?: string;
  billingStatus?: string;
  paymentDate?: string;
  paymentMethod?: string;
  transactionId?: string;
  daysInMonth?: number;
}

interface MemberBillingDetail {
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  membershipType: string;
  membershipStartDate: string | null;
  membershipEndDate: string | null;
  daysActive: number;
  daysInMonth: number;
  fixedMonthlyFee: number;
  proRatedAmount: number;
  isActive: boolean;
  billingStatus: string;
  paymentDate: string | null;
  paymentMethod: string | null;
  transactionId: string | null;
  notes: string;
}

interface BillingBreakdown {
  basic: { count: number; totalAmount: number; paidAmount: number; pendingAmount: number };
  premium: { count: number; totalAmount: number; paidAmount: number; pendingAmount: number };
  vip: { count: number; totalAmount: number; paidAmount: number; pendingAmount: number };
  personal_training: { count: number; totalAmount: number; paidAmount: number; pendingAmount: number };
}

interface PaymentHistoryEntry {
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  transactionId: string | null;
  description: string;
  processedBy: string;
}

interface MonthlyBilling {
  billingId: string;
  billingMonth: number;
  billingYear: number;
  monthName: string;
  totalBillAmount: number;
  totalPaidAmount: number;
  totalPendingAmount: number;
  totalOverdueAmount: number;
  billingStatus: string;
  memberCount: number;
  dueDate: string;
  paymentDeadline: string;
  memberBills?: ApiMemberBill[];
  billingBreakdown?: BillingBreakdown;
  paymentHistory?: PaymentHistoryEntry[];
  isFinalized?: boolean;
  finalizedAt?: string;
}

const PaymentHistoryPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [monthlyBilling, setMonthlyBilling] = useState<MonthlyBilling[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false); // Track if data has been fetched
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'billing'>(() => {
    try {
      const saved = localStorage.getItem('ph_active_tab');
      return saved === 'billing' ? 'billing' : 'subscriptions';
    } catch {
      return 'subscriptions';
    }
  });
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [membershipFilter, setMembershipFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [expandedBilling, setExpandedBilling] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();
  const { loading: authLoading } = useRequireAuth();

  // Toggle billing dropdown
  const toggleBillingDropdown = (billingId: string) => {
    setExpandedBilling(expandedBilling === billingId ? null : billingId);
  };

  // Helper function to convert API member bill to MemberBillingDetail
  const convertApiBillToDetail = (bill: ApiMemberBill): MemberBillingDetail => {
    console.log('Converting API bill to detail:', {
      memberName: bill.memberName,
      daysActive: bill.daysActive,
      daysInMonth: bill.daysInMonth,
      originalMonthlyFee: bill.originalMonthlyFee,
      monthlyFee: bill.monthlyFee,
      rawBill: bill
    });
    
    // Calculate pro-rated amount if not provided or is 0
    const daysActive = bill.daysActive || 0;
    const daysInMonth = bill.daysInMonth || 30;
    const baseFee = bill.originalMonthlyFee || 41.67;
    
    // Always calculate the pro-rated amount using the formula in frontend
    const proRatedAmount = daysActive > 0 && daysInMonth > 0 ? (baseFee * daysActive) / daysInMonth : 0;
    
    // Debug: Test the calculation with known values
    const testResult = (41.67 * 15) / 30; // Should be 20.835
    console.log('Test calculation verification:', {
      testFormula: '(41.67 * 15) / 30',
      testResult: testResult,
      isCorrect: testResult === 20.835
    });
    
    console.log('Pro-rated calculation:', {
      memberName: bill.memberName,
      daysActive,
      daysInMonth,
      baseFee,
      calculatedProRated: proRatedAmount,
      providedProRated: bill.monthlyFee,
      formula: `(${baseFee} * ${daysActive}) / ${daysInMonth} = ${proRatedAmount}`,
      testCalculation: `Test: (41.67 * 15) / 30 = ${(41.67 * 15) / 30}`,
      rawBill: bill
    });
    
    return {
      memberId: bill.memberId,
      memberName: bill.memberName,
      memberEmail: bill.memberEmail || '', // No filler email
      memberPhone: bill.memberPhone || '', // No filler phone
      membershipType: bill.membershipType || 'basic',
      membershipStartDate: null,
      membershipEndDate: null,
      daysActive: daysActive,
      daysInMonth: daysInMonth,
      fixedMonthlyFee: baseFee,
      proRatedAmount: proRatedAmount,
      isActive: true,
      billingStatus: '', // Remove individual member status - status is for gym as whole
      paymentDate: bill.paymentDate || null,
      paymentMethod: bill.paymentMethod || null,
      transactionId: bill.transactionId || null,
      notes: ''
    };
  };

  // Debug authentication (same as Dashboard)
  console.log('PaymentHistoryPage - Auth Debug:', {
    isAuthenticated,
    user: user ? user.email : 'No user',
    authLoading,
    localStorage: {
      token: localStorage.getItem('token'),
      adminToken: localStorage.getItem('adminToken')
    }
  });

  const fetchPaymentHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/crm-subscription-payments');
      if (response.data.success) {
        setPayments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast.error('Failed to fetch payment history');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMonthlyBilling = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch current month billing with detailed member information
      const currentMonthResponse = await axiosInstance.get('/gym/billing/current-month');
      
      console.log('Current month billing response:', currentMonthResponse.data);
      
      const billingData = [];
      
      if (currentMonthResponse.data.success && currentMonthResponse.data.billing) {
        console.log('Raw memberBills from API:', currentMonthResponse.data.billing.memberBills);
        
        const currentMonth = {
          ...currentMonthResponse.data.billing,
          memberBills: (currentMonthResponse.data.billing.memberBills || []).map(convertApiBillToDetail),
          billingBreakdown: currentMonthResponse.data.billing.billingBreakdown,
          paymentHistory: currentMonthResponse.data.billing.paymentHistory || []
        };
        
        console.log('Processed currentMonth:', currentMonth);
        billingData.push(currentMonth);
      } else if (currentMonthResponse.data.success && !currentMonthResponse.data.billing) {
        // No bill stored / no active registered members, but we still want a current-month row
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const monthName = now.toLocaleString('default', { month: 'long' });

        console.log('Current month billing not available yet. Creating empty current month entry.');

        const emptyCurrentMonth: MonthlyBilling = {
          billingId: `CURRENT-${year}${String(month).padStart(2, '0')}`,
          billingMonth: month,
          billingYear: year,
          monthName,
          totalBillAmount: 0,
          totalPaidAmount: 0,
          totalPendingAmount: 0,
          totalOverdueAmount: 0,
          billingStatus: 'no_billing',
          memberCount: 0,
          dueDate: new Date(year, month, 0).toISOString(),
          paymentDeadline: new Date(year, month, 0).toISOString(),
          memberBills: [],
          billingBreakdown: undefined,
          paymentHistory: [],
          isFinalized: false,
          finalizedAt: undefined
        };

        billingData.push(emptyCurrentMonth);
      }
      
      // Fetch history for additional months
      const historyResponse = await axiosInstance.get('/gym/billing/history?months=12');
      
      if (historyResponse.data.success && historyResponse.data.billingHistory) {
        historyResponse.data.billingHistory.forEach((billing: MonthlyBilling & { month: number; year: number }) => {
          const isCurrentMonth = new Date().getMonth() + 1 === billing.month && 
                                 new Date().getFullYear() === billing.year;
          if (!isCurrentMonth && billing) {
            const processedBilling = {
              billingId: billing.billingId,
              billingMonth: billing.month,
              billingYear: billing.year,
              monthName: billing.monthName,
              totalBillAmount: billing.totalBillAmount,
              totalPaidAmount: billing.totalPaidAmount,
              totalPendingAmount: billing.totalPendingAmount,
              totalOverdueAmount: billing.totalOverdueAmount,
              billingStatus: billing.billingStatus,
              memberCount: billing.memberBills ? billing.memberBills.length : (billing.memberCount || 0),
              dueDate: billing.dueDate,
              paymentDeadline: billing.paymentDeadline,
              memberBills: billing.memberBills ? (billing.memberBills as ApiMemberBill[]).map(convertApiBillToDetail) : [],
              billingBreakdown: billing.billingBreakdown,
              paymentHistory: (billing as unknown as { paymentHistory?: PaymentHistoryEntry[] }).paymentHistory || [],
              finalizedAt: (billing as unknown as { finalizedAt?: string }).finalizedAt
            };
            billingData.push(processedBilling);
          }
        });
      }
      
      console.log('Final billing data:', billingData);
      console.log('First billing breakdown:', billingData[0]?.billingBreakdown);
      console.log('First billing memberBills:', billingData[0]?.memberBills);
      setMonthlyBilling(billingData);
    } catch (error) {
      console.error('Error fetching monthly billing:', error);
      toast.error('Failed to fetch monthly billing');
    } finally {
      setLoading(false);
      setDataFetched(true); // Mark as fetched to prevent infinite loop
    }
  }, []);

  // Persist active tab across refreshes
  useEffect(() => {
    try {
      localStorage.setItem('ph_active_tab', activeTab);
    } catch {}
  }, [activeTab]);

  // Handle paying a bill (stub - integrate with payment API as needed)
  const handlePayBill = async (billingId: string) => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast.error('Failed to load Razorpay. Please try again.');
      return;
    }

    try {
      // Create order on backend (server decides amount)
      const orderRes = await axiosInstance.post(`/gym/billing/gym/${billingId}/razorpay/create-order`);
      if (!orderRes.data.success) {
        toast.error(orderRes.data.message || 'Failed to create payment order');
        return;
      }
      const { order, keyId } = orderRes.data;

      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Monthly Bill Payment',
        description: `Bill #${billingId}`,
        order_id: order.id,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await axiosInstance.post(`/gym/billing/gym/${billingId}/razorpay/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            if (verifyRes.data.success) {
              toast.success('Payment successful and verified');
              // Refresh data
              fetchMonthlyBilling();
            } else {
              toast.error(verifyRes.data.message || 'Payment verification failed');
            }
          } catch (err) {
            toast.error('Payment verification error');
          }
        },
        prefill: {},
        notes: {},
        theme: { color: '#0ea5e9' }
      };

      type RazorpayCtor = new (options: RazorpayOptions) => RazorpayInstance;
      const RazorpayClass = (window as unknown as { Razorpay: RazorpayCtor }).Razorpay;
      const rzp = new RazorpayClass(options);
      rzp.open();
    } catch (error) {
      toast.error('Failed to initialize payment');
    }
  };

  useEffect(() => {
    if (!authLoading && !dataFetched) {
      fetchPaymentHistory();
      fetchMonthlyBilling();
    }
  }, [authLoading, dataFetched, fetchPaymentHistory, fetchMonthlyBilling]);

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading payment history...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleExport = () => {
    if (activeTab === 'subscriptions') {
    const csvData = payments.map(payment => ({
      'Order ID': payment.razorpay_order_id,
      'Payment ID': payment.razorpay_payment_id,
      'Amount': `₹${payment.amount}`,
      'Subscription Type': payment.subscriptionType,
      'Duration': payment.subscriptionDuration,
      'Payment Date': new Date(payment.createdAt).toLocaleDateString(),
      'Start Date': new Date(payment.subscriptionStartDate).toLocaleDateString(),
      'End Date': new Date(payment.subscriptionEndDate).toLocaleDateString(),
      'Status': payment.status,
      'Customer': payment.customerName,
      'Gym': payment.gymName
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `subscription_payments_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
      toast.success('Subscription payments exported successfully');
    } else {
      // Export detailed billing report
      const billingData = [];
      
      monthlyBilling.forEach(billing => {
        // Add billing summary
        billingData.push({
          'Billing ID': billing.billingId,
          'Month': `${billing.monthName} ${billing.billingYear}`,
          'Total Bill Amount': `₹${billing.totalBillAmount}`,
          'Total Paid': `₹${billing.totalPaidAmount}`,
          'Total Pending': `₹${billing.totalPendingAmount}`,
          'Total Overdue': `₹${billing.totalOverdueAmount}`,
          'Status': billing.billingStatus,
          'Member Count': billing.memberBills ? billing.memberBills.length : (billing.memberCount || 0),
          'Due Date': new Date(billing.dueDate).toLocaleDateString(),
          'Payment Deadline': new Date(billing.paymentDeadline).toLocaleDateString(),
          'Member Name': '',
          'Member Email': '',
          'Member Phone': '',
          'Membership Type': '',
          'Days Active': '',
          'Days in Month': '',
          'Base Fee': '',
          'Pro-rated Amount': '',
          'Payment Date': '',
          'Payment Method': '',
          'Transaction ID': ''
        });

        // Add individual member details
        if (billing.memberBills) {
          billing.memberBills.forEach((member: ApiMemberBill) => {
            billingData.push({
              'Billing ID': '',
              'Month': '',
              'Total Bill Amount': '',
              'Total Paid': '',
              'Total Pending': '',
              'Total Overdue': '',
              'Status': '',
              'Member Count': '',
              'Due Date': '',
              'Payment Deadline': '',
              'Member Name': member.memberName,
              'Member Email': member.memberEmail || '',
              'Member Phone': member.memberPhone || '',
              'Membership Type': member.membershipType || 'basic',
              'Days Active': member.daysActive || 0,
              'Days in Month': member.daysInMonth || 30,
              'Base Fee': `₹${member.originalMonthlyFee || 41.67}`,
              'Pro-rated Amount': (() => {
                const daysActive = member.daysActive || 0;
                const daysInMonth = member.daysInMonth || 30;
                const baseFee = member.originalMonthlyFee || 41.67;
                const calculatedAmount = daysActive > 0 && daysInMonth > 0 ? (baseFee * daysActive) / daysInMonth : 0;
                return `₹${calculatedAmount.toFixed(2)}`;
              })(),
              'Payment Date': member.paymentDate ? new Date(member.paymentDate).toLocaleDateString() : '',
              'Payment Method': member.paymentMethod || '',
              'Transaction ID': member.transactionId || ''
            });
          });
        }
      });

      const csv = Papa.unparse(billingData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `detailed_billing_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Detailed billing report exported successfully');
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.razorpay_order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.subscriptionType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || payment.subscriptionType.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate billing analytics
  const calculateBillingAnalytics = () => {
    if (monthlyBilling.length === 0) return null;

    const totalRevenue = monthlyBilling.reduce((sum, bill) => sum + (bill.totalBillAmount || 0), 0);
    const totalPaid = monthlyBilling.reduce((sum, bill) => sum + (bill.totalPaidAmount || 0), 0);
    // Exclude current month from pending totals
    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();
    const totalPending = monthlyBilling.reduce((sum, bill) => {
      const isCurrent = bill.billingMonth === curMonth && bill.billingYear === curYear;
      return isCurrent ? sum : sum + (bill.totalPendingAmount || 0);
    }, 0);
    const totalOverdue = monthlyBilling.reduce((sum, bill) => sum + (bill.totalOverdueAmount || 0), 0);
    
    // Calculate total members from actual member bills data
    const totalMembers = monthlyBilling.reduce((sum, bill) => {
      const memberCount = bill.memberBills ? bill.memberBills.length : (bill.memberCount || 0);
      return sum + memberCount;
    }, 0);
    
    const averageMonthlyRevenue = totalRevenue / monthlyBilling.length;
    const paymentCollectionRate = totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0;

    // Calculate membership type analytics
    const membershipAnalytics = {
      basic: { count: 0, revenue: 0 },
      premium: { count: 0, revenue: 0 },
      vip: { count: 0, revenue: 0 },
      personal_training: { count: 0, revenue: 0 }
    };

    monthlyBilling.forEach(bill => {
      if (bill.billingBreakdown) {
        (Object.keys(membershipAnalytics) as (keyof typeof membershipAnalytics)[]).forEach(type => {
          const breakdown = bill.billingBreakdown?.[type as keyof BillingBreakdown];
          if (!breakdown) return;
          
          membershipAnalytics[type].count += breakdown.count || 0;
          membershipAnalytics[type].revenue += breakdown.totalAmount || 0;
        });
      }
    });

    return {
      totalRevenue,
      totalPaid,
      totalPending,
      totalOverdue,
      totalMembers,
      averageMonthlyRevenue,
      paymentCollectionRate,
      membershipAnalytics,
      monthlyTrend: monthlyBilling.map(bill => ({
        month: bill.monthName,
        year: bill.billingYear,
        revenue: bill.totalBillAmount || 0,
        paid: bill.totalPaidAmount || 0,
        pending: bill.totalPendingAmount || 0,
        members: bill.memberBills ? bill.memberBills.length : (bill.memberCount || 0)
      }))
    };
  };

  // Filter member bills based on search and filters
  const getFilteredMemberBills = (billing: MonthlyBilling) => {
    if (!billing.memberBills) return [];

    return billing.memberBills.filter((member: ApiMemberBill) => {
      const matchesSearch = member.memberName.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                           member.memberEmail.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                           member.memberPhone.includes(memberSearchTerm);
      
      const matchesMembership = membershipFilter === 'all' || 
                               (member.membershipType || 'basic') === membershipFilter;
      
      const matchesPaymentStatus = paymentStatusFilter === 'all' || 
                                 (member.billingStatus || 'pending') === paymentStatusFilter;

      return matchesSearch && matchesMembership && matchesPaymentStatus;
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
            <p className="text-muted-foreground">
              View all your subscription payments and transaction details
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              {activeTab === 'subscriptions' ? 'Export Payments' : 'Export Detailed Report'}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscription Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payments.length}</div>
              <p className="text-xs text-muted-foreground">
                Total subscription payments
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subscription Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {payments.length > 0 
                  ? formatCurrency(payments.reduce((sum, payment) => sum + payment.amount, 0))
                  : '₹0'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                All time spent
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Bills</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthlyBilling.length}</div>
              <p className="text-xs text-muted-foreground">
                Billing records
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bill Amount</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {monthlyBilling.length > 0 
                  ? formatCurrency(monthlyBilling.reduce((sum, bill) => sum + bill.totalBillAmount, 0))
                  : '₹0'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Total billed amount
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Payment Records
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'subscriptions' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('subscriptions')}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Subscription Payments
                </Button>
                <Button
                  variant={activeTab === 'billing' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('billing')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Monthly Billing
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Filters - Only show for subscription payments */}
        {activeTab === 'subscriptions' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by order ID or subscription type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterType === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilterType('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filterType === 'monthly' ? 'default' : 'outline'}
                    onClick={() => setFilterType('monthly')}
                  >
                    Monthly
                  </Button>
                  <Button
                    variant={filterType === 'yearly' ? 'default' : 'outline'}
                    onClick={() => setFilterType('yearly')}
                  >
                    Yearly
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing Analytics */}
        {activeTab === 'billing' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Billing Analytics & Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyBilling.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-3" />
                  <p>No billing data yet for analytics. Once your first monthly bill is generated, analytics will appear here.</p>
                </div>
              ) : (() => {
                const analytics = calculateBillingAnalytics();
                if (!analytics) return null;

                return (
                  <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-sm font-medium text-blue-900 mb-1">Total Bill Amount</div>
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(analytics.totalRevenue)}</div>
                        <div className="text-xs text-blue-700">All time bills</div>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-sm font-medium text-green-900 mb-1">Bills Paid</div>
                        <div className="text-2xl font-bold text-green-600">
                          {monthlyBilling.filter(b => b.billingStatus === 'fully_paid').length}
                        </div>
                        <div className="text-xs text-green-700">Completed payments</div>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="text-sm font-medium text-yellow-900 mb-1">Bills Pending</div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {(() => {
                            const now = new Date();
                            const curMonth = now.getMonth() + 1;
                            const curYear = now.getFullYear();
                            return monthlyBilling.filter(b =>
                              !(b.billingMonth === curMonth && b.billingYear === curYear) &&
                              b.billingStatus !== 'fully_paid'
                            ).length;
                          })()}
                        </div>
                        <div className="text-xs text-yellow-700">Awaiting payment (excludes current month)</div>
                      </div>
                    </div>

                    {/* Membership Type Analytics */}
                    <div>
                      <h4 className="font-semibold text-lg mb-4">Membership Type Performance</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(analytics.membershipAnalytics).map(([type, data]) => (
                          <div key={type} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium capitalize">{type.replace('_', ' ')}</h5>
                              <Badge variant="outline">{data.count} members</Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Revenue:</span>
                                <span className="font-medium">{formatCurrency(data.revenue)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Avg per member:</span>
                                <span className="font-medium">
                                  {data.count > 0 ? formatCurrency(data.revenue / data.count) : '₹0'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Monthly Trends */}
                    <div>
                      <h4 className="font-semibold text-lg mb-4">Monthly Revenue Trends</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100 dark:bg-gray-800 border-b">
                              <th className="text-left p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Month</th>
                              <th className="text-right p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Bill Amount</th>
                              <th className="text-center p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Members</th>
                              <th className="text-center p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Payment Status</th>
                              <th className="text-center p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.monthlyTrend.map((trend, index) => {
                              const billing = monthlyBilling.find(b => b.monthName === trend.month && b.billingYear === trend.year);
                              const isPaid = billing?.billingStatus === 'fully_paid';
                              const currentDate = new Date();
                              const currentMonth = currentDate.getMonth() + 1;
                              const currentYear = currentDate.getFullYear();
                              const isCurrentMonth = billing && billing.billingMonth === currentMonth && billing.billingYear === currentYear;
                              return (
                              <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                                <td className="p-3 text-sm font-medium">{trend.month} {trend.year}</td>
                                <td className="p-3 text-sm text-right font-medium">{formatCurrency(trend.revenue)}</td>
                                <td className="p-3 text-sm text-center">{trend.members}</td>
                                <td className="p-3 text-sm text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <Badge variant="outline" className={
                                      isPaid
                                        ? 'bg-green-100 text-green-800 border-green-200'
                                        : isCurrentMonth
                                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                    }>
                                      {isPaid ? '✓ PAID' : isCurrentMonth ? 'CURRENT MONTH' : '○ UNPAID'}
                                    </Badge>
                                    {isPaid && billing.paymentHistory && billing.paymentHistory.length > 0 && (
                                      <span className="text-xs text-green-700 font-medium">
                                        Paid: {new Date(billing.paymentHistory[billing.paymentHistory.length - 1].paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-sm text-center">
                                  {!isPaid && !isCurrentMonth && billing ? (
                                    <Button size="sm" onClick={() => handlePayBill(billing.billingId)}>
                                      Pay
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">{isCurrentMonth ? 'N/A' : '-'}</span>
                                  )}
                                </td>
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Member Search & Filters for Billing */}
        {activeTab === 'billing' && monthlyBilling.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Member Search & Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by member name, email, or phone..."
                      value={memberSearchTerm}
                      onChange={(e) => setMemberSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={membershipFilter}
                    onChange={(e) => setMembershipFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Memberships</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="vip">VIP</option>
                    <option value="personal_training">Personal Training</option>
                  </select>
                  <select
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === 'subscriptions' 
                ? `Subscription Payments (${filteredPayments.length})` 
                : `Monthly Billing (${monthlyBilling.length})`
              }
            </CardTitle>
            <CardDescription>
              {activeTab === 'subscriptions'
                ? 'All your subscription payments and transaction details'
                : 'Your monthly billing history from the master CRM'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeTab === 'billing' ? (
              // Monthly Billing View
              monthlyBilling.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">No billing history yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Your monthly billing information will appear here once it's calculated by the master CRM.
                    <br /><br />
                    <span className="text-sm text-blue-600 font-medium">
                      Note: Bills are generated near the end of each month (after the 25th) to ensure accurate pro-rated calculations.
                    </span>
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {monthlyBilling.map((billing) => {
                    const currentDate = new Date();
                    const currentMonth = currentDate.getMonth() + 1;
                    const currentYear = currentDate.getFullYear();
                    const isCurrentMonth = billing.billingMonth === currentMonth && billing.billingYear === currentYear;
                    
                    return (
                    <motion.div
                      key={billing.billingId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                  billing.isFinalized 
                                    ? 'bg-gradient-to-r from-gray-500 to-gray-600' 
                                    : 'bg-gradient-to-r from-blue-500 to-purple-600'
                                }`}>
                                  {billing.isFinalized ? (
                                    <Archive className="h-6 w-6 text-white" />
                                  ) : (
                                    <Calendar className="h-6 w-6 text-white" />
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h3 className="text-lg font-semibold">
                                    {billing.monthName} {billing.billingYear}
                                  </h3>
                                  {billing.isFinalized && (
                                    <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                                      <Archive className="h-3 w-3 mr-1" />
                                      Historical
                                    </Badge>
                                  )}
                                  {/* Removed Live badge for current month */}
                                </div>
                                <div className="flex items-center space-x-4 mt-2">
                                  <Badge className={
                                    billing.billingStatus === 'fully_paid' 
                                      ? 'bg-green-100 text-green-800 border-green-200' 
                                      : billing.billingStatus === 'overdue'
                                      ? 'bg-red-100 text-red-800 border-red-200'
                                      : isCurrentMonth
                                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                                      : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                  }>
                                    {billing.billingStatus === 'fully_paid' && <CheckCircle className="h-4 w-4 mr-1" />}
                                    {billing.billingStatus === 'overdue' && <Clock className="h-4 w-4 mr-1" />}
                                    <span className="capitalize">
                                      {isCurrentMonth ? 'Current Month' : billing.billingStatus.replace('_', ' ')}
                                    </span>
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    Due: {formatDate(billing.dueDate)}
                                  </span>
                                  {billing.billingStatus === 'fully_paid' && billing.paymentHistory && billing.paymentHistory.length > 0 && (
                                    <span className="text-sm text-green-700">
                                      Paid on: {new Date(billing.paymentHistory[billing.paymentHistory.length - 1].paymentDate as string).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                  {billing.memberCount > 0 && (
                                    <span className="text-sm text-muted-foreground">
                                      {billing.memberCount} members
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {/* Pay button visible on header even if dropdown is closed */}
                              {billing.billingStatus !== 'fully_paid' && !isCurrentMonth && (
                                <Button size="sm" onClick={() => handlePayBill(billing.billingId)}>
                                  Pay
                                </Button>
                              )}
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-600">
                                  {formatCurrency(billing.totalBillAmount)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Total Bill
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleBillingDropdown(billing.billingId)}
                                className="flex items-center space-x-1"
                              >
                                <span className="text-sm">
                                  {expandedBilling === billing.billingId ? 'Hide Details' : 'Show Details'}
                                </span>
                                {expandedBilling === billing.billingId ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-6">
                          {/* Summary Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className={`border rounded-lg p-4 ${
                              billing.billingStatus === 'fully_paid' 
                                ? 'bg-green-50 border-green-200' 
                                : isCurrentMonth
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-yellow-50 border-yellow-200'
                            }`}>
                              <div className="text-sm font-medium mb-1">Payment Status</div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={
                                  billing.billingStatus === 'fully_paid'
                                    ? 'bg-green-100 text-green-800 border-green-200 text-lg px-4 py-2'
                                    : isCurrentMonth
                                    ? 'bg-blue-100 text-blue-800 border-blue-200 text-lg px-4 py-2'
                                    : 'bg-yellow-100 text-yellow-800 border-yellow-200 text-lg px-4 py-2'
                                }>
                                  {billing.billingStatus === 'fully_paid' ? '✓ PAID' : isCurrentMonth ? 'CURRENT MONTH' : '○ UNPAID'}
                                </Badge>
                              </div>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="text-sm font-medium text-blue-900 mb-1">Billing ID</div>
                              <div className="text-sm font-mono">{billing.billingId}</div>
                            </div>
                          </div>
                          
                          {/* Member Summary - Always Visible */}
                          {billing.memberBills && billing.memberBills.length > 0 && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-gray-900">Member Summary</h4>
                                <Badge variant="outline" className="bg-blue-100 text-blue-700">
                                  {billing.memberBills.length} members
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Total Members:</span>
                                  <span className="font-medium ml-2">{billing.memberBills.length}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Avg. per Member:</span>
                                  <span className="font-medium ml-2">
                                    {formatCurrency(billing.totalBillAmount / billing.memberBills.length)}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-3 text-xs text-gray-500">
                                💡 Click "Show Details" to see individual member breakdown and billing details
                              </div>
                            </div>
                          )}
                          
                          {/* Debug Info - Show when no member bills */}
                          {(!billing.memberBills || billing.memberBills.length === 0) && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                <span className="text-sm font-medium text-yellow-800">No Member Data Available</span>
                              </div>
                              <div className="mt-2 text-xs text-yellow-700">
                                This billing record doesn't contain member breakdown data. This might be a historical record or the data hasn't been populated yet.
                              </div>
                            </div>
                          )}
                          
                          {/* Detailed Content - Only show when expanded */}
                          {expandedBilling === billing.billingId && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-6"
                            >
                          
                          {/* Membership Type Breakdown */}
                          {(() => {
                            console.log('Rendering billing breakdown for:', billing.billingId, billing.billingBreakdown);
                            return billing.billingBreakdown && (
                            <div className="space-y-4">
                              <h4 className="font-semibold text-lg">Membership Type Breakdown</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {Object.entries(billing.billingBreakdown).map(([type, breakdown]) => (
                                  <div key={type} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <h5 className="font-medium capitalize">{type.replace('_', ' ')}</h5>
                                      <Badge variant="outline">{breakdown.count} members</Badge>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total:</span>
                                        <span className="font-medium">{formatCurrency(breakdown.totalAmount)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-green-600">Paid:</span>
                                        <span className="text-green-600 font-medium">{formatCurrency(breakdown.paidAmount)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-yellow-600">Pending:</span>
                                        <span className="text-yellow-600 font-medium">{formatCurrency(breakdown.pendingAmount)}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                          })()}
                          
                          {/* Member Bills Detail */}
                          {(() => {
                            console.log('Rendering member bills for:', billing.billingId, billing.memberBills);
                            const filteredMembers = getFilteredMemberBills(billing);
                            console.log('Filtered members:', filteredMembers);
                            return filteredMembers.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-lg">Individual Member Billing Details</h4>
                                  <div className="text-sm text-muted-foreground">
                                    Showing {filteredMembers.length} of {billing.memberBills?.length || 0} members
                                  </div>
                                </div>
                              
                              {/* Table View for Detailed Breakdown */}
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-800 border-b">
                                        <th className="text-left p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Member</th>
                                      <th className="text-left p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Contact</th>
                                        <th className="text-center p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Membership</th>
                                      <th className="text-center p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Days Active</th>
                                      <th className="text-center p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Base Fee</th>
                                      <th className="text-right p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Pro-rated Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                      {filteredMembers.map((member: ApiMemberBill, index) => (
                                      <tr 
                                        key={member.memberId}
                                        className="border-b hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                                      >
                                        <td className="p-3">
                                          <div className="font-medium">{member.memberName}</div>
                                            <div className="text-xs text-muted-foreground">ID: {member.memberId.slice(-8)}</div>
                                        </td>
                                        <td className="p-3 text-sm text-muted-foreground">
                                            {member.memberEmail && (
                                              <div className="flex items-center space-x-1">
                                                <span>{member.memberEmail}</span>
                                              </div>
                                            )}
                                            {member.memberPhone && (
                                              <div className="flex items-center space-x-1">
                                                <span>{member.memberPhone}</span>
                                              </div>
                                            )}
                                        </td>
                                        <td className="p-3 text-center text-sm">
                                            <Badge variant="outline" className="capitalize">
                                              {(member.membershipType || 'basic').replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-center text-sm">
                                            <div className="font-medium">{member.daysActive || 0}</div>
                                            <div className="text-xs text-muted-foreground">of {member.daysInMonth || 30} days</div>
                                        </td>
                                        <td className="p-3 text-center text-sm font-medium">
                                            {formatCurrency(member.originalMonthlyFee || 41.67)}
                                          </td>
                                        <td className="p-3 text-right">
                                          <div className="font-bold text-green-600">
                                              {(() => {
                                                const daysActive = member.daysActive || 0;
                                                const daysInMonth = member.daysInMonth || 30;
                                                const baseFee = member.originalMonthlyFee || 41.67;
                                                const calculatedAmount = daysActive > 0 && daysInMonth > 0 ? (baseFee * daysActive) / daysInMonth : 0;
                                                return formatCurrency(calculatedAmount);
                                              })()}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                              Pro-rated
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No members found matching your search criteria</p>
                                <Button 
                                  variant="outline"
                                  onClick={() => {
                                    setMemberSearchTerm('');
                                    setMembershipFilter('all');
                                    setPaymentStatusFilter('all');
                                  }}
                                  className="mt-4"
                                >
                                  Clear Filters
                                </Button>
                              </div>
                            );
                          })()}
                          
                          {/* Payment History */}
                          {billing.paymentHistory && billing.paymentHistory.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="font-semibold text-lg">Payment History</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-800 border-b">
                                      <th className="text-left p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Payment Date</th>
                                      <th className="text-left p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                                      <th className="text-center p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Method</th>
                                      <th className="text-center p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Transaction ID</th>
                                      <th className="text-left p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Description</th>
                                      <th className="text-left p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Processed By</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {billing.paymentHistory.map((payment, index) => (
                                      <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                                        <td className="p-3 text-sm">
                                          {new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </td>
                                        <td className="p-3 text-sm font-medium text-green-600">
                                          {formatCurrency(payment.amount)}
                                        </td>
                                        <td className="p-3 text-center text-sm">
                                          <Badge variant="outline" className="capitalize">
                                            {payment.paymentMethod.replace('_', ' ')}
                                          </Badge>
                                        </td>
                                        <td className="p-3 text-center font-mono text-xs">
                                          {payment.transactionId || 'N/A'}
                                        </td>
                                        <td className="p-3 text-sm text-muted-foreground">
                                          {payment.description || 'No description'}
                                        </td>
                                        <td className="p-3 text-sm text-muted-foreground">
                                          {payment.processedBy}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                              
                              {/* Total Summary */}
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-sm font-medium text-green-900">
                                  Total Monthly Bill Summary
                                    </div>
                                    <div className="text-xs text-green-700">
                                  {billing.memberBills?.length || 0} active members • {billing.billingId}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-green-700">
                                  {formatCurrency(billing.totalBillAmount)}
                                    </div>
                                    <div className="text-xs text-green-600">
                                  Total bill amount
                                    </div>
                                  </div>
                                </div>
                            
                              {/* Payment Status Summary + Actions */}
                                <div className="mt-4 pt-4 border-t border-green-200">
                                  <div className="flex items-center justify-between">
                                  <div className="text-sm text-gray-600">Payment Status</div>
                                  <div>
                                    <Badge variant="outline" className={
                                      billing.billingStatus === 'fully_paid'
                                        ? 'bg-green-100 text-green-800 border-green-200 text-base px-6 py-2'
                                        : isCurrentMonth
                                        ? 'bg-blue-100 text-blue-800 border-blue-200 text-base px-6 py-2'
                                        : 'bg-yellow-100 text-yellow-800 border-yellow-200 text-base px-6 py-2'
                                    }>
                                      {billing.billingStatus === 'fully_paid' ? '✓ PAID IN FULL' : isCurrentMonth ? 'CURRENT MONTH' : '○ PAYMENT PENDING'}
                                    </Badge>
                                  </div>
                                  {!isCurrentMonth && billing.billingStatus !== 'fully_paid' && (
                                    <Button size="sm" onClick={() => handlePayBill(billing.billingId)}>
                                      Pay Bill
                                    </Button>
                                  )}
                                </div>
                                  {(() => {
                                    if (billing.billingStatus !== 'fully_paid') return null;
                                    const paidOn = (billing.paymentHistory && billing.paymentHistory.length > 0)
                                      ? new Date(billing.paymentHistory[billing.paymentHistory.length - 1].paymentDate)
                                      : (billing as unknown as { finalizedAt?: string }).finalizedAt
                                      ? new Date((billing as unknown as { finalizedAt?: string }).finalizedAt as string)
                                      : null;
                                    return paidOn ? (
                                      <div className="text-xs text-green-700 mt-2 text-center">
                                        Paid on: {paidOn.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    ) : null;
                                  })()}
                                <div className="text-xs text-gray-500 mt-2 text-center">
                                  {billing.billingStatus === 'fully_paid' 
                                    ? 'This bill has been fully paid' 
                                    : isCurrentMonth
                                    ? 'This month is still ongoing - payment status will be updated at month end'
                                    : 'Full payment required - no partial payments'}
                                </div>
                              </div>
                              </div>
                              
                              {/* Billing Formula Explanation */}
                              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mt-6">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">How Billing is Calculated</h3>
                                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                  <div className="flex items-start space-x-2">
                                    <span className="font-medium">1.</span>
                                    <span>Each customer is charged ₹41.67 per month (₹500 per year ÷ 12 months)</span>
                                  </div>
                                  <div className="flex items-start space-x-2">
                                    <span className="font-medium">2.</span>
                                    <span>Amount is pro-rated based on how many days the customer was active in the month</span>
                                  </div>
                                  <div className="flex items-start space-x-2">
                                    <span className="font-medium">3.</span>
                                    <span>Formula: (₹41.67 × days active in month) ÷ total days in month</span>
                                  </div>
                                  <div className="flex items-start space-x-2">
                                    <span className="font-medium">4.</span>
                                    <span>Total bill = Sum of all individual customer pro-rated amounts</span>
                                  </div>
                              <div className="flex items-start space-x-2">
                                <span className="font-medium">5.</span>
                                <span>Bills are generated near the end of each month (after 25th) for accurate calculations</span>
                                </div>
                              <div className="flex items-start space-x-2">
                                <span className="font-medium">6.</span>
                                <span>Due date is set to the last day of the billing month</span>
                              </div>
                            </div>
                            </div>
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                    );
                  })}
                </div>
              )
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CreditCard className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">
                  {searchTerm || filterType !== 'all' 
                    ? 'No payments found' 
                    : 'No subscription payments yet'
                  }
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your search or filter criteria to find specific payments.'
                    : 'You haven\'t made any subscription payments yet. Once you subscribe to a plan, your payment history will appear here.'
                  }
                </p>
                {!searchTerm && filterType === 'all' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 max-w-md mx-auto">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Ready to get started?</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                        Choose a subscription plan that fits your needs and start managing your gym with our CRM system.
                      </p>
                      <Button 
                        onClick={() => window.location.href = '/subscriptions'}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        View Subscription Plans
                      </Button>
                    </div>
                  </div>
                )}
                {(searchTerm || filterType !== 'all') && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterType('all');
                    }}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <motion.div
                    key={payment._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <Receipt className="h-6 w-6 text-white" />
                              </div>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">Order #{payment.razorpay_order_id}</h3>
                              <p className="text-sm text-muted-foreground">
                                {payment.subscriptionType} • {payment.subscriptionDuration}
                              </p>
                              <div className="flex items-center space-x-4 mt-2">
                                <Badge className={getStatusColor(payment.status)}>
                                  {getStatusIcon(payment.status)}
                                  <span className="ml-1">{payment.status}</span>
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(payment.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              {formatCurrency(payment.amount)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {payment.currency}
                            </div>
                          </div>
                        </div>
                        
                        {/* Subscription Details */}
                        <div className="mt-4 pt-4 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">Subscription Period</h4>
                              <p className="text-sm">
                                {formatDate(payment.subscriptionStartDate)} - {formatDate(payment.subscriptionEndDate)}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">Customer</h4>
                              <p className="text-sm">{payment.customerName}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">Gym</h4>
                              <p className="text-sm">{payment.gymName}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PaymentHistoryPage;
