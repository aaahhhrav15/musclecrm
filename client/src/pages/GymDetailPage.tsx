import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { loadRazorpayScript, RazorpayResponse, RazorpayOptions, RazorpayInstance } from '@/lib/razorpay';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft,
  Building2,
  Users,
  UserCheck,
  FileText,
  Calendar,
  CreditCard,
  TrendingUp,
  Activity,
  Target,
  Utensils,
  Dumbbell,
  UserPlus,
  DollarSign,
  BarChart3,
  PieChart,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Eye,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar as CalendarIcon,
  Timer,
  Calculator,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  ChevronDown,
  ChevronUp,
  Archive
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axiosInstance from '@/lib/axios';

interface MemberBillingDetail {
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  membershipType?: string;
  membershipStartDate: string | null;
  membershipEndDate: string | null;
  daysActive: number;
  daysInMonth: number;
  fixedMonthlyFee: number;
  proRatedAmount: number;
  isActive: boolean;
  originalMonthlyFee?: number;
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

interface MonthlyBillingDetail {
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
  memberBills?: MemberBillingDetail[];
  billingBreakdown?: BillingBreakdown;
  paymentHistory?: PaymentHistoryEntry[];
  isFinalized?: boolean;
  finalizedAt?: string;
}

interface CrmSubscriptionPayment {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  subscriptionType: string;
  subscriptionDuration: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  createdAt: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  notes: string;
}

interface GymDetailData {
  gym: {
    _id: string;
    name: string;
    gymCode: string;
    logo?: string;
    banner?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    contactInfo?: {
      phone?: string;
      email?: string;
      website?: string;
    };
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
    subscriptionStatus: 'registered' | 'active' | 'expired';
    createdAt: string;
    updatedAt: string;
  };
  statistics: {
    members: {
      total: number;
      active: number;
      inactive: number;
      newThisMonth: number;
    };
    staff: {
      total: number;
      active: number;
    };
    nutritionPlans: {
      total: number;
      thisMonth: number;
    };
    workoutPlans: {
      total: number;
      thisMonth: number;
    };
    assignedWorkoutPlans: {
      total: number;
    };
    trainers: {
      total: number;
      active: number;
    };
    attendance: {
      total: number;
      today: number;
      thisMonth: number;
    };
    revenue: {
      total: number;
      thisMonth: number;
      today: number;
    };
    billing: {
      currentMonth: {
        totalBill: number;
        totalPaid: number;
        totalPending: number;
        billingStatus: string;
      };
      totalPaidTillNow: number;
      totalBilledAmount: number;
      totalPendingBills: number;
      totalPendingAmount: number;
      totalFullyPaidBills: number;
      billingHistory: Array<{
        billingMonth: number;
        billingYear: number;
        totalBillAmount: number;
        totalPaidAmount: number;
        totalPendingAmount: number;
        totalOverdueAmount: number;
        billingStatus: string;
      }>;
      memberBillingDetails: Array<{
        memberId: string;
        memberName: string;
        memberEmail: string;
        memberPhone: string;
        membershipStartDate: string;
        membershipEndDate: string;
        daysActive: number;
        daysInMonth: number;
        fixedMonthlyFee: number;
        proRatedAmount: number;
        isActive: boolean;
      }>;
    };
    leads: {
      total: number;
      converted: number;
      thisMonth: number;
    };
  };
}

const GymDetailPage: React.FC = () => {
  const { gymId } = useParams<{ gymId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [gymData, setGymData] = useState<GymDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_gym_detail_active_tab');
      return saved || 'overview';
    } catch {
      return 'overview';
    }
  });
  const [detailedBilling, setDetailedBilling] = useState<MonthlyBillingDetail[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingFetched, setBillingFetched] = useState(false); // Track if we've attempted to fetch billing
  
  // Filter states for member billing
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedBillingSection, setExpandedBillingSection] = useState<string | null>(null);
  const [crmPayments, setCrmPayments] = useState<CrmSubscriptionPayment[]>([]);
  const [crmPaymentsLoading, setCrmPaymentsLoading] = useState(false);
  const [financialView, setFinancialView] = useState<'crm' | 'billing'>('crm');

  const handlePayBill = async (billingId: string) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast({ title: 'Error', description: 'Failed to load Razorpay', variant: 'destructive' });
      return;
    }
    try {
      const orderRes = await axiosInstance.post(`/gym/billing/admin/${billingId}/razorpay/create-order`);
      if (!orderRes.data.success) {
        toast({ title: 'Error', description: orderRes.data.message || 'Failed to create payment order', variant: 'destructive' });
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
        prefill: {},
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await axiosInstance.post(`/gym/billing/admin/${billingId}/razorpay/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            if (verifyRes.data.success) {
              toast({ title: 'Success', description: 'Payment successful', variant: 'default' });
              // Refresh data
              fetchDetailedBilling();
            } else {
              toast({ title: 'Error', description: verifyRes.data.message || 'Verification failed', variant: 'destructive' });
            }
          } catch (err) {
            toast({ title: 'Error', description: 'Payment verification error', variant: 'destructive' });
          }
        },
        theme: { color: '#0ea5e9' }
      };
      type RazorpayCtor = new (options: RazorpayOptions) => RazorpayInstance;
      const RazorpayClass = (window as unknown as { Razorpay: RazorpayCtor }).Razorpay;
      const rzp = new RazorpayClass(options);
      rzp.open();
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to initialize payment', variant: 'destructive' });
    }
  };

  const fetchGymData = useCallback(async () => {
    if (!gymId) return;
    
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/admin/dashboard/gym/${gymId}`);
      if (response.data.success) {
        setGymData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching gym data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch gym details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [gymId, toast]);

  // Helper function to convert API member bill to MemberBillingDetail
  const convertApiBillToDetail = (bill: Record<string, unknown>): MemberBillingDetail => {
    const daysActive = (bill.daysActive as number) || 0;
    const daysInMonth = (bill.daysInMonth as number) || 30;
    const baseFee = (bill.originalMonthlyFee as number) || 41.67;
    const proRatedAmount = daysActive > 0 && daysInMonth > 0 ? (baseFee * daysActive) / daysInMonth : 0;
    
    return {
      memberId: bill.memberId as string,
      memberName: (bill.memberName as string) || 'Unknown',
      memberEmail: (bill.memberEmail as string) || '',
      memberPhone: (bill.memberPhone as string) || '',
      membershipType: (bill.membershipType as string) || 'basic',
      membershipStartDate: null,
      membershipEndDate: null,
      daysActive: daysActive,
      daysInMonth: daysInMonth,
      fixedMonthlyFee: baseFee,
      proRatedAmount: proRatedAmount,
      isActive: true,
      originalMonthlyFee: baseFee
    };
  };

  const fetchDetailedBilling = useCallback(async () => {
    if (!gymId || !gymData) return;
    
    try {
      setBillingLoading(true);
      
      const allBillingData: MonthlyBillingDetail[] = [];
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      // 1. Add Current Month (LIVE data from gymData - NOT from database)
      // Current month is calculated on-the-fly by the admin dashboard and is always up-to-date
      const billingInfo = gymData.statistics?.billing;

      if (billingInfo?.memberBillingDetails && billingInfo.memberBillingDetails.length > 0) {
        // Convert current month member details to proper format (use backend-calculated values)
        const currentMonthMembers: MemberBillingDetail[] = billingInfo.memberBillingDetails.map((member) => {
          return {
            memberId: member.memberId,
            memberName: member.memberName,
            memberEmail: member.memberEmail || '',
            memberPhone: member.memberPhone || '',
            membershipType: 'basic',
            membershipStartDate: member.membershipStartDate || null,
            membershipEndDate: member.membershipEndDate || null,
            daysActive: member.daysActive || 0,
            daysInMonth: member.daysInMonth || 30,
            fixedMonthlyFee: member.fixedMonthlyFee || 41.67,
            proRatedAmount: member.proRatedAmount || 0, // Use backend-calculated value
            isActive: member.isActive,
            originalMonthlyFee: member.fixedMonthlyFee || 41.67
          };
        });
        
        // Calculate total bill by summing all pro-rated amounts (already calculated by backend)
        const calculatedTotalBill = currentMonthMembers.reduce((sum, member) => sum + member.proRatedAmount, 0);
        
        // Add current month billing (live data, not from database)
        const currentMonthTotals = billingInfo.currentMonth;
        const currentMonthPaid = currentMonthTotals?.totalPaid ?? 0;
        const currentMonthStatus = currentMonthTotals?.billingStatus ?? 'pending';

        const currentMonthBilling = {
          billingId: `current-${currentYear}-${currentMonth}`,
          billingMonth: currentMonth,
          billingYear: currentYear,
          monthName: currentDate.toLocaleDateString('en-US', { month: 'long' }),
          totalBillAmount: calculatedTotalBill, // Use calculated sum instead of backend value
          totalPaidAmount: currentMonthPaid,
          totalPendingAmount: Math.max(calculatedTotalBill - currentMonthPaid, 0), // Calculate pending
          totalOverdueAmount: 0,
          billingStatus: currentMonthStatus,
          memberCount: currentMonthMembers.length,
          dueDate: new Date(currentYear, currentMonth, 0).toISOString(),
          paymentDeadline: new Date(currentYear, currentMonth, 0).toISOString(),
          memberBills: currentMonthMembers,
          billingBreakdown: undefined,
          paymentHistory: [],
          isFinalized: false
        };
        
        console.log('✅ Added CURRENT MONTH (LIVE from gymData):', {
          month: `${currentMonthBilling.monthName} ${currentYear}`,
          memberCount: currentMonthMembers.length,
          totalBill: calculatedTotalBill,
          individualAmountsSum: currentMonthMembers.map(m => m.proRatedAmount),
          source: 'gymData (live calculation)'
        });
        
        allBillingData.push(currentMonthBilling);
      }
      
      // 2. Fetch ONLY historical/finalized months from database with full details in ONE call (optimized - no N+1)
      // This fetches all billing records with full details, but we filter to EXCLUDE current month below
      const allBillingResponse = await axiosInstance.get(`/admin/billing/gym/${gymId}/all?includeDetails=true`);
      
      if (allBillingResponse.data.success) {
        const billingRecords = allBillingResponse.data.data as Array<Record<string, unknown>>;
        
        // Process billing records (excluding current month)
        billingRecords.forEach((billingDetail) => {
          const billingMonth = billingDetail.billingMonth as number;
          const billingYear = billingDetail.billingYear as number;
          
          // Skip current month as we already added it from live data (NOT from database)
          if (billingMonth === currentMonth && billingYear === currentYear) {
            console.log(`⏭️ SKIPPING current month from database (${billingMonth}/${billingYear}) - using live data instead`);
            return;
          }
          
          // Convert member bills to proper format (already processed by backend, but ensure consistency)
          const memberBills = ((billingDetail.memberBills as Array<Record<string, unknown>>) || []).map((bill: Record<string, unknown>) => {
            const memberId = bill.memberId as string;
            const memberName = (bill.memberName as string) || 'Unknown Member';
            const memberEmail = (bill.memberEmail as string) || '';
            const memberPhone = (bill.memberPhone as string) || '';
            
            // Use pro-rated amount from backend (already calculated)
            const proRatedAmount = (bill.proRatedAmount as number) || 0;
            
            return {
              memberId,
              memberName,
              memberEmail,
              memberPhone,
              membershipType: (bill.membershipType as string) || 'basic',
              membershipStartDate: (bill.membershipStartDate as string) || null,
              membershipEndDate: (bill.membershipEndDate as string) || null,
              daysActive: (bill.daysActive as number) || 0,
              daysInMonth: (bill.daysInMonth as number) || 30,
              fixedMonthlyFee: (bill.fixedMonthlyFee as number) || 41.67,
              proRatedAmount: proRatedAmount,
              isActive: bill.isActive !== undefined ? (bill.isActive as boolean) : true,
              originalMonthlyFee: (bill.originalMonthlyFee as number) || 41.67
            };
          });
          
          const historicalBilling: MonthlyBillingDetail = {
            billingId: billingDetail.billingId as string,
            billingMonth: billingMonth,
            billingYear: billingYear,
            monthName: billingDetail.monthName as string || new Date(billingYear, billingMonth - 1).toLocaleDateString('en-US', { month: 'long' }),
            totalBillAmount: (billingDetail.totalBillAmount as number) || 0,
            totalPaidAmount: (billingDetail.totalPaidAmount as number) || 0,
            totalPendingAmount: (billingDetail.totalPendingAmount as number) || 0,
            totalOverdueAmount: (billingDetail.totalOverdueAmount as number) || 0,
            billingStatus: (billingDetail.billingStatus as string) || 'pending',
            memberCount: memberBills.length,
            dueDate: (billingDetail.dueDate as string) || new Date(billingYear, billingMonth, 0).toISOString(),
            paymentDeadline: (billingDetail.paymentDeadline as string) || new Date(billingYear, billingMonth, 0).toISOString(),
            memberBills: memberBills,
            billingBreakdown: billingDetail.billingBreakdown as BillingBreakdown | undefined,
            paymentHistory: (billingDetail.paymentHistory as PaymentHistoryEntry[]) || [],
            isFinalized: (billingDetail.isFinalized as boolean) || false,
            finalizedAt: billingDetail.finalizedAt as string | undefined
          };
          
          console.log(`📦 Added HISTORICAL MONTH from database:`, {
            month: `${historicalBilling.monthName} ${historicalBilling.billingYear}`,
            memberCount: memberBills.length,
            totalBill: historicalBilling.totalBillAmount,
            source: 'GymBilling database (finalized) - optimized single query'
          });
          
          allBillingData.push(historicalBilling);
        });
      }
      
      // Sort by year and month descending (most recent first - current month at top)
      allBillingData.sort((a, b) => {
        if (a.billingYear !== b.billingYear) {
          return b.billingYear - a.billingYear;
        }
        return b.billingMonth - a.billingMonth;
      });
      
      setDetailedBilling(allBillingData);
    } catch (error) {
      console.error('Error fetching detailed billing:', error);
      toast({
        title: "Error",
        description: "Failed to fetch detailed billing information",
        variant: "destructive",
      });
    } finally {
      setBillingLoading(false);
      setBillingFetched(true); // Mark as fetched even on error to prevent infinite loop
    }
  }, [gymId, gymData, toast]);

  const fetchGymCrmSubscriptions = useCallback(async () => {
    if (!gymId) return;
    try {
      setCrmPaymentsLoading(true);
      const response = await axiosInstance.get(`/admin/crm-subscription-payments/gym/${gymId}`, {
        params: { limit: 50 }
      });
      if (response.data.success) {
        setCrmPayments(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching CRM subscription payments for gym:', error);
    } finally {
      setCrmPaymentsLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    fetchGymData();
    // Reset billing fetched flag when gym changes
    setBillingFetched(false);
    setDetailedBilling([]);
  }, [gymId, fetchGymData]);

  // Persist tab selection
  useEffect(() => {
    try {
      localStorage.setItem('admin_gym_detail_active_tab', activeTab);
    } catch (error) {
      console.warn('Failed to persist admin gym detail active tab', error);
    }
  }, [activeTab]);

  // Fetch detailed billing when financial tab is active and gymData is loaded
  useEffect(() => {
    if (activeTab === 'financial' && gymData && !billingFetched && !billingLoading) {
      fetchDetailedBilling();
    }
  }, [activeTab, gymData, billingFetched, billingLoading, fetchDetailedBilling]);

  useEffect(() => {
    fetchGymCrmSubscriptions();
  }, [fetchGymCrmSubscriptions]);

  const handleBackNavigation = () => {
    const returnTab = location.state?.returnTab || 'overview';
    const returnUrl = location.state?.returnUrl || '/admin/dashboard';
    
    // Navigate back with tab state
    navigate(returnUrl, { 
      state: { 
        activeTab: returnTab 
      } 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Filter and sort member billing details for a specific billing record
  const getFilteredMemberBilling = (memberBills: MemberBillingDetail[] | undefined) => {
    if (!memberBills || memberBills.length === 0) return [];
    
    const filtered = memberBills.filter(member => 
      member.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.memberEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.memberPhone.includes(searchTerm)
    );

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.memberName.toLowerCase();
          bValue = b.memberName.toLowerCase();
          break;
        case 'amount':
          aValue = a.proRatedAmount;
          bValue = b.proRatedAmount;
          break;
        case 'daysActive':
          aValue = a.daysActive;
          bValue = b.daysActive;
          break;
        case 'startDate':
          aValue = a.membershipStartDate ? new Date(a.membershipStartDate).getTime() : 0;
          bValue = b.membershipStartDate ? new Date(b.membershipStartDate).getTime() : 0;
          break;
        default:
          aValue = a.memberName.toLowerCase();
          bValue = b.memberName.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  };

  const getSubscriptionStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'expired':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading gym details...</p>
        </div>
      </div>
    );
  }

  if (!gymData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-muted-foreground">Gym not found</p>
          <Button onClick={handleBackNavigation} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const { gym, statistics } = gymData;
  const billingStats = statistics?.billing;
  const currentMonthStats = billingStats?.currentMonth;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackNavigation}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div className="flex items-center space-x-3">
                {gym.logo && (
                  <img
                    src={gym.logo}
                    alt={gym.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold">{gym.name}</h1>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{gym.gymCode}</Badge>
                    <Badge className={getSubscriptionStatusColor(gym.subscriptionStatus)}>
                      <div className="flex items-center space-x-1">
                        {getSubscriptionStatusIcon(gym.subscriptionStatus)}
                        <span className="capitalize">{gym.subscriptionStatus}</span>
                      </div>
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchGymData}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {/* Gym Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Gym Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">Contact Information</h3>
                  <div className="space-y-1">
                    {gym.contactInfo?.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{gym.contactInfo.phone}</span>
                      </div>
                    )}
                    {gym.contactInfo?.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{gym.contactInfo.email}</span>
                      </div>
                    )}
                    {gym.contactInfo?.website && (
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={gym.contactInfo.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {gym.contactInfo.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">Address</h3>
                  {gym.address && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        {gym.address.street && <div>{gym.address.street}</div>}
                        {(gym.address.city || gym.address.state || gym.address.zipCode) && (
                          <div>
                            {gym.address.city}
                            {gym.address.city && gym.address.state && ', '}
                            {gym.address.state} {gym.address.zipCode}
                          </div>
                        )}
                        {gym.address.country && <div>{gym.address.country}</div>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">Subscription Details</h3>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Created: {formatDate(gym.createdAt)}
                      </span>
                    </div>
                    {gym.subscriptionStartDate && (
                      <div className="flex items-center space-x-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Started: {formatDate(gym.subscriptionStartDate)}
                        </span>
                      </div>
                    )}
                    {gym.subscriptionEndDate && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Ends: {formatDate(gym.subscriptionEndDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="members">Members & Staff</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-2xl font-bold">{statistics.members.total}</div>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Activity className="h-3 w-3 mr-1" />
                        {statistics.members.active} active
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid Till Now</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-2xl font-bold">{formatCurrency(billingStats?.totalPaidTillNow ?? 0)}</div>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Activity className="h-3 w-3 mr-1" />
                        Sum of all paid bills
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

              </div>

              {/* Billing Statistics Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
                  <h2 className="text-2xl font-bold">Billing Statistics</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Pending Bills</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-2xl font-bold">{billingStats?.totalPendingBills ?? 0}</div>
                      <p className="text-xs text-muted-foreground">Unpaid bills</p>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/5" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Pending Amount</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-2xl font-bold">{formatCurrency(billingStats?.totalPendingAmount ?? 0)}</div>
                      <p className="text-xs text-muted-foreground">Unpaid amount (Bill - Paid)</p>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Fully Paid Bills</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-2xl font-bold">{billingStats?.totalFullyPaidBills ?? 0}</div>
                      <p className="text-xs text-muted-foreground">Completed payments</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Billed Amount</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-2xl font-bold">{formatCurrency(billingStats?.totalBilledAmount ?? 0)}</div>
                      <p className="text-xs text-muted-foreground">All time billing</p>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid Amount</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-2xl font-bold">{formatCurrency(billingStats?.totalPaidTillNow ?? 0)}</div>
                      <p className="text-xs text-muted-foreground">Sum of all paid bills</p>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Payment Rate</CardTitle>
                      <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-indigo-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-2xl font-bold">
                        {billingStats?.totalBilledAmount && billingStats.totalBilledAmount > 0
                          ? `${Math.round((billingStats.totalPaidTillNow / billingStats.totalBilledAmount) * 100)}%`
                          : '0%'}
                      </div>
                      <p className="text-xs text-muted-foreground">Collection efficiency</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <UserCheck className="h-5 w-5" />
                      <span>Membership Status</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Active Members</span>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {statistics.members.active}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Inactive Members</span>
                        <Badge variant="secondary">
                          {statistics.members.inactive}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">New This Month</span>
                        <Badge variant="outline">
                          {statistics.members.newThisMonth}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5" />
                      <span>Attendance</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Check-ins</span>
                        <Badge variant="outline">
                          {statistics.attendance.total}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Today</span>
                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                          {statistics.attendance.today}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">This Month</span>
                        <Badge variant="outline">
                          {statistics.attendance.thisMonth}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>Leads</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Leads</span>
                        <Badge variant="outline">
                          {statistics.leads.total}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Converted</span>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {statistics.leads.converted}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">This Month</span>
                        <Badge variant="outline">
                          {statistics.leads.thisMonth}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Members & Staff Tab */}
            <TabsContent value="members" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Members Overview</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{statistics.members.total}</div>
                          <div className="text-sm text-blue-600">Total Members</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{statistics.members.active}</div>
                          <div className="text-sm text-green-600">Active Members</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-600">{statistics.members.inactive}</div>
                          <div className="text-sm text-gray-600">Inactive Members</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{statistics.members.newThisMonth}</div>
                          <div className="text-sm text-purple-600">New This Month</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <UserCheck className="h-5 w-5" />
                      <span>Staff Overview</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{statistics.staff.total}</div>
                          <div className="text-sm text-blue-600">Total Staff</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{statistics.staff.active}</div>
                          <div className="text-sm text-green-600">Active Staff</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Dumbbell className="h-5 w-5" />
                    <span>Trainers</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{statistics.trainers.total}</div>
                      <div className="text-sm text-blue-600">Total Trainers</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{statistics.trainers.active}</div>
                      <div className="text-sm text-green-600">Active Trainers</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Utensils className="h-5 w-5" />
                      <span>Nutrition Plans</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{statistics.nutritionPlans.total}</div>
                          <div className="text-sm text-blue-600">Total Plans</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{statistics.nutritionPlans.thisMonth}</div>
                          <div className="text-sm text-green-600">This Month</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Dumbbell className="h-5 w-5" />
                      <span>Workout Plans</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{statistics.workoutPlans.total}</div>
                          <div className="text-sm text-blue-600">Total Plans</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{statistics.workoutPlans.thisMonth}</div>
                          <div className="text-sm text-green-600">This Month</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <UserCheck className="h-5 w-5" />
                      <span>Assigned Workout Plans</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{statistics.assignedWorkoutPlans.total}</div>
                        <div className="text-sm text-purple-600">Total Assigned</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="space-y-6">
              {/* Summary Cards - Simplified to show only Total Bill and Payment Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Monthly Bills</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(
                      detailedBilling.reduce((sum, billing) => sum + billing.totalBillAmount, 0)
                    )}</div>
                    <p className="text-xs text-muted-foreground">
                      All billing records
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Billing Records</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{detailedBilling.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Monthly billing records
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {detailedBilling.filter(b => b.billingStatus === 'fully_paid').length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Paid / {detailedBilling.length} total
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Details Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Financial Details</h2>
                  <p className="text-sm text-muted-foreground">
                    Switch between CRM subscription payments and monthly billing history
                  </p>
                </div>
                <div className="inline-flex items-center rounded-full border bg-muted p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setFinancialView('crm')}
                    className={`px-3 py-1 rounded-full transition ${
                      financialView === 'crm'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground'
                    }`}
                  >
                    CRM Payments
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinancialView('billing')}
                    className={`px-3 py-1 rounded-full transition ${
                      financialView === 'billing'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground'
                    }`}
                  >
                    Monthly Billing
                  </button>
                </div>
              </div>

              {financialView === 'crm' ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <CreditCard className="h-5 w-5" />
                          <span>CRM Subscription Payments</span>
                        </CardTitle>
                        <CardDescription>Plan purchases and renewals for this gym</CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {crmPayments.length} records
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {crmPaymentsLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading CRM subscription payments...</p>
                      </div>
                    ) : crmPayments.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                          <CreditCard className="h-7 w-7" />
                        </div>
                        <h3 className="text-lg font-semibold">No CRM subscription payments found</h3>
                        <p className="text-sm text-muted-foreground">Payments will appear here once the gym purchases a CRM plan.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {crmPayments.slice(0, 6).map(payment => (
                          <div
                            key={payment._id}
                            className="border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                          >
                            <div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {payment.subscriptionType}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={
                                    payment.status === 'paid'
                                      ? 'bg-green-50 text-green-700 border-green-200'
                                      : payment.status === 'failed'
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                  }
                                >
                                  {payment.status.toUpperCase()}
                                </Badge>
                              </div>
                              <div className="text-lg font-semibold mt-2">{payment.subscriptionDuration}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(payment.subscriptionStartDate)} - {formatDate(payment.subscriptionEndDate)}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Order: {payment.razorpay_order_id} • Payment: {payment.razorpay_payment_id}
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="text-2xl font-bold text-green-600">{formatCurrency(payment.amount)}</div>
                              <div className="text-sm text-muted-foreground">
                                Paid on {formatDate(payment.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))}
                        {crmPayments.length > 6 && (
                          <p className="text-xs text-muted-foreground text-right">
                            Showing latest 6 of {crmPayments.length} payments
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Monthly Billing Records ({billingLoading ? '...' : detailedBilling.length})
                    </CardTitle>
                    <CardDescription>
                      Complete billing history with detailed member breakdown
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {billingLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading detailed billing information...</p>
                      </div>
                    ) : detailedBilling.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Calendar className="h-10 w-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-semibold mb-3">No billing history yet</h3>
                        <p className="text-muted-foreground">
                          Billing records will appear here once they are generated.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                      {detailedBilling.map((billing) => {
                        const isCurrentMonth = new Date().getMonth() + 1 === billing.billingMonth && 
                                              new Date().getFullYear() === billing.billingYear;
                        const isExpanded = expandedBillingSection === billing.billingId;
                        const filteredMembers = getFilteredMemberBilling(billing.memberBills);
                        
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
                                          : isCurrentMonth
                                          ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                                          : 'bg-gradient-to-r from-gray-400 to-gray-500'
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
                                        {isCurrentMonth && (
                                          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                                            Current Month
                                          </Badge>
                                        )}
                                        {billing.isFinalized && (
                                          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                                            <Archive className="h-3 w-3 mr-1" />
                                            Historical
                                          </Badge>
                                        )}
                                          </div>
                                      <div className="flex items-center space-x-4 mt-2">
                                        <Badge className={
                                          billing.billingStatus === 'fully_paid' 
                                            ? 'bg-green-100 text-green-800 border-green-200' 
                                            : billing.billingStatus === 'overdue'
                                            ? 'bg-red-100 text-red-800 border-red-200'
                                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                        }>
                                          {billing.billingStatus === 'fully_paid' && <CheckCircle className="h-4 w-4 mr-1" />}
                                          {billing.billingStatus === 'overdue' && <Clock className="h-4 w-4 mr-1" />}
                                          <span className="capitalize">{billing.billingStatus.replace('_', ' ')}</span>
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
                                  <div className="flex items-center space-x-4">
                                    {/* Pay button beside dropdown when unpaid and not current */}
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
                                    {/* Dropdown toggle */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setExpandedBillingSection(isExpanded ? null : billing.billingId)}
                                      className="flex items-center space-x-1"
                                    >
                                      <span className="text-sm">
                                        {isExpanded ? 'Hide Details' : 'Show Details'}
                                      </span>
                                      {isExpanded ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              
                              <CardContent className="pt-6">
                                {/* Summary Card - Simplified */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="text-sm font-medium text-green-900 mb-1">Total Bill Amount</div>
                                    <div className="text-3xl font-bold text-green-600">{formatCurrency(billing.totalBillAmount)}</div>
                                    <div className="text-xs text-green-700 mt-1">{billing.memberCount} members</div>
                                  </div>
                                  <div className={`border rounded-lg p-4 ${
                                    billing.billingStatus === 'fully_paid' 
                                      ? 'bg-green-50 border-green-200' 
                                      : 'bg-yellow-50 border-yellow-200'
                                  }`}>
                                    <div className={`text-sm font-medium mb-1 ${
                                      billing.billingStatus === 'fully_paid' ? 'text-green-900' : 'text-yellow-900'
                                    }`}>Payment Status</div>
                                    <div className="mt-2">
                                      <Badge variant="outline" className={
                                        billing.billingStatus === 'fully_paid'
                                          ? 'bg-green-100 text-green-800 border-green-200 text-lg px-4 py-2'
                                          : 'bg-yellow-100 text-yellow-800 border-yellow-200 text-lg px-4 py-2'
                                      }>
                                        {billing.billingStatus === 'fully_paid' ? '✓ PAID' : '○ UNPAID'}
                                      </Badge>
                                    </div>
                                    <div className={`text-xs mt-2 ${
                                      billing.billingStatus === 'fully_paid' ? 'text-green-700' : 'text-yellow-700'
                                    }`}>
                                      {billing.billingStatus === 'fully_paid' ? 'Fully paid' : 'Payment pending'}
                                    </div>
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
                                
                                {/* Detailed Content - Only show when expanded */}
                                {isExpanded && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-6 mt-6"
                                  >
                                    {/* Search & Filters */}
                                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                      <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1">
                                          <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                              placeholder="Search by member name, email, or phone..."
                                              value={searchTerm}
                                              onChange={(e) => setSearchTerm(e.target.value)}
                                              className="pl-10"
                                            />
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <Select value={sortBy} onValueChange={setSortBy}>
                                            <SelectTrigger className="w-40">
                                              <SelectValue placeholder="Sort by" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="name">Name</SelectItem>
                                              <SelectItem value="amount">Amount</SelectItem>
                                              <SelectItem value="daysActive">Days Active</SelectItem>
                                              <SelectItem value="startDate">Start Date</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                            className="px-3"
                                          >
                                            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Billing Breakdown - Simplified */}
                                    {billing.billingBreakdown && (
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
                                                  <span className="text-muted-foreground">Total Bill:</span>
                                                  <span className="font-medium text-green-600">{formatCurrency(breakdown.totalAmount)}</span>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  
                                    {/* Member Bills Detail */}
                                    {filteredMembers.length > 0 ? (
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
                                                <th className="text-center p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Days Active</th>
                                                <th className="text-center p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Base Fee</th>
                                                <th className="text-right p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Pro-rated Amount</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {filteredMembers.map((member, index) => {
                                                const memberId = typeof member.memberId === 'string' ? member.memberId : null;
                                                const displayId = memberId ? memberId.slice(-8) : 'N/A';
                                                const rowKey = memberId || `member-${billing.billingId}-${index}`;

                                                return (
                                                <tr 
                                                  key={rowKey}
                                                  className="border-b hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                                                >
                                                  <td className="p-3">
                                                    <div className="font-medium">{member.memberName}</div>
                                                    <div className="text-xs text-muted-foreground">ID: {displayId}</div>
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
                                                    <div className="font-medium">{member.daysActive}</div>
                                                    <div className="text-xs text-muted-foreground">of {member.daysInMonth} days</div>
                                                  </td>
                                                  <td className="p-3 text-center text-sm font-medium">
                                                    {formatCurrency(member.fixedMonthlyFee)}
                                                  </td>
                                                  <td className="p-3 text-right">
                                                    <div className="font-bold text-green-600">
                                                      {formatCurrency(member.proRatedAmount)}
                                        </div>
                                                    <div className="text-xs text-muted-foreground">
                                                      Pro-rated
                                      </div>
                                                  </td>
                                                </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                  </div>
                                </div>
                              ) : (
                                      <div className="text-center py-8 text-muted-foreground">
                                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>No members found matching your search criteria</p>
                                    </div>
                                    )}
                                    
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
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                  </div>
                                </div>
                              )}
                                    
                                    {/* Total Summary - Simplified */}
                                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                                      <div className="flex items-center justify-between mb-4">
                                        <div>
                                          <div className="text-lg font-semibold text-gray-900">
                                            Monthly Bill Summary
                                          </div>
                                          <div className="text-sm text-gray-600 mt-1">
                                            {billing.memberBills?.length || 0} active members
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-3xl font-bold text-green-700">
                                            {formatCurrency(billing.totalBillAmount)}
                                          </div>
                                          <div className="text-xs text-gray-600 mt-1">
                                            Total amount
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Payment Status Summary */}
                                      <div className="pt-4 border-t border-gray-200">
                                        <div className="flex items-center justify-between">
                                          <div className="text-sm text-gray-700">Payment Status:</div>
                                          <Badge variant="outline" className={
                                            billing.billingStatus === 'fully_paid'
                                              ? 'bg-green-100 text-green-800 border-green-200 text-base px-6 py-2'
                                              : 'bg-yellow-100 text-yellow-800 border-yellow-200 text-base px-6 py-2'
                                          }>
                                            {billing.billingStatus === 'fully_paid' ? '✓ PAID' : '○ UNPAID'}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>

                    {/* Billing Formula Explanation */}
                                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
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
                    )}
                  </CardContent>
                </Card>
              )}

            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default GymDetailPage;

