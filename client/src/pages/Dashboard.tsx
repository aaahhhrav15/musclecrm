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
  "http://localhost:5001/api";

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
  'Today Expense': {
    gradientFrom: 'from-slate-500/10', gradientTo: 'to-slate-600/5', iconBg: 'bg-slate-500/10', iconColor: 'text-slate-600'
  },
  'Monthly Expense (July 2025)': {
    gradientFrom: 'from-violet-500/10', gradientTo: 'to-violet-600/5', iconBg: 'bg-violet-500/10', iconColor: 'text-violet-600'
  },
  'Total Expense': {
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
  'Total POS Expense': { gradientFrom: 'from-slate-500/10', gradientTo: 'to-slate-600/5', iconBg: 'bg-slate-500/10', iconColor: 'text-slate-600' },
  'Today POS Expense': { gradientFrom: 'from-gray-500/10', gradientTo: 'to-gray-600/5', iconBg: 'bg-gray-500/10', iconColor: 'text-gray-600' },
  'Total POS Amount': { gradientFrom: 'from-blue-500/10', gradientTo: 'to-blue-600/5', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-600' },
  'Total POS Profit': { gradientFrom: 'from-green-500/10', gradientTo: 'to-green-600/5', iconBg: 'bg-green-500/10', iconColor: 'text-green-600' },
  'Total Business Profit (Gym + POS)': { gradientFrom: 'from-emerald-500/10', gradientTo: 'to-emerald-600/5', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600' },
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
  const color = cardColorMap[title] || (title.startsWith('Monthly Expense') ? { gradientFrom: 'from-violet-500/10', gradientTo: 'to-violet-600/5', iconBg: 'bg-violet-500/10', iconColor: 'text-violet-600' } : defaultColor);
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
    totalExpense: 0,
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
  },
  posProfit: {
    posProfit: 0,
  },
  overallProfit: {
    totalProfit: 0,
  },
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
  const { gym } = useGym();
  
  // **OPTIMIZATION: Stabilize gym ID to prevent unnecessary re-renders**
  const stableGymId = useMemo(() => gym?._id, [gym?._id]);
  
  // **OPTIMIZATION: Single expense query that gets all expense data**
  const expenseQuery = useQuery({
    queryKey: ["expenses", stableGymId],
    queryFn: async () => {
      if (!stableGymId) return [];
      const response = await axiosInstance.get(`/gym/expenses?gymId=${stableGymId}`);
      return response.data || [];
    },
    enabled: !!stableGymId,
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Prevent refetch on mount if data exists
    refetchInterval: false, // Disable automatic refetching
    retry: 1, // Reduce retry attempts
  });

  // **OPTIMIZATION: Stabilized queries with better deduplication**
  const queries = useQueries({
    queries: [
      {
        queryKey: ["dashboardMetrics"],
        queryFn: async () => {
          const response = await axios.get(`${API_URL}/dashboard`, {
            withCredentials: true,
          });
          return response.data.metrics;
        },
        staleTime: 30000, // 30 seconds
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false,
        retry: 1,
      },
      {
        queryKey: ["customers"],
        queryFn: async () => {
          const { customers } = await CustomerService.getCustomers({ 
            page: 1, 
            limit: 1000 // Reduced from 10000 to improve performance
          });
          return customers;
        },
        staleTime: 60000, // 1 minute
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false,
        retry: 1,
      }
    ]
  });

  const [dashboardQuery, customerQuery] = queries;

  // **OPTIMIZATION: Calculate expense metrics from single expense query with stable dependencies**
  const expenseMetrics = useMemo(() => {
    if (!expenseQuery.data || !Array.isArray(expenseQuery.data)) {
      return {
        monthlyExpense: 0,
        totalExpense: 0,
        todayExpense: 0
      };
    }

    const expenses = expenseQuery.data;
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    
    // Set today's date boundaries
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Filter and calculate all expense metrics in one pass
    let monthlyExpense = 0;
    let totalExpense = 0;
    let todayExpense = 0;

    expenses.forEach(expense => {
      if (expense.category === "Gym" || expense.category === "gym") {
        const expenseDate = new Date(expense.date);
        
        // Add to total
        totalExpense += expense.amount || 0;
        
        // Check if it's this month
        if (expenseDate.getMonth() + 1 === month && expenseDate.getFullYear() === year) {
          monthlyExpense += expense.amount || 0;
        }
        
        // Check if it's today
        if (expenseDate >= todayStart && expenseDate <= todayEnd) {
          todayExpense += expense.amount || 0;
        }
      }
    });

    return {
      monthlyExpense,
      totalExpense,
      todayExpense
    };
  }, [expenseQuery.data, expenseQuery.dataUpdatedAt]); // Added dataUpdatedAt for stability

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

  // **OPTIMIZATION: Simplified metrics object with stable dependencies**
  const metrics = useMemo(() => {
    const baseMetrics = dashboardQuery.data || defaultMetrics;
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
        todayExpense: expenseMetrics.todayExpense,
        totalExpense: expenseMetrics.totalExpense,
        totalMemberAmount: totalMemberAmount,
      }
    };
  }, [
    dashboardQuery.data, 
    dashboardQuery.dataUpdatedAt,
    memberMetrics, 
    memberBirthdays, 
    todayEnrolled, 
    expenseMetrics,
    totalMemberAmount
  ]); // Added dataUpdatedAt and stabilized dependencies

  // **OPTIMIZATION: Memoized profit calculations using computed expense metrics**
  const profitMetrics = useMemo(() => {
    const memberAmount = metrics.memberProfit.memberAmount || 0;
    const profitExpense = expenseMetrics.totalExpense || 0;
    const totalGymProfit = memberAmount - profitExpense;
    
    const totalPosAmount = metrics.pos.totalSell || 0;
    const totalPosExpense = metrics.pos.totalPosExpense || 0;
    const calculatedPosProfit = totalPosAmount - totalPosExpense;
    
    const overallTotalProfit = totalGymProfit + calculatedPosProfit;

    return {
      totalGymProfit,
      calculatedPosProfit,
      overallTotalProfit,
      profitExpense,
    };
  }, [metrics.memberProfit.memberAmount, metrics.pos.totalSell, metrics.pos.totalPosExpense, expenseMetrics.totalExpense]);

  // Fetch expiring personal training assignments
  const {
    data: expiringPTAssignments = [],
    isLoading: isLoadingPT,
    refetch: refetchPT
  } = useQuery({
    queryKey: ["expiringPTAssignments", stableGymId],
    queryFn: async () => {
      if (!stableGymId) return [];
      return await ApiService.getExpiringPersonalTrainingAssignments(stableGymId);
    },
    enabled: !!stableGymId,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    retry: 1,
  });

  // Memoize counts for today and next 7 days
  const { ptExpiringToday, ptExpiringIn7Days, ptExpiringTodayList, ptExpiringIn7DaysList } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    sevenDaysFromNow.setHours(23, 59, 59, 999);
    const ptToday: PersonalTrainingAssignment[] = [];
    const pt7Days: PersonalTrainingAssignment[] = [];
    for (const a of expiringPTAssignments) {
      const end = new Date(a.endDate);
      end.setHours(0, 0, 0, 0);
      if (end.getTime() === today.getTime()) ptToday.push(a);
      if (end > today && end <= sevenDaysFromNow) pt7Days.push(a);
    }
    return {
      ptExpiringToday: ptToday.length,
      ptExpiringIn7Days: pt7Days.length,
      ptExpiringTodayList: ptToday,
      ptExpiringIn7DaysList: pt7Days,
    };
  }, [expiringPTAssignments]);

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
    return dashboardQuery.isLoading || customerQuery.isLoading || expenseQuery.isLoading;
  }, [dashboardQuery.isLoading, customerQuery.isLoading, expenseQuery.isLoading]);

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

  if (isLoading) {
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
              value={metrics.members.totalMembers}
              icon={<Users />}
              isLoading={isLoading}
              delay={0.1}
            />
            <MetricCard
              title="Active Members"
              value={metrics.members.activeMembers}
              icon={<UserPlus />}
              isLoading={isLoading}
              delay={0.15}
            />
            <MetricCard
              title="Inactive Members"
              value={metrics.members.inactiveMembers}
              icon={<UserMinus />}
              isLoading={isLoading}
              delay={0.2}
              onClick={() => handleOpenModal("inactive")}
              className="cursor-pointer hover:shadow-lg transition"
            />
            <MetricCard
              title="Expiring in 7 Days"
              value={metrics.members.expiringIn7Days}
              icon={<AlertCircle />}
              isLoading={isLoading}
              delay={0.25}
              onClick={() => handleOpenModal("expiring")}
              className="cursor-pointer hover:shadow-lg transition"
            />
            <MetricCard
              title="Today Enrolled"
              value={metrics.members.todayEnrolled}
              icon={<UserPlus />}
              isLoading={isLoading}
              delay={0.3}
              onClick={() => handleOpenModal("todayEnrolled")}
              className="cursor-pointer hover:shadow-lg transition"
            />
            <MetricCard
              title="Total Member Amount"
              value={metrics.members.totalMemberAmount}
              icon={<DollarSign />}
              format="currency"
              isLoading={isLoading}
              delay={0.35}
            />
            <MetricCard
              title="Employee Birthdays"
              value={metrics.members.todayEmployeeBirthdays}
              icon={<Cake />}
              isLoading={isLoading}
              delay={0.4}
              onClick={() => handleOpenModal("employeeBirthdays")}
              className="cursor-pointer hover:shadow-lg transition"
            />
            <MetricCard
              title="Member Birthdays"
              value={metrics.members.todayMemberBirthdays}
              icon={<Gift />}
              isLoading={isLoading}
              delay={0.45}
              onClick={() => handleOpenModal("memberBirthdays")}
              className="cursor-pointer hover:shadow-lg transition"
            />
            <MetricCard
              title="PT Expiring Today"
              value={ptExpiringToday}
              icon={<AlertCircle />}
              isLoading={isLoadingPT}
              delay={0.26}
              onClick={() => handleOpenPTModal('today')}
              className="cursor-pointer hover:shadow-lg transition"
            />
            <MetricCard
              title="PT Expiring in 7 Days"
              value={ptExpiringIn7Days}
              icon={<AlertCircle />}
              isLoading={isLoadingPT}
              delay={0.27}
              onClick={() => handleOpenPTModal('7days')}
              className="cursor-pointer hover:shadow-lg transition"
            />

            <MetricCard
              title="Today Invoices"
              value={metrics.members.todayInvoices}
              icon={<BarChart3 />}
              isLoading={isLoading}
              delay={0.5}
            />
            <MetricCard
              title="Total Invoices"
              value={metrics.members.totalInvoices}
              icon={<BarChart3 />}
              isLoading={isLoading}
              delay={0.55}
            />
            <MetricCard
              title="Today Due Amount"
              value={metrics.members.todayDueAmount}
              icon={<AlertCircle />}
              format="currency"
              isLoading={isLoading}
              delay={0.6}
            />
            <MetricCard
              title="Today Expense"
              value={expenseMetrics.todayExpense}
              icon={<DollarSign />}
              format="currency"
              isLoading={expenseQuery.isLoading}
              delay={0.65}
            />
            <MetricCard
              title={`Monthly Expense (${format(new Date(), "MMMM yyyy")})`}
              value={expenseMetrics.monthlyExpense}
              icon={<Calendar />}
              format="currency"
              isLoading={expenseQuery.isLoading}
              delay={0.7}
            />
            <MetricCard
              title="Total Expense"
              value={expenseMetrics.totalExpense}
              icon={<TrendingUp />}
              format="currency"
              isLoading={expenseQuery.isLoading}
              delay={0.75}
            />
            <MetricCard
              title="Today Enquiry"
              value={metrics.members.todayEnquiry}
              icon={<Users />}
              isLoading={isLoading}
              delay={0.8}
              onClick={() => handleOpenModal("todayEnquiry")}
              className="cursor-pointer hover:shadow-lg transition"
            />
            <MetricCard
              title="Today Follow-Ups"
              value={metrics.members.todayFollowUps}
              icon={<Target />}
              isLoading={isLoading}
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
              value={metrics.memberProfit.memberAmount}
              format="currency"
              icon={<DollarSign />}
              isLoading={isLoading}
              delay={0.1}
            />
            <MetricCard
              title="Total Expenses"
              value={profitMetrics.profitExpense}
              format="currency"
              icon={<TrendingUp />}
              isLoading={expenseQuery.isLoading}
              delay={0.2}
            />
            <MetricCard
              title="Total Gym Profit"
              value={profitMetrics.totalGymProfit}
              format="currency"
              icon={<Target />}
              isLoading={isLoading || expenseQuery.isLoading}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <MetricCard
              title="Today Purchase"
              value={metrics.pos.todayPurchase}
              format="currency"
              icon={<ShoppingCart />}
              isLoading={isLoading}
              delay={0.1}
            />
            <MetricCard
              title="Total Purchase"
              value={metrics.pos.totalPurchase}
              format="currency"
              icon={<ShoppingCart />}
              isLoading={isLoading}
              delay={0.15}
            />
            <MetricCard
              title="Total Stock Value"
              value={metrics.pos.totalStockValue}
              format="currency"
              icon={<BarChart3 />}
              isLoading={isLoading}
              delay={0.2}
            />
            <MetricCard
              title="Low Stock Value"
              value={metrics.pos.lowStockValue}
              format="currency"
              icon={<AlertCircle />}
              isLoading={isLoading}
              delay={0.25}
            />
            <MetricCard
              title="Total Clearing Amount"
              value={metrics.pos.totalClearingAmount}
              format="currency"
              icon={<DollarSign />}
              isLoading={isLoading}
              delay={0.3}
            />
            <MetricCard
              title="Today Sell"
              value={metrics.pos.todaySell}
              format="currency"
              icon={<TrendingUp />}
              isLoading={isLoading}
              delay={0.35}
            />
            <MetricCard
              title="Total Sell"
              value={metrics.pos.totalSell}
              format="currency"
              icon={<TrendingUp />}
              isLoading={isLoading}
              delay={0.4}
            />
            <MetricCard
              title="Total Sell Purchase Value"
              value={metrics.pos.totalSellPurchaseValue}
              format="currency"
              icon={<BarChart3 />}
              isLoading={isLoading}
              delay={0.45}
            />
            <MetricCard
              title="Today Sell Invoice"
              value={metrics.pos.todaySellInvoice}
              icon={<BarChart3 />}
              isLoading={isLoading}
              delay={0.5}
            />
            <MetricCard
              title="Total Sell Invoice"
              value={metrics.pos.totalSellInvoice}
              icon={<BarChart3 />}
              isLoading={isLoading}
              delay={0.55}
            />
            <MetricCard
              title="Sell Due Amount"
              value={metrics.pos.sellDueAmount}
              format="currency"
              icon={<AlertCircle />}
              isLoading={isLoading}
              delay={0.6}
            />
            <MetricCard
              title="Total POS Expense"
              value={metrics.pos.totalPosExpense}
              format="currency"
              icon={<DollarSign />}
              isLoading={isLoading}
              delay={0.65}
            />
            <MetricCard
              title="Today POS Expense"
              value={metrics.pos.todayPosExpense}
              format="currency"
              icon={<DollarSign />}
              isLoading={isLoading}
              delay={0.7}
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
              value={metrics.pos.totalSell}
              format="currency"
              icon={<DollarSign />}
              isLoading={isLoading}
              delay={0.1}
            />
            <MetricCard
              title="Total POS Expense"
              value={metrics.pos.totalPosExpense}
              format="currency"
              icon={<TrendingUp />}
              isLoading={isLoading}
              delay={0.2}
            />
            <MetricCard
              title="Total POS Profit"
              value={profitMetrics.calculatedPosProfit}
              format="currency"
              icon={<Target />}
              isLoading={isLoading}
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
          {((ptModalType === 'today' ? ptExpiringTodayList : ptExpiringIn7DaysList).length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              No expiring personal training assignments found.
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2">Member</th>
                    <th className="text-left p-2">Trainer</th>
                    <th className="text-left p-2">End Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(ptModalType === 'today' ? ptExpiringTodayList : ptExpiringIn7DaysList).map((a) => (
                    <tr key={a._id} className="border-b">
                      <td className="p-2">{a.customerId?.name || '-'}</td>
                      <td className="p-2">{a.trainerId?.name || '-'}</td>
                      <td className="p-2">{a.endDate ? new Date(a.endDate).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Dashboard;