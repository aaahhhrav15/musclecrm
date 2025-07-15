import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueries } from "@tanstack/react-query";
import axios from "axios";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  UserCheck,
  UserX,
  CalendarClock,
  Plus,
  UserPlus,
  UserMinus,
  Calendar,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Cake,
  Gift,
  BarChart3,
  Target,
  AlertCircle,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useIndustry } from "@/context/IndustryContext";
import { useGym } from "@/context/GymContext";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axios";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import CustomerService from "@/services/CustomerService";
import api from "@/services/api";
import { Customer } from "@/services/CustomerService";
import { addMonths, differenceInDays } from "date-fns";
import { ApiService } from '@/services/ApiService';

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://api.musclecrm.com/api";

interface MetricCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  format?: "number" | "currency";
  isLoading?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  iconColor?: string;
  delay?: number;
  onClick?: () => void;
  className?: string;
}

// Add this mapping above MetricCard
const cardColorMap: Record<string, {
  gradientFrom: string;
  gradientTo: string;
  iconBg: string;
  iconColor: string;
}> = {
  'Total Members': {
    gradientFrom: 'from-blue-500/10', gradientTo: 'to-blue-600/5', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-600'
  },
  'Active Members': {
    gradientFrom: 'from-green-500/10', gradientTo: 'to-green-600/5', iconBg: 'bg-green-500/10', iconColor: 'text-green-600'
  },
  'Inactive Members': {
    gradientFrom: 'from-red-500/10', gradientTo: 'to-red-600/5', iconBg: 'bg-red-500/10', iconColor: 'text-red-600'
  },
  'Expiring in 7 Days': {
    gradientFrom: 'from-orange-500/10', gradientTo: 'to-orange-600/5', iconBg: 'bg-orange-500/10', iconColor: 'text-orange-600'
  },
  'Today Enrolled': {
    gradientFrom: 'from-emerald-500/10', gradientTo: 'to-emerald-600/5', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600'
  },
  'Total Member Amount': {
    gradientFrom: 'from-purple-500/10', gradientTo: 'to-purple-600/5', iconBg: 'bg-purple-500/10', iconColor: 'text-purple-600'
  },
  'Employee Birthdays': {
    gradientFrom: 'from-pink-500/10', gradientTo: 'to-pink-600/5', iconBg: 'bg-pink-500/10', iconColor: 'text-pink-600'
  },
  'Member Birthdays': {
    gradientFrom: 'from-indigo-500/10', gradientTo: 'to-indigo-600/5', iconBg: 'bg-indigo-500/10', iconColor: 'text-indigo-600'
  },
  'PT Expiring Today': {
    gradientFrom: 'from-yellow-500/10', gradientTo: 'to-yellow-600/5', iconBg: 'bg-yellow-500/10', iconColor: 'text-yellow-600'
  },
  'PT Expiring in 7 Days': {
    gradientFrom: 'from-amber-500/10', gradientTo: 'to-amber-600/5', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-600'
  },
  'Today Invoices': {
    gradientFrom: 'from-cyan-500/10', gradientTo: 'to-cyan-600/5', iconBg: 'bg-cyan-500/10', iconColor: 'text-cyan-600'
  },
  'Total Invoices': {
    gradientFrom: 'from-teal-500/10', gradientTo: 'to-teal-600/5', iconBg: 'bg-teal-500/10', iconColor: 'text-teal-600'
  },
  'Today Due Amount': {
    gradientFrom: 'from-amber-500/10', gradientTo: 'to-amber-600/5', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-600'
  },
  'Today Gym Expense': {
    gradientFrom: 'from-slate-500/10', gradientTo: 'to-slate-600/5', iconBg: 'bg-slate-500/10', iconColor: 'text-slate-600'
  },
  'Monthly Gym Expense (July 2025)': {
    gradientFrom: 'from-violet-500/10', gradientTo: 'to-violet-600/5', iconBg: 'bg-violet-500/10', iconColor: 'text-violet-600'
  },
  'Total Gym Expense': {
    gradientFrom: 'from-rose-500/10', gradientTo: 'to-rose-600/5', iconBg: 'bg-rose-500/10', iconColor: 'text-rose-600'
  },
  'Today Enquiry': {
    gradientFrom: 'from-lime-500/10', gradientTo: 'to-lime-600/5', iconBg: 'bg-lime-500/10', iconColor: 'text-lime-600'
  },
  'Today Follow-Ups': {
    gradientFrom: 'from-sky-500/10', gradientTo: 'to-sky-600/5', iconBg: 'bg-sky-500/10', iconColor: 'text-sky-600'
  },
  // Add more mappings as needed for all card titles
  'Member Amount': { gradientFrom: 'from-emerald-500/10', gradientTo: 'to-emerald-600/5', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600' },
  'Total Expenses': { gradientFrom: 'from-red-500/10', gradientTo: 'to-red-600/5', iconBg: 'bg-red-500/10', iconColor: 'text-red-600' },
  'Total Gym Profit': { gradientFrom: 'from-green-500/10', gradientTo: 'to-green-600/5', iconBg: 'bg-green-500/10', iconColor: 'text-green-600' },
  'Today Purchase': { gradientFrom: 'from-blue-500/10', gradientTo: 'to-blue-600/5', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-600' },
  'Total Purchase': { gradientFrom: 'from-indigo-500/10', gradientTo: 'to-indigo-600/5', iconBg: 'bg-indigo-500/10', iconColor: 'text-indigo-600' },
  'Total Stock Value': { gradientFrom: 'from-green-500/10', gradientTo: 'to-green-600/5', iconBg: 'bg-green-500/10', iconColor: 'text-green-600' },
  'Low Stock Value': { gradientFrom: 'from-orange-500/10', gradientTo: 'to-orange-600/5', iconBg: 'bg-orange-500/10', iconColor: 'text-orange-600' },
  'Total Clearing Amount': { gradientFrom: 'from-purple-500/10', gradientTo: 'to-purple-600/5', iconBg: 'bg-purple-500/10', iconColor: 'text-purple-600' },
  'Today Sell': { gradientFrom: 'from-emerald-500/10', gradientTo: 'to-emerald-600/5', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600' },
  'Total Sell': { gradientFrom: 'from-teal-500/10', gradientTo: 'to-teal-600/5', iconBg: 'bg-teal-500/10', iconColor: 'text-teal-600' },
  'Total Sell Purchase Value': { gradientFrom: 'from-cyan-500/10', gradientTo: 'to-cyan-600/5', iconBg: 'bg-cyan-500/10', iconColor: 'text-cyan-600' },
  'Today Sell Invoice': { gradientFrom: 'from-pink-500/10', gradientTo: 'to-pink-600/5', iconBg: 'bg-pink-500/10', iconColor: 'text-pink-600' },
  'Total Sell Invoice': { gradientFrom: 'from-rose-500/10', gradientTo: 'to-rose-600/5', iconBg: 'bg-rose-500/10', iconColor: 'text-rose-600' },
  'Sell Due Amount': { gradientFrom: 'from-amber-500/10', gradientTo: 'to-amber-600/5', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-600' },
  'Total POS Expense': {
    gradientFrom: 'from-red-500/10', gradientTo: 'to-red-600/5', iconBg: 'bg-red-500/10', iconColor: 'text-red-600'
  },
  'Today POS Expense': {
    gradientFrom: 'from-orange-500/10', gradientTo: 'to-orange-600/5', iconBg: 'bg-orange-500/10', iconColor: 'text-orange-600'
  },
  'Total POS Amount': { gradientFrom: 'from-blue-500/10', gradientTo: 'to-blue-600/5', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-600' },
  'Total POS Profit': { gradientFrom: 'from-green-500/10', gradientTo: 'to-green-600/5', iconBg: 'bg-green-500/10', iconColor: 'text-green-600' },
  'Total Business Profit (Gym + POS)': { gradientFrom: 'from-emerald-500/10', gradientTo: 'to-emerald-600/5', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600' },
  'Today Sell Value': {
    gradientFrom: 'from-emerald-500/10', gradientTo: 'to-emerald-600/5', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600'
  },
  'Total Sell Value': {
    gradientFrom: 'from-teal-500/10', gradientTo: 'to-teal-600/5', iconBg: 'bg-teal-500/10', iconColor: 'text-teal-600'
  },
  'Today Retail Sales': {
    gradientFrom: 'from-green-500/10', gradientTo: 'to-green-600/5', iconBg: 'bg-green-500/10', iconColor: 'text-green-600'
  },
  'Total Retail Sales': {
    gradientFrom: 'from-blue-500/10', gradientTo: 'to-blue-600/5', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-600'
  },
  'Total Gym Expenses': {
    gradientFrom: 'from-rose-500/10', gradientTo: 'to-rose-600/5', iconBg: 'bg-rose-500/10', iconColor: 'text-rose-600'
  },
};

const defaultColor = {
  gradientFrom: 'from-gray-200',
  gradientTo: 'to-gray-100',
  iconBg: 'bg-gray-200',
  iconColor: 'text-gray-600',
};

const MetricCard: React.FC<MetricCardProps> = React.memo(({
  title,
  value,
  icon,
  format = "number",
  isLoading,
  delay = 0,
  onClick,
  className,
}) => {
  const color = cardColorMap[title] || (title.startsWith('Monthly Gym Expense') ? { gradientFrom: 'from-violet-500/10', gradientTo: 'to-violet-600/5', iconBg: 'bg-violet-500/10', iconColor: 'text-violet-600' } : defaultColor);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={className}
    >
      <Card
        className="relative overflow-hidden border-0 shadow-lg cursor-pointer hover:shadow-lg transition"
        onClick={onClick}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${color.gradientFrom} ${color.gradientTo}`} />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`h-10 w-10 rounded-full ${color.iconBg} flex items-center justify-center`}>
            {React.cloneElement(icon as React.ReactElement, {
              className: `h-5 w-5 ${color.iconColor}`,
            })}
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="text-2xl font-bold">
              {format === "currency"
                ? formatCurrency(
                    typeof value === "string" ? parseFloat(value) : (value || 0)
                  )
                : typeof value === "string"
                ? value
                : (value || 0).toLocaleString()}
            </div>
          )}
          <p className="text-xs text-muted-foreground flex items-center">
            <Activity className="h-3 w-3 mr-1" />
            Real-time data
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
});

// Default metrics data
const defaultMetrics = {
  members: {
    totalMembers: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    expiringIn7Days: 0,
    todayEmployees: 0,
    todayEnrolled: 0,
    totalMemberAmount: 0,
    todayEmployeeBirthdays: 0,
    todayInvoices: 0,
    totalInvoices: 0,
    todayDueAmount: 0,
    todayMemberBirthdays: 0,
    todayExpense: 0,
    monthlyExpense: 0,
    totalExpense: 0,
    todayGymExpense: 0,
    monthlyGymExpense: 0,
    totalGymExpense: 0,
    todayEnquiry: 0,
    todayFollowUps: 0,
  },
  memberProfit: {
    memberAmount: 0,
    memberExpense: 0,
    totalMemberProfit: 0,
  },
  pos: {
    todayPurchase: 0,
    totalPurchase: 0,
    totalStockValue: 0,
    lowStockValue: 0,
    totalClearingAmount: 0,
    todaySell: 0,
    totalSell: 0,
    totalSellPurchaseValue: 0,
    todaySellInvoice: 0,
    totalSellInvoice: 0,
    sellDueAmount: 0,
    totalPosExpense: 0,
    todayPosExpense: 0,
    todayRetailSales: 0,
    totalRetailSales: 0,
    todayRetailExpense: 0,
    totalRetailExpense: 0,
  },
  posProfit: {
    posProfit: 0,
  },
  overallProfit: {
    totalProfit: 0,
  },
  expenses: {
    todayGymExpense: 0,
    monthlyGymExpense: 0,
    totalGymExpense: 0,
  }
};

// Add Staff type for modal context
interface Staff {
  _id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  hireDate: string;
  status: "Active" | "Inactive" | "On Leave";
  dateOfBirth?: string;
  experience?: number;
}

// Add Lead type for leads modal context
interface Lead {
  _id: string;
  name: string;
  phone: string;
  source: string;
  status: string;
  followUpDate?: string;
  notes: string;
  createdAt: string;
}

// Personal Training Assignment type
interface PersonalTrainingAssignment {
  _id: string;
  customerId: { _id: string; name: string; email?: string };
  trainerId: { _id: string; name: string; email?: string };
  gymId: string;
  startDate: string;
  duration: number;
  endDate: string;
  fees: number;
}

type ModalType =
  | "memberBirthdays"
  | "employeeBirthdays"
  | "expiring"
  | "inactive"
  | "todayEnrolled"
  | "todayEnquiry"
  | "todayFollowUps";

const Dashboard: React.FC = () => {
  const { gym, loading: gymLoading } = useGym();
  const { loading: authLoading } = useAuth();
  
  // **OPTIMIZATION: Stabilize gym ID to prevent unnecessary re-renders**
  const stableGymId = useMemo(() => gym?._id, [gym?._id]);
  
  // **FIX: Wait for both auth and gym contexts to finish loading**
  const isReady = !authLoading && !gymLoading && !!stableGymId;
  
  // **OPTIMIZATION: Single dashboard query that gets all metrics including POS expenses**
  const dashboardQuery = useQuery({
    queryKey: ["dashboardMetrics", stableGymId],
    queryFn: async () => {
      if (!stableGymId) {
        console.log('No gym ID available, returning default metrics');
        return defaultMetrics;
      }
      
      console.log('Making dashboard API call with gym ID:', stableGymId);
      const response = await axiosInstance.get(`/dashboard`);
      
      // **FIX: Validate response data**
      if (!response.data || !response.data.metrics) {
        console.warn('Invalid dashboard response:', response.data);
        return defaultMetrics;
      }
      
      console.log('Dashboard API response:', response.data.metrics);
      return response.data.metrics;
    },
    enabled: isReady,
    staleTime: 120000, // 2 minutes (matching backend cache)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    retry: 1,
  });

  // **OPTIMIZATION: Customer query for additional data**
  const customerQuery = useQuery({
    queryKey: ["customers", stableGymId],
    queryFn: async () => {
      if (!stableGymId) return [];
      const { customers } = await CustomerService.getCustomers({ 
        page: 1, 
        limit: 1000
      });
      return customers;
    },
    enabled: isReady,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    retry: 1,
  });
  
  // Debug logging
  console.log('Dashboard loading states:', {
    authLoading,
    gymLoading,
    stableGymId: !!stableGymId,
    isReady,
    dashboardQuery: {
      isLoading: dashboardQuery.isLoading,
      isError: dashboardQuery.isError,
      data: !!dashboardQuery.data
    }
  });

  // **OPTIMIZATION: Memoized calculations using stored end dates from database**
  const { 
    memberMetrics, 
    expiringCustomers, 
    memberBirthdays, 
    todayEnrolled,
    totalMemberAmount
  } = useMemo(() => {
    if (!customerQuery.data) return {
      memberMetrics: {
        totalMembers: 0,
        activeMembers: 0,
        inactiveMembers: 0,
        expiringIn7Days: 0,
      },
      expiringCustomers: [],
      memberBirthdays: 0,
      todayEnrolled: 0,
      totalMemberAmount: 0,
    };

    const customerData = customerQuery.data;
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    today.setHours(0,0,0,0);
    sevenDaysFromNow.setHours(0,0,0,0);

    // Calculate all metrics in one pass for efficiency
    let totalMembers = 0;
    let activeMembers = 0;
    let inactiveMembers = 0;
    const expiringCustomers: Customer[] = [];
    let memberBirthdays = 0;
    let todayEnrolled = 0;
    let totalMemberAmount = 0;

    customerData.forEach(customer => {
      totalMembers++;
      totalMemberAmount += customer.totalSpent || 0;

      // **OPTIMIZATION: Use stored membershipEndDate from database (no calculation needed)**
      if (customer.membershipEndDate) {
        const endDate = new Date(customer.membershipEndDate);
        endDate.setHours(0,0,0,0);
        
        if (endDate >= today) {
          activeMembers++;
          // Check if expiring in 7 days
          if (endDate <= sevenDaysFromNow) {
            expiringCustomers.push(customer);
          }
        } else {
          inactiveMembers++;
        }
      } else {
        // If no end date stored, consider inactive
        inactiveMembers++;
      }

      // Birthdays
      if (customer.birthday) {
        const bday = new Date(customer.birthday);
        if (bday.getDate() === today.getDate() && bday.getMonth() === today.getMonth()) {
          memberBirthdays++;
        }
      }

      // Today enrolled
      if (customer.joinDate) {
        const join = new Date(customer.joinDate);
        if (join.getDate() === today.getDate() && 
            join.getMonth() === today.getMonth() && 
            join.getFullYear() === today.getFullYear()) {
          todayEnrolled++;
        }
      }
    });

    return {
      memberMetrics: {
        totalMembers,
        activeMembers,
        inactiveMembers,
        expiringIn7Days: expiringCustomers.length,
      },
      expiringCustomers,
      memberBirthdays,
      todayEnrolled,
      totalMemberAmount,
    };
  }, [customerQuery.data, customerQuery.dataUpdatedAt]); // Added dataUpdatedAt for stability

  // Always provide a fallback for members
  const metrics = useMemo(() => {
    const data = dashboardQuery.data || {};
    
    // Debug logs to understand data structure
    console.log('Raw dashboard data:', data);
    console.log('Members data:', data.members);
    console.log('Expenses data:', data.expenses);
    
    return {
      ...defaultMetrics,
      ...data,
      members: {
        ...defaultMetrics.members,
        ...(data.members || {})
      },
      expenses: {
        ...defaultMetrics.expenses,
        ...(data.expenses || {})
      }
    };
  }, [dashboardQuery.data, dashboardQuery.dataUpdatedAt]);

  // **OPTIMIZATION: Enhanced metrics with customer data and fixed gym expenses**
  const enhancedMetrics = useMemo(() => {
    const baseMetrics = metrics;
    
    // Multiple fallback paths for gym expenses
    const getTodayGymExpense = () => {
      return baseMetrics.members?.todayGymExpense ?? 
             baseMetrics.expenses?.todayGymExpense ?? 
             baseMetrics.members?.todayExpense ?? 
             0;
    };
    
    const getMonthlyGymExpense = () => {
      return baseMetrics.members?.monthlyGymExpense ?? 
             baseMetrics.expenses?.monthlyGymExpense ?? 
             baseMetrics.members?.monthlyExpense ?? 
             0;
    };
    
    const getTotalGymExpense = () => {
      return baseMetrics.members?.totalGymExpense ?? 
             baseMetrics.expenses?.totalGymExpense ?? 
             baseMetrics.members?.totalExpense ?? 
             0;
    };
    
    console.log('Enhanced metrics calculation:', {
      todayGymExpense: getTodayGymExpense(),
      monthlyGymExpense: getMonthlyGymExpense(),
      totalGymExpense: getTotalGymExpense(),
      baseMembersData: baseMetrics.members,
      baseExpensesData: baseMetrics.expenses
    });
    
    return {
      ...baseMetrics,
      members: {
        ...baseMetrics.members,
        totalMembers: memberMetrics.totalMembers,
        activeMembers: memberMetrics.activeMembers,
        inactiveMembers: memberMetrics.inactiveMembers,
        expiringIn7Days: memberMetrics.expiringIn7Days,
        todayMemberBirthdays: memberBirthdays,
        todayEnrolled: todayEnrolled,
        totalMemberAmount: totalMemberAmount,
        // Fixed gym expense fields with multiple fallbacks
        todayGymExpense: getTodayGymExpense(),
        monthlyGymExpense: getMonthlyGymExpense(),
        totalGymExpense: getTotalGymExpense(),
      }
    };
  }, [
    metrics, 
    memberMetrics, 
    memberBirthdays, 
    todayEnrolled, 
    totalMemberAmount
  ]);

  // **OPTIMIZATION: Memoized profit calculations using dashboard metrics**
  const profitMetrics = useMemo(() => {
    const memberAmount = enhancedMetrics.members?.totalMemberAmount || 0;
    const memberExpense = enhancedMetrics.members?.totalGymExpense || 0;
    const totalGymProfit = memberAmount - memberExpense;
    
    const totalPosAmount = metrics.pos?.totalRetailSales || 0;
    const totalPosExpense = metrics.pos?.totalRetailExpense || 0;
    const calculatedPosProfit = totalPosAmount - totalPosExpense;
    
    const overallTotalProfit = totalGymProfit + calculatedPosProfit;

    return {
      totalGymProfit,
      calculatedPosProfit,
      overallTotalProfit,
      memberExpense,
    };
  }, [enhancedMetrics.members?.totalMemberAmount, enhancedMetrics.members?.totalGymExpense, metrics.pos?.totalRetailSales, metrics.pos?.totalRetailExpense]);

  // **OPTIMIZATION: PT data now comes from main dashboard endpoint**
  const ptExpiringToday = metrics.members?.ptExpiringToday || 0;
  const ptExpiringIn7Days = metrics.members?.ptExpiringIn7Days || 0;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [modalData, setModalData] = useState<Customer[] | Staff[] | Lead[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Modal state for PT assignments
  const [ptModalOpen, setPTModalOpen] = useState(false);
  const [ptModalType, setPTModalType] = useState<'today' | '7days' | null>(null);

  // **OPTIMIZATION: Optimized modal handler with lazy loading**
  const handleOpenModal = React.useCallback(async (type: ModalType) => {
    setModalType(type);
    setModalOpen(true);
    setModalLoading(true);
    
    let data: Customer[] | Staff[] | Lead[] = [];
    
    try {
      if (type === "expiring") {
        data = expiringCustomers;
      } else if (type === "inactive") {
        data = customerQuery.data?.filter(c => {
          if (!c.membershipEndDate) return true;
          const endDate = new Date(c.membershipEndDate);
          const today = new Date();
          endDate.setHours(0,0,0,0);
          today.setHours(0,0,0,0);
          return endDate < today;
        }) || [];
      } else if (type === "memberBirthdays") {
        const today = new Date();
        data = customerQuery.data?.filter((c) => {
          if (!c.birthday) return false;
          const bday = new Date(c.birthday);
          return (
            bday.getDate() === today.getDate() &&
            bday.getMonth() === today.getMonth()
          );
        }) || [];
      } else if (type === "todayEnrolled") {
        const today = new Date();
        data = customerQuery.data?.filter((c) => {
          if (!c.joinDate) return false;
          const join = new Date(c.joinDate);
          return (
            join.getDate() === today.getDate() &&
            join.getMonth() === today.getMonth() &&
            join.getFullYear() === today.getFullYear()
          );
        }) || [];
      } else {
        // For other types, we still need to fetch fresh data
        if (type === "employeeBirthdays") {
          const today = new Date();
          const month = String(today.getMonth() + 1).padStart(2, "0");
          const day = String(today.getDate()).padStart(2, "0");
          const response = await api.get("/gym/staff");
          data = (response.data.data || []).filter(
            (s: Staff) =>
              s.dateOfBirth && s.dateOfBirth.slice(5, 10) === `${month}-${day}`
          );
        } else if (type === "todayEnquiry" || type === "todayFollowUps") {
          const today = new Date();
          const response = await axiosInstance.get("/leads");
          const leads = response.data as Lead[];
          
          if (type === "todayEnquiry") {
            data = leads.filter((l) => {
              if (!l.createdAt) return false;
              const created = new Date(l.createdAt);
              return (
                created.getDate() === today.getDate() &&
                created.getMonth() === today.getMonth() &&
                created.getFullYear() === today.getFullYear()
              );
            });
          } else {
            data = leads.filter((l) => {
              if (!l.followUpDate) return false;
              const followUpDateObj = new Date(l.followUpDate);
              return (
                followUpDateObj.getDate() === today.getDate() &&
                followUpDateObj.getMonth() === today.getMonth() &&
                followUpDateObj.getFullYear() === today.getFullYear()
              );
            });
          }
        }
      }
    } catch (e) {
      console.error('Error loading modal data:', e);
      data = [];
    }
    
    setModalData(data);
    setModalLoading(false);
  }, [expiringCustomers, customerQuery.data]);

  const handleCloseModal = React.useCallback(() => {
    setModalOpen(false);
    setModalType(null);
    setModalData([]);
  }, []);

  const handleOpenPTModal = (type: 'today' | '7days') => {
    setPTModalType(type);
    setPTModalOpen(true);
  };
  const handleClosePTModal = () => {
    setPTModalOpen(false);
    setPTModalType(null);
  };

  // Helper functions
  function isStaff(item: Customer | Staff | Lead): item is Staff {
    return (item as Staff).position !== undefined && !(item as Lead).source;
  }
  function isCustomer(item: Customer | Staff | Lead): item is Customer {
    return typeof (item as Customer).id === "string";
  }
  function isLead(item: Customer | Staff | Lead): item is Lead {
    return (
      (item as Lead).source !== undefined &&
      (item as Lead).createdAt !== undefined &&
      (item as Lead)._id !== undefined
    );
  }

  function getModalRowKey(item: Customer | Staff | Lead): string {
    if (isCustomer(item) && item.id) return `customer-${item.id}`;
    if (isStaff(item) && item._id) return `staff-${item._id}`;
    if (isLead(item) && item._id) return `lead-${item._id}`;
    const phone = (typeof (item as Customer | Staff | Lead & { phone?: string }).phone === 'string') ? (item as Customer | Staff | Lead & { phone?: string }).phone : 'no-phone';
    return `${item.name || "unknown"}-${phone}`;
  }

  // **OPTIMIZATION: Stabilized loading state check**
  const isLoading = useMemo(() => {
    return authLoading || gymLoading || dashboardQuery.isLoading || customerQuery.isLoading;
  }, [authLoading, gymLoading, dashboardQuery.isLoading, customerQuery.isLoading]);

  // **FIX: Check if we have actual data, not just loading state**
  const hasData = useMemo(() => {
    if (!dashboardQuery.data) return false;
    
    // Check if we have meaningful data (not just default values)
    const data = dashboardQuery.data;
    const hasMembersData = data.members && (
      data.members.totalMembers > 0 || 
      data.members.activeMembers > 0 || 
      data.members.inactiveMembers > 0 ||
      data.members.totalMemberAmount > 0
    );
    
    const hasExpenseData = data.expenses && (
      data.expenses.totalGymExpense > 0 ||
      data.expenses.monthlyGymExpense > 0
    );
    
    const hasPosData = data.pos && (
      data.pos.totalRetailSales > 0 ||
      data.pos.totalRetailExpense > 0
    );
    
    console.log('Data validation:', {
      hasMembersData,
      hasExpenseData,
      hasPosData,
      dataKeys: Object.keys(data),
      membersData: data.members,
      expensesData: data.expenses,
      posData: data.pos
    });
    
    return hasMembersData || hasExpenseData || hasPosData || Object.keys(data).length > 0;
  }, [dashboardQuery.data]);

  // **OPTIMIZATION: Early return with memoized loading component**
  const LoadingComponent = useMemo(() => (
    <DashboardLayout>
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    </DashboardLayout>
  ), []);

  // **FIX: Show loading until we have actual data, not just when queries are loading**
  // Add a small delay to prevent flash of 0 values
  const [showContent, setShowContent] = useState(false);
  
  useEffect(() => {
    if (!isLoading && hasData) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 100); // Small delay to ensure smooth transition
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isLoading, hasData]);
  
  if (isLoading || !hasData || !showContent) {
    return LoadingComponent;
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
              Dashboard Overview
            </h1>
            <p className="text-muted-foreground text-lg">
              Real-time insights into your gym's performance and analytics.
            </p>
          </div>
        </div>

        {/* Gym Insights Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
            <h2 className="text-2xl font-bold">Gym Insights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Members"
              value={enhancedMetrics.members.totalMembers || 0}
              icon={<Users />}
              isLoading={dashboardQuery.isLoading}
              delay={0.1}
            />
            <MetricCard
              title="Active Members"
              value={enhancedMetrics.members.activeMembers || 0}
              icon={<UserPlus />}
              isLoading={dashboardQuery.isLoading}
              delay={0.15}
            />
            <MetricCard
              title="Inactive Members"
              value={enhancedMetrics.members.inactiveMembers || 0}
              icon={<UserMinus />}
              isLoading={dashboardQuery.isLoading}
              delay={0.2}
              onClick={() => handleOpenModal("inactive")}
              className="cursor-pointer hover:shadow-lg transition"
            />
            <MetricCard
              title="Expiring in 7 Days"
              value={enhancedMetrics.members.expiringIn7Days || 0}
              icon={<AlertCircle />}
              isLoading={dashboardQuery.isLoading}
              delay={0.25}
              onClick={() => handleOpenModal("expiring")}
              className="cursor-pointer hover:shadow-lg transition"
            />
            <MetricCard
              title="Today Enrolled"
              value={enhancedMetrics.members.todayEnrolled || 0}
              icon={<UserPlus />}
              isLoading={dashboardQuery.isLoading}
              delay={0.3}
              onClick={() => handleOpenModal("todayEnrolled")}
              className="cursor-pointer hover:shadow-lg transition"
            />
            <MetricCard
              title="Total Member Amount"
              value={enhancedMetrics.members.totalMemberAmount || 0}
              icon={<DollarSign />}
              format="currency"
              isLoading={dashboardQuery.isLoading}
              delay={0.35}
            />
            <MetricCard
              title="Employee Birthdays"
              value={metrics.members?.todayEmployeeBirthdays || 0}
              icon={<Cake />}
              isLoading={dashboardQuery.isLoading}
              delay={0.4}
              onClick={() => handleOpenModal("employeeBirthdays")}
              className="cursor-pointer hover:shadow-lg transition"
            />
            <MetricCard
              title="Member Birthdays"
              value={enhancedMetrics.members.todayMemberBirthdays || 0}
              icon={<Gift />}
              isLoading={dashboardQuery.isLoading}
              delay={0.45}
              onClick={() => handleOpenModal("memberBirthdays")}
              className="cursor-pointer hover:shadow-lg transition"
            />
            <MetricCard
              title="PT Expiring Today"
              value={metrics.members?.ptExpiringToday || 0}
              icon={<AlertCircle />}
              isLoading={dashboardQuery.isLoading}
              delay={0.26}
              onClick={() => handleOpenPTModal('today')}
              className="cursor-pointer hover:shadow-lg transition"
            />
            <MetricCard
              title="PT Expiring in 7 Days"
              value={metrics.members?.ptExpiringIn7Days || 0}
              icon={<AlertCircle />}
              isLoading={dashboardQuery.isLoading}
              delay={0.27}
              onClick={() => handleOpenPTModal('7days')}
              className="cursor-pointer hover:shadow-lg transition"
            />

            <MetricCard
              title="Today Invoices"
              value={metrics.members?.todayInvoices || 0}
              icon={<BarChart3 />}
              isLoading={dashboardQuery.isLoading}
              delay={0.5}
            />
            <MetricCard
              title="Total Invoices"
              value={metrics.members?.totalInvoices || 0}
              icon={<BarChart3 />}
              isLoading={dashboardQuery.isLoading}
              delay={0.55}
            />
            <MetricCard
              title="Today Due Amount"
              value={metrics.members?.todayDueAmount || 0}
              icon={<AlertCircle />}
              format="currency"
              isLoading={dashboardQuery.isLoading}
              delay={0.6}
            />
            
            {/* FIXED GYM EXPENSE CARDS */}
            <MetricCard
              title="Today Gym Expense"
              value={enhancedMetrics.members?.todayGymExpense || 0}
              icon={<DollarSign />}
              format="currency"
              isLoading={dashboardQuery.isLoading}
              delay={0.65}
            />
            <MetricCard
              title={`Monthly Gym Expense (${format(new Date(), "MMMM yyyy")})`}
              value={enhancedMetrics.members?.monthlyGymExpense || 0}
              icon={<Calendar />}
              format="currency"
              isLoading={dashboardQuery.isLoading}
              delay={0.7}
            />
            <MetricCard
              title="Total Gym Expense"
              value={enhancedMetrics.members?.totalGymExpense || 0}
              icon={<TrendingUp />}
              format="currency"
              isLoading={dashboardQuery.isLoading}
              delay={0.75}
            />
            
            <MetricCard
              title="Today Enquiry"
              value={metrics.members?.todayEnquiry || 0}
              icon={<Users />}
              isLoading={dashboardQuery.isLoading}
              delay={0.8}
              onClick={() => handleOpenModal("todayEnquiry")}
              className="cursor-pointer hover:shadow-lg transition"
            />
            <MetricCard
              title="Today Follow-Ups"
              value={metrics.members?.todayFollowUps || 0}
              icon={<Target />}
              isLoading={dashboardQuery.isLoading}
              delay={0.85}
              onClick={() => handleOpenModal("todayFollowUps")}
              className="cursor-pointer hover:shadow-lg transition"
            />
           
          </div>
        </div>

        {/* Profit Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-green-600 rounded-full" />
            <h2 className="text-2xl font-bold">Profit Analysis</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Member Amount"
              value={enhancedMetrics.members?.totalMemberAmount || 0}
              format="currency"
              icon={<DollarSign />}
              isLoading={dashboardQuery.isLoading}
              delay={0.1}
            />
            <MetricCard
              title="Total Gym Expenses"
              value={enhancedMetrics.members?.totalGymExpense || 0}
              format="currency"
              icon={<TrendingUp />}
              isLoading={dashboardQuery.isLoading}
              delay={0.2}
            />
            <MetricCard
              title="Total Gym Profit"
              value={profitMetrics.totalGymProfit}
              format="currency"
              icon={<Target />}
              isLoading={isLoading}
              delay={0.3}
            />
          </div>
        </div>

        {/* POS Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full" />
            <h2 className="text-2xl font-bold">Point of Sale</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Today Retail Sales"
              value={metrics.pos?.todayRetailSales ?? 0}
              format="currency"
              icon={<TrendingUp />}
              isLoading={dashboardQuery.isLoading}
              delay={0.1}
            />
            <MetricCard
              title="Total Retail Sales"
              value={metrics.pos?.totalRetailSales ?? 0}
              format="currency"
              icon={<TrendingUp />}
              isLoading={dashboardQuery.isLoading}
              delay={0.2}
            />
            <MetricCard
              title="Today POS Expense"
              value={metrics.pos?.todayRetailExpense ?? 0}
              format="currency"
              icon={<DollarSign />}
              isLoading={dashboardQuery.isLoading}
              delay={0.3}
            />
            <MetricCard
              title="Total POS Expense"
              value={metrics.pos?.totalRetailExpense ?? 0}
              format="currency"
              icon={<DollarSign />}
              isLoading={dashboardQuery.isLoading}
              delay={0.4}
            />
          </div>
        </div>

        {/* POS Profit Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full" />
            <h2 className="text-2xl font-bold">POS Profit Analysis</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total POS Amount"
              value={metrics.pos?.totalRetailSales || 0}
              format="currency"
              icon={<DollarSign />}
              isLoading={dashboardQuery.isLoading}
              delay={0.1}
            />
            <MetricCard
              title="Total POS Expense"
              value={metrics.pos?.totalRetailExpense || 0}
              format="currency"
              icon={<TrendingUp />}
              isLoading={dashboardQuery.isLoading}
              delay={0.2}
            />
            <MetricCard
              title="Total POS Profit"
              value={profitMetrics.calculatedPosProfit}
              format="currency"
              icon={<Target />}
              isLoading={dashboardQuery.isLoading}
              delay={0.3}
            />
          </div>
        </div>

        {/* Overall Profit Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full" />
            <h2 className="text-2xl font-bold">Overall Performance</h2>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <MetricCard
              title="Total Business Profit (Gym + POS)"
              value={profitMetrics.overallTotalProfit}
              format="currency"
              icon={<Target />}
              isLoading={isLoading}
              delay={0.1}
            />
          </div>
        </div>
      </motion.div>

      {/* Modal for member/staff lists */}
      <Dialog open={modalOpen} onOpenChange={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalType === "memberBirthdays"
                ? "Member Birthdays Today"
                : modalType === "employeeBirthdays"
                ? "Employee Birthdays Today"
                : modalType === "expiring"
                ? "Memberships Expiring in 7 Days"
                : modalType === "inactive"
                ? "Inactive Members"
                : modalType === "todayEnrolled"
                ? "Today Enrolled Members"
                : modalType === "todayEnquiry"
                ? "Today Enquiries"
                : modalType === "todayFollowUps"
                ? "Today Follow-Ups"
                : ""}
            </DialogTitle>
          </DialogHeader>
          {modalLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : modalData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No records found.
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead>
                  {(modalType === "expiring" || modalType === "inactive") ? (
                    <tr>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Phone</th>
                      <th className="text-left p-2">End Date</th>
                    </tr>
                  ) : modalType === "todayEnquiry" || modalType === "todayFollowUps" ? (
                    <tr>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Phone</th>
                      <th className="text-left p-2">Source</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Follow-up Date</th>
                      <th className="text-left p-2">Notes</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Phone</th>
                      {modalType === "employeeBirthdays" && (
                        <th className="text-left p-2">Position</th>
                      )}
                    </tr>
                  )}
                </thead>
                <tbody>
                  {(modalData as (Customer | Staff | Lead)[]).map((item) => {
                    if ((modalType === "expiring" || modalType === "inactive") && isCustomer(item)) {
                      return (
                        <tr key={getModalRowKey(item)} className="border-b">
                          <td className="p-2">{item.name}</td>
                          <td className="p-2">{item.email || "Not Given"}</td>
                          <td className="p-2">{item.phone || "Not Given"}</td>
                          <td className="p-2" style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>
                            {(() => {
                              const raw = item.membershipEndDate;
                              if (!raw) return "Not Given";
                              try {
                                const d = new Date(raw);
                                if (isNaN(d.getTime())) return "Invalid Date";
                                return d.toLocaleDateString("en-GB");
                              } catch (error) {
                                return "Invalid Date";
                              }
                            })()}
                          </td>
                        </tr>
                      );
                    }
                    if (isLead(item)) {
                      return (
                        <tr key={getModalRowKey(item)} className="border-b">
                          <td className="p-2">{item.name}</td>
                          <td className="p-2">{item.phone || "-"}</td>
                          <td className="p-2">{item.source || "-"}</td>
                          <td className="p-2">{item.status || "-"}</td>
                          <td className="p-2">{item.followUpDate ? new Date(item.followUpDate).toLocaleDateString() : "-"}</td>
                          <td className="p-2">{item.notes || "-"}</td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={getModalRowKey(item)} className="border-b">
                        <td className="p-2">{item.name}</td>
                        <td className="p-2">{item.email || "Not Given"}</td>
                        <td className="p-2">{item.phone || "Not Given"}</td>
                        {modalType === "employeeBirthdays" && isStaff(item) && (
                          <td className="p-2">{item.position || "-"}</td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal for PT expiring assignments */}
      <Dialog open={ptModalOpen} onOpenChange={handleClosePTModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {ptModalType === 'today' ? 'Personal Training Expiring Today' : 'Personal Training Expiring in Next 7 Days'}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            {ptModalType === 'today' 
              ? `There are ${ptExpiringToday} personal training assignments expiring today.`
              : `There are ${ptExpiringIn7Days} personal training assignments expiring in the next 7 days.`
            }
            <br />
            <span className="text-sm">Detailed list will be available in a future update.</span>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Dashboard;