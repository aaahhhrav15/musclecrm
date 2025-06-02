import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Default data for metrics
const defaultMetrics = {
  members: {
    totalMembers: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    todayEmployees: 0,
    todayExpiry: 0,
    expiredPackages: 0,
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
    todayFollowUps: 0
  },
  memberProfit: {
    memberAmount: 0,
    memberExpense: 0,
    totalMemberProfit: 0
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
    todayPosExpense: 0
  },
  posProfit: {
    posProfit: 0,
    posExpense: 0
  },
  overallProfit: {
    totalProfit: 0
  }
};

const Dashboard: React.FC = () => {
  // Fetch total members count
  const { data: totalMembersData, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['totalMembers'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/customers/count`, {
        withCredentials: true
      });
      return response.data;
    }
  });

  // Using default metrics but updating totalMembers with fetched data
  const metrics = {
    ...defaultMetrics,
    members: {
      ...defaultMetrics.members,
      totalMembers: totalMembersData?.count || 0
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Members Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">🔹 Members</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <MetricCard 
              title="Total Member" 
              value={metrics.members.totalMembers} 
              isLoading={isLoadingMembers}
            />
            <MetricCard title="Total Active Member" value={metrics.members.activeMembers} />
            <MetricCard title="Total InActive Member" value={metrics.members.inactiveMembers} />
            <MetricCard title="Today Employees" value={metrics.members.todayEmployees} />
            <MetricCard title="Today Expiry" value={metrics.members.todayExpiry} />
            <MetricCard title="All Expire Package" value={metrics.members.expiredPackages} />
            <MetricCard title="Today Enrolled" value={metrics.members.todayEnrolled} />
            <MetricCard title="Total Member Amount" value={metrics.members.totalMemberAmount} format="currency" />
            <MetricCard title="Today Employee's Birthdays" value={metrics.members.todayEmployeeBirthdays} />
            <MetricCard title="Today Invoices" value={metrics.members.todayInvoices} />
            <MetricCard title="Total Invoices" value={metrics.members.totalInvoices} />
            <MetricCard title="Today Due Amount" value={metrics.members.todayDueAmount} format="currency" />
            <MetricCard title="Today Member's Birthdays" value={metrics.members.todayMemberBirthdays} />
            <MetricCard title="Today Expense" value={metrics.members.todayExpense} format="currency" />
            <MetricCard title="Total Expense" value={metrics.members.totalExpense} format="currency" />
            <MetricCard title="Today Enquiry" value={metrics.members.todayEnquiry} />
            <MetricCard title="Today Follow-Ups" value={metrics.members.todayFollowUps} />
          </div>
        </section>

        {/* Member Profit Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">🔹 Member Profit</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard title="Member Amount" value={metrics.memberProfit.memberAmount} format="currency" />
            <MetricCard title="Member Expense" value={metrics.memberProfit.memberExpense} format="currency" />
            <MetricCard title="Total Member Profit" value={metrics.memberProfit.totalMemberProfit} format="currency" />
          </div>
        </section>

        {/* POS Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">🔹 POS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <MetricCard title="Today Purchase" value={metrics.pos.todayPurchase} format="currency" />
            <MetricCard title="Total Purchase" value={metrics.pos.totalPurchase} format="currency" />
            <MetricCard title="Total Stock Value" value={metrics.pos.totalStockValue} format="currency" />
            <MetricCard title="Low Stock Value" value={metrics.pos.lowStockValue} format="currency" />
            <MetricCard title="Total Clearing Amount" value={metrics.pos.totalClearingAmount} format="currency" />
            <MetricCard title="Today Sell" value={metrics.pos.todaySell} format="currency" />
            <MetricCard title="Total Sell" value={metrics.pos.totalSell} format="currency" />
            <MetricCard title="Total Sell Purchase Value" value={metrics.pos.totalSellPurchaseValue} format="currency" />
            <MetricCard title="Today Sell Invoice" value={metrics.pos.todaySellInvoice} />
            <MetricCard title="Total Sell Invoice" value={metrics.pos.totalSellInvoice} />
            <MetricCard title="Sell Due Amount" value={metrics.pos.sellDueAmount} format="currency" />
            <MetricCard title="Total Pos Expense" value={metrics.pos.totalPosExpense} format="currency" />
            <MetricCard title="Today Pos Expense" value={metrics.pos.todayPosExpense} format="currency" />
          </div>
        </section>

        {/* POS Profit Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">🔹 POS Profit</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard title="POS Profit" value={metrics.posProfit.posProfit} format="currency" />
            <MetricCard title="POS Expense" value={metrics.posProfit.posExpense} format="currency" />
          </div>
        </section>

        {/* Overall Profit Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">🔹 Overall Profit</h2>
          <div className="grid grid-cols-1 gap-4">
            <MetricCard title="Total Profit" value={metrics.overallProfit.totalProfit} format="currency" />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

interface MetricCardProps {
  title: string;
  value?: number;
  format?: 'number' | 'currency';
  isLoading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value = 0, 
  format = 'number',
  isLoading = false 
}) => {
  const formattedValue = format === 'currency' 
    ? formatCurrency(value)
    : value.toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
            ) : (
              formattedValue
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Dashboard;
