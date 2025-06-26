import * as React from "react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
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

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://flexcrm-ui-suite-production.up.railway.app/api";

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

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  format = "number",
  isLoading,
  gradientFrom = "blue-500",
  gradientTo = "blue-600",
  iconColor = "blue-600",
  delay = 0,
  onClick,
  className,
}) => {
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
        <div
          className={`absolute inset-0 bg-gradient-to-br from-${gradientFrom}/10 to-${gradientTo}/5`}
        />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div
            className={`h-10 w-10 rounded-full bg-${gradientFrom}/10 flex items-center justify-center`}
          >
            {React.cloneElement(icon as React.ReactElement, {
              className: `h-5 w-5 text-${iconColor}`,
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
                    typeof value === "string" ? parseFloat(value) : value
                  )
                : typeof value === "string"
                ? value
                : value.toLocaleString()}
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
};

// Default metrics data
const defaultMetrics = {
  members: {
    totalMembers: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    todayExpiry: 0,
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
    posExpense: 0,
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

type ModalType =
  | "memberBirthdays"
  | "employeeBirthdays"
  | "expiring"
  | "inactive"
  | "todayEnrolled"
  | "todayEnquiry"
  | "todayFollowUps";

const Dashboard: React.FC = () => {
  // Fetch dashboard metrics
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboardMetrics"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/dashboard`, {
        withCredentials: true,
      });
      return response.data.metrics;
    },
  });

  // Fetch customer data directly to ensure accurate member counts
  const { data: customerData } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { customers } = await CustomerService.getCustomers({ page: 1, limit: 10000 });
      return customers;
    },
  });

  // Helper functions for filtering (copied from CustomersPage)
  const calculateExpiryDate = (customer: Customer) => {
    if (!customer.membershipStartDate || !customer.membershipDuration) return null;
    const startDate = new Date(customer.membershipStartDate);
    return addMonths(startDate, customer.membershipDuration);
  };

  const isCustomerExpired = (customer: Customer) => {
    const expiryDate = calculateExpiryDate(customer);
    if (!expiryDate) return false;
    return new Date() > expiryDate;
  };

  // Calculate member metrics from customer data
  const memberMetrics = React.useMemo(() => {
    if (!customerData) return {
      totalMembers: 0,
      activeMembers: 0,
      inactiveMembers: 0,
      expiringToday: 0,
    };

    const totalMembers = customerData.length;

    // Active: membershipEndDate is today or in the future
    const activeMembers = customerData.filter(c => {
      if (!c.membershipEndDate) return false;
      const endDate = new Date(c.membershipEndDate);
      const today = new Date();
      // Set time to 00:00:00 for both dates to compare only the date part
      endDate.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      return endDate >= today;
    }).length;

    // Inactive: membershipEndDate is before today or missing
    const inactiveMembers = customerData.filter(c => {
      if (!c.membershipEndDate) return true;
      const endDate = new Date(c.membershipEndDate);
      const today = new Date();
      endDate.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      return endDate < today;
    }).length;

    // Expiring today: expiry date is today
    const expiringToday = customerData.filter(c => {
      if (!c.membershipEndDate) return false;
      const endDate = new Date(c.membershipEndDate);
      const today = new Date();
      endDate.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      return endDate.getTime() === today.getTime();
    }).length;

    return {
      totalMembers,
      activeMembers,
      inactiveMembers,
      expiringToday,
    };
  }, [customerData]);

  const metrics = dashboardData || defaultMetrics;

  // Override member metrics with calculated values from customer data
  const finalMetrics = {
    ...metrics,
    members: {
      ...metrics.members,
      totalMembers: memberMetrics.totalMembers,
      activeMembers: memberMetrics.activeMembers,
      inactiveMembers: memberMetrics.inactiveMembers,
      todayExpiry: memberMetrics.expiringToday,
    }
  };

  // --- Monthly Expense Logic ---
  const { gym } = useGym();
  const [monthlyExpense, setMonthlyExpense] = useState<number>(0);
  const [isMonthlyExpenseLoading, setIsMonthlyExpenseLoading] = useState(false);
  const [todayExpense, setTodayExpense] = useState<number>(0);
  const [isTodayExpenseLoading, setIsTodayExpenseLoading] = useState(false);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [isTotalExpenseLoading, setIsTotalExpenseLoading] = useState(false);
  const [profitExpense, setProfitExpense] = useState<number>(0);
  const [isProfitExpenseLoading, setIsProfitExpenseLoading] = useState(false);
  const [totalGymProfit, setTotalGymProfit] = useState<number>(0);

  useEffect(() => {
    const fetchTodayExpense = async () => {
      if (!gym?._id) return;
      setIsTodayExpenseLoading(true);
      try {
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        // Fetch all expenses for today
        const response = await axiosInstance.get(
          `/gym/expenses?gymId=${gym._id}&month=${month}&year=${year}`
        );
        const expenses = Array.isArray(response.data) ? response.data : [];
        const todayStr = today.toISOString().slice(0, 10);
        const total = expenses
          .filter(
            (e) =>
              e.date && e.date.slice(0, 10) === todayStr && e.category === "gym"
          )
          .reduce((sum, expense) => sum + (expense.amount || 0), 0);
        setTodayExpense(total);
      } catch (error) {
        setTodayExpense(0);
      } finally {
        setIsTodayExpenseLoading(false);
      }
    };
    fetchTodayExpense();
  }, [gym]);

  useEffect(() => {
    const fetchMonthlyExpense = async () => {
      if (!gym?._id) return;
      setIsMonthlyExpenseLoading(true);
      try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const response = await axiosInstance.get(
          `/gym/expenses?gymId=${gym._id}&month=${month}&year=${year}`
        );
        const total = Array.isArray(response.data)
          ? response.data
              .filter((e) => e.category === "gym")
              .reduce((sum, expense) => sum + (expense.amount || 0), 0)
          : 0;
        setMonthlyExpense(total);
      } catch (error) {
        setMonthlyExpense(0);
      } finally {
        setIsMonthlyExpenseLoading(false);
      }
    };
    fetchMonthlyExpense();
  }, [gym]);

  useEffect(() => {
    const fetchTotalExpense = async () => {
      if (!gym?._id) return;
      setIsTotalExpenseLoading(true);
      try {
        // Fetch all expenses for this gym
        const response = await axiosInstance.get(
          `/gym/expenses?gymId=${gym._id}`
        );
        const expenses = Array.isArray(response.data) ? response.data : [];
        const total = expenses
          .filter((e) => e.category === "gym")
          .reduce((sum, expense) => sum + (expense.amount || 0), 0);
        setTotalExpense(total);
      } catch (error) {
        setTotalExpense(0);
      } finally {
        setIsTotalExpenseLoading(false);
      }
    };
    fetchTotalExpense();
  }, [gym]);

  useEffect(() => {
    const fetchProfitExpense = async () => {
      if (!gym?._id) return;
      setIsProfitExpenseLoading(true);
      try {
        // Fetch all expenses for this gym
        const response = await axiosInstance.get(
          `/gym/expenses?gymId=${gym._id}`
        );
        const expenses = Array.isArray(response.data) ? response.data : [];
        const total = expenses
          .filter((e) => e.category === "gym")
          .reduce((sum, expense) => sum + (expense.amount || 0), 0);
        setProfitExpense(total);
      } catch (error) {
        setProfitExpense(0);
      } finally {
        setIsProfitExpenseLoading(false);
      }
    };
    fetchProfitExpense();
  }, [gym]);

  // Calculate total gym profit whenever member amount or expenses change
  useEffect(() => {
    const memberAmount = metrics.memberProfit.memberAmount || 0;
    const calculatedProfit = memberAmount - profitExpense;
    setTotalGymProfit(calculatedProfit);
  }, [metrics.memberProfit.memberAmount, profitExpense]);

  // Calculate POS metrics
  const totalPosAmount = metrics.pos.totalSell || 0;
  const totalPosExpense = metrics.pos.totalPosExpense || 0;
  const calculatedPosProfit = totalPosAmount - totalPosExpense;

  // Calculate overall profit
  const overallTotalProfit = totalGymProfit + calculatedPosProfit;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [modalData, setModalData] = useState<Customer[] | Staff[] | Lead[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const handleOpenModal = async (type: ModalType) => {
    setModalType(type);
    setModalOpen(true);
    setModalLoading(true);
    let data: Customer[] | Staff[] | Lead[] = [];
    try {
      if (type === "memberBirthdays") {
        const today = new Date();
        const { customers, total } = await CustomerService.getCustomers({ page: 1, limit: 10000 });
        data = customers.filter((c) => {
          if (!c.birthday) return false;
          const bday = new Date(c.birthday);
          return (
            bday.getDate() === today.getDate() &&
            bday.getMonth() === today.getMonth()
          );
        });
        if (data.length > 0) {
          console.log("DEBUG memberBirthdays data:", data[0]);
        }
      } else if (type === "employeeBirthdays") {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const response = await api.get("/gym/staff");
        data = (response.data.data || []).filter(
          (s: Staff) =>
            s.dateOfBirth && s.dateOfBirth.slice(5, 10) === `${month}-${day}`
        );
      } else if (type === "expiring") {
        // Fetch all customers for expiring modal
        let allCustomers: Customer[] = [];
        let page = 1;
        const pageSize = 100;
        let total = 0;
        do {
          const { customers, total: t } = await CustomerService.getCustomers({ page, limit: pageSize });
          allCustomers = allCustomers.concat(customers);
          total = t;
          page++;
        } while (allCustomers.length < total);
        const todayStr = new Date().toISOString().slice(0, 10);
        data = allCustomers.filter(
          (c) =>
            c.membershipEndDate && c.membershipEndDate.slice(0, 10) === todayStr
        );
      } else if (type === "inactive") {
        // Fetch all customers for inactive modal
        let allCustomers: Customer[] = [];
        let page = 1;
        const pageSize = 100;
        let total = 0;
        do {
          const { customers, total: t } = await CustomerService.getCustomers({ page, limit: pageSize });
          allCustomers = allCustomers.concat(customers);
          total = t;
          page++;
        } while (allCustomers.length < total);
        data = allCustomers.filter(
          (c) => !c.membershipType || c.membershipType === "none" || c.membershipType === "inactive" || (c.membershipEndDate && new Date(c.membershipEndDate) < new Date())
        );
      } else if (type === "todayEnrolled") {
        const today = new Date();
        const { customers, total } = await CustomerService.getCustomers({ page: 1, limit: 10000 });
        data = customers.filter((c) => {
          if (!c.joinDate) return false;
          const join = new Date(c.joinDate);
          return (
            join.getDate() === today.getDate() &&
            join.getMonth() === today.getMonth() &&
            join.getFullYear() === today.getFullYear()
          );
        });
        if (data.length > 0) {
          console.log("DEBUG todayEnrolled data:", data[0]);
        }
      } else if (type === "todayEnquiry") {
        const today = new Date();
        const response = await axiosInstance.get("/leads");
        const leads = response.data as Lead[];
        data = leads.filter((l) => {
          if (!l.createdAt) return false;
          const created = new Date(l.createdAt);
          return (
            created.getDate() === today.getDate() &&
            created.getMonth() === today.getMonth() &&
            created.getFullYear() === today.getFullYear()
          );
        });
      } else if (type === "todayFollowUps") {
        const today = new Date();
        const response = await axiosInstance.get("/leads");
        const leads = response.data as Lead[];
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
    } catch (e) {
      data = [];
    }
    setModalData(data);
    setModalLoading(false);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setModalType(null);
    setModalData([]);
  };

  function isStaff(item: Customer | Staff | Lead): item is Staff {
    return (item as Staff).position !== undefined && !(item as Lead).source;
  }
  function isCustomer(item: Customer | Staff | Lead): item is Customer {
    return (
      typeof (item as Customer).id === "string" &&
      typeof (item as Customer).email === "string"
    );
  }

  function hasFollowUpDate(
    c: unknown
  ): c is Customer & { followUpDate: string } {
    return typeof (c as { followUpDate?: string }).followUpDate === "string";
  }

  function isLead(item: Customer | Staff | Lead): item is Lead {
    return (
      (item as Lead).source !== undefined &&
      (item as Lead).createdAt !== undefined &&
      (item as Lead)._id !== undefined
    );
  }

  function getModalRowKey(item: Customer | Staff | Lead): string {
    if (isCustomer(item) && item.id) return item.id;
    if (isStaff(item) && item._id) return item._id;
    if (isLead(item) && item._id) return item._id;
    // Fallback: use name + Math.random() to guarantee uniqueness if no id
    return `${item.name || "unknown"}-${Math.random()}`;
  }

  useEffect(() => {
    if (
      (modalType === "todayEnrolled" || modalType === "memberBirthdays") &&
      modalData.length > 0
    ) {
      console.log("DEBUG modalData:", modalData[0]);
    }
  }, [modalType, modalData]);

  if (isLoading) {
    return (
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
    );
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
              value={finalMetrics.members.totalMembers}
              icon={<Users />}
              isLoading={isLoading}
              gradientFrom="blue-500"
              gradientTo="blue-600"
              iconColor="blue-600"
              delay={0.1}
            />
            <MetricCard
              title="Active Members"
              value={finalMetrics.members.activeMembers}
              icon={<UserPlus />}
              isLoading={isLoading}
              gradientFrom="green-500"
              gradientTo="green-600"
              iconColor="green-600"
              delay={0.15}
            />
            <MetricCard
              title="Inactive Members"
              value={finalMetrics.members.inactiveMembers}
              icon={<UserMinus />}
              isLoading={isLoading}
              gradientFrom="red-500"
              gradientTo="red-600"
              iconColor="red-600"
              delay={0.2}
              onClick={() => handleOpenModal("inactive")}
              className="cursor-pointer hover:shadow-lg transition"
            />
            <MetricCard
              title="Today's Expiring"
              value={metrics.members.todayExpiry}
              icon={<AlertCircle />}
              isLoading={isLoading}
              gradientFrom="orange-500"
              gradientTo="orange-600"
              iconColor="orange-600"
              delay={0.25}
              onClick={() => handleOpenModal("expiring")}
              className="cursor-pointer hover:shadow-lg transition"
            />
            <MetricCard
              title="Today Enrolled"
              value={metrics.members.todayEnrolled}
              icon={<UserPlus />}
              isLoading={isLoading}
              gradientFrom="emerald-500"
              gradientTo="emerald-600"
              iconColor="emerald-600"
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
              gradientFrom="purple-500"
              gradientTo="purple-600"
              iconColor="purple-600"
              delay={0.35}
            />
            <MetricCard
              title="Employee Birthdays"
              value={metrics.members.todayEmployeeBirthdays}
              icon={<Cake />}
              isLoading={isLoading}
              gradientFrom="pink-500"
              gradientTo="pink-600"
              iconColor="pink-600"
              delay={0.4}
              onClick={() => handleOpenModal("employeeBirthdays")}
              className="cursor-pointer hover:shadow-lg transition"
            />
            <MetricCard
              title="Member Birthdays"
              value={metrics.members.todayMemberBirthdays}
              icon={<Gift />}
              isLoading={isLoading}
              gradientFrom="indigo-500"
              gradientTo="indigo-600"
              iconColor="indigo-600"
              delay={0.45}
              onClick={() => handleOpenModal("memberBirthdays")}
              className="cursor-pointer hover:shadow-lg transition"
            />
            <MetricCard
              title="Today Invoices"
              value={metrics.members.todayInvoices}
              icon={<BarChart3 />}
              isLoading={isLoading}
              gradientFrom="cyan-500"
              gradientTo="cyan-600"
              iconColor="cyan-600"
              delay={0.5}
            />
            <MetricCard
              title="Total Invoices"
              value={metrics.members.totalInvoices}
              icon={<BarChart3 />}
              isLoading={isLoading}
              gradientFrom="teal-500"
              gradientTo="teal-600"
              iconColor="teal-600"
              delay={0.55}
            />
            <MetricCard
              title="Today Due Amount"
              value={metrics.members.todayDueAmount}
              icon={<AlertCircle />}
              format="currency"
              isLoading={isLoading}
              gradientFrom="amber-500"
              gradientTo="amber-600"
              iconColor="amber-600"
              delay={0.6}
            />
            <MetricCard
              title="Today Expense"
              value={todayExpense}
              icon={<DollarSign />}
              format="currency"
              isLoading={isTodayExpenseLoading}
              gradientFrom="slate-500"
              gradientTo="slate-600"
              iconColor="slate-600"
              delay={0.65}
            />
            <MetricCard
              title={`Monthly Expense (${format(new Date(), "MMMM yyyy")})`}
              value={monthlyExpense}
              icon={<Calendar />}
              format="currency"
              isLoading={isMonthlyExpenseLoading}
              gradientFrom="violet-500"
              gradientTo="violet-600"
              iconColor="violet-600"
              delay={0.7}
            />
            <MetricCard
              title="Total Expense"
              value={totalExpense}
              icon={<TrendingUp />}
              format="currency"
              isLoading={isTotalExpenseLoading}
              gradientFrom="rose-500"
              gradientTo="rose-600"
              iconColor="rose-600"
              delay={0.75}
            />
            <MetricCard
              title="Today Enquiry"
              value={metrics.members.todayEnquiry}
              icon={<Users />}
              isLoading={isLoading}
              gradientFrom="lime-500"
              gradientTo="lime-600"
              iconColor="lime-600"
              delay={0.8}
              onClick={() => handleOpenModal("todayEnquiry")}
              className="cursor-pointer hover:shadow-lg transition"
            />
            <MetricCard
              title="Today Follow-Ups"
              value={metrics.members.todayFollowUps}
              icon={<Target />}
              isLoading={isLoading}
              gradientFrom="sky-500"
              gradientTo="sky-600"
              iconColor="sky-600"
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
              gradientFrom="emerald-500"
              gradientTo="emerald-600"
              iconColor="emerald-600"
              delay={0.1}
            />
            <MetricCard
              title="Total Expenses"
              value={profitExpense}
              format="currency"
              icon={<TrendingUp />}
              isLoading={isProfitExpenseLoading}
              gradientFrom="red-500"
              gradientTo="red-600"
              iconColor="red-600"
              delay={0.2}
            />
            <MetricCard
              title="Total Gym Profit"
              value={totalGymProfit}
              format="currency"
              icon={<Target />}
              isLoading={isLoading || isProfitExpenseLoading}
              gradientFrom="green-500"
              gradientTo="green-600"
              iconColor="green-600"
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
              gradientFrom="blue-500"
              gradientTo="blue-600"
              iconColor="blue-600"
              delay={0.1}
            />
            <MetricCard
              title="Total Purchase"
              value={metrics.pos.totalPurchase}
              format="currency"
              icon={<ShoppingCart />}
              isLoading={isLoading}
              gradientFrom="indigo-500"
              gradientTo="indigo-600"
              iconColor="indigo-600"
              delay={0.15}
            />
            <MetricCard
              title="Total Stock Value"
              value={metrics.pos.totalStockValue}
              format="currency"
              icon={<BarChart3 />}
              isLoading={isLoading}
              gradientFrom="green-500"
              gradientTo="green-600"
              iconColor="green-600"
              delay={0.2}
            />
            <MetricCard
              title="Low Stock Value"
              value={metrics.pos.lowStockValue}
              format="currency"
              icon={<AlertCircle />}
              isLoading={isLoading}
              gradientFrom="orange-500"
              gradientTo="orange-600"
              iconColor="orange-600"
              delay={0.25}
            />
            <MetricCard
              title="Total Clearing Amount"
              value={metrics.pos.totalClearingAmount}
              format="currency"
              icon={<DollarSign />}
              isLoading={isLoading}
              gradientFrom="purple-500"
              gradientTo="purple-600"
              iconColor="purple-600"
              delay={0.3}
            />
            <MetricCard
              title="Today Sell"
              value={metrics.pos.todaySell}
              format="currency"
              icon={<TrendingUp />}
              isLoading={isLoading}
              gradientFrom="emerald-500"
              gradientTo="emerald-600"
              iconColor="emerald-600"
              delay={0.35}
            />
            <MetricCard
              title="Total Sell"
              value={metrics.pos.totalSell}
              format="currency"
              icon={<TrendingUp />}
              isLoading={isLoading}
              gradientFrom="teal-500"
              gradientTo="teal-600"
              iconColor="teal-600"
              delay={0.4}
            />
            <MetricCard
              title="Total Sell Purchase Value"
              value={metrics.pos.totalSellPurchaseValue}
              format="currency"
              icon={<BarChart3 />}
              isLoading={isLoading}
              gradientFrom="cyan-500"
              gradientTo="cyan-600"
              iconColor="cyan-600"
              delay={0.45}
            />
            <MetricCard
              title="Today Sell Invoice"
              value={metrics.pos.todaySellInvoice}
              icon={<BarChart3 />}
              isLoading={isLoading}
              gradientFrom="pink-500"
              gradientTo="pink-600"
              iconColor="pink-600"
              delay={0.5}
            />
            <MetricCard
              title="Total Sell Invoice"
              value={metrics.pos.totalSellInvoice}
              icon={<BarChart3 />}
              isLoading={isLoading}
              gradientFrom="rose-500"
              gradientTo="rose-600"
              iconColor="rose-600"
              delay={0.55}
            />
            <MetricCard
              title="Sell Due Amount"
              value={metrics.pos.sellDueAmount}
              format="currency"
              icon={<AlertCircle />}
              isLoading={isLoading}
              gradientFrom="amber-500"
              gradientTo="amber-600"
              iconColor="amber-600"
              delay={0.6}
            />
            <MetricCard
              title="Total POS Expense"
              value={metrics.pos.totalPosExpense}
              format="currency"
              icon={<DollarSign />}
              isLoading={isLoading}
              gradientFrom="slate-500"
              gradientTo="slate-600"
              iconColor="slate-600"
              delay={0.65}
            />
            <MetricCard
              title="Today POS Expense"
              value={metrics.pos.todayPosExpense}
              format="currency"
              icon={<DollarSign />}
              isLoading={isLoading}
              gradientFrom="gray-500"
              gradientTo="gray-600"
              iconColor="gray-600"
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
              value={totalPosAmount}
              format="currency"
              icon={<DollarSign />}
              isLoading={isLoading}
              gradientFrom="blue-500"
              gradientTo="blue-600"
              iconColor="blue-600"
              delay={0.1}
            />
            <MetricCard
              title="Total POS Expense"
              value={totalPosExpense}
              format="currency"
              icon={<TrendingUp />}
              isLoading={isLoading}
              gradientFrom="red-500"
              gradientTo="red-600"
              iconColor="red-600"
              delay={0.2}
            />
            <MetricCard
              title="Total POS Profit"
              value={calculatedPosProfit}
              format="currency"
              icon={<Target />}
              isLoading={isLoading}
              gradientFrom="green-500"
              gradientTo="green-600"
              iconColor="green-600"
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
              value={overallTotalProfit}
              format="currency"
              icon={<Target />}
              isLoading={isLoading}
              gradientFrom="emerald-500"
              gradientTo="emerald-600"
              iconColor="emerald-600"
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
                ? "Today's Expiring Memberships"
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
                          <td className="p-2">{item.email || "-"}</td>
                          <td className="p-2">{item.phone || "-"}</td>
                          <td className="p-2">{item.membershipEndDate ? new Date(item.membershipEndDate).toLocaleDateString() : "-"}</td>
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
                        <td className="p-2">{isCustomer(item) ? item.email || "-" : isStaff(item) ? item.email || "-" : "-"}</td>
                        <td className="p-2">{isCustomer(item) ? item.phone || "-" : isStaff(item) ? item.phone || "-" : "-"}</td>
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
    </DashboardLayout>
  );
};

export default Dashboard;
