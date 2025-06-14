import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Users, UserCheck, UserX, CalendarClock, Plus, UserPlus, UserMinus, Calendar, DollarSign, ShoppingCart, TrendingUp, Cake, Gift } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useIndustry } from '@/context/IndustryContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface MetricCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  format?: 'number' | 'currency';
  isLoading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, format = 'number', isLoading }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 w-24 animate-pulse bg-muted rounded" />
        ) : (
          <div className="text-2xl font-bold">
            {format === 'currency' ? formatCurrency(value) : value.toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
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
  // Fetch dashboard metrics
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/dashboard`, {
        withCredentials: true
      });
      return response.data.metrics;
    }
  });

  const metrics = dashboardData || defaultMetrics;

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>

        <div className="grid gap-6">
          {/* Members Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Members</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Members"
                value={dashboardData?.members?.totalMembers || 0}
                icon={<Users className="h-4 w-4" />}
                isLoading={isLoading}
              />
              <MetricCard
                title="Active Members"
                value={dashboardData?.members?.activeMembers || 0}
                icon={<UserPlus className="h-4 w-4" />}
                isLoading={isLoading}
              />
              <MetricCard
                title="Inactive Members"
                value={dashboardData?.members?.inactiveMembers || 0}
                icon={<UserMinus className="h-4 w-4" />}
                isLoading={isLoading}
              />
              <MetricCard
                title="Today's Expiring"
                value={dashboardData?.members?.todayExpiry || 0}
                icon={<Calendar className="h-4 w-4" />}
                isLoading={isLoading}
              />
              <MetricCard
                title="Today Enrolled"
                value={dashboardData?.members?.todayEnrolled || 0}
                icon={<UserPlus className="h-4 w-4" />}
                isLoading={isLoading}
              />
              <MetricCard
                title="Total Member Amount"
                value={formatCurrency(dashboardData?.members?.totalMemberAmount || 0)}
                icon={<DollarSign className="h-4 w-4" />}
                isLoading={isLoading}
              />
              <MetricCard
                title="Today Employee's Birthdays"
                value={dashboardData?.members?.todayEmployeeBirthdays || 0}
                icon={<Cake className="h-4 w-4" />}
                isLoading={isLoading}
              />
              <MetricCard
                title="Today Member's Birthdays"
                value={dashboardData?.members?.todayMemberBirthdays || 0}
                icon={<Gift className="h-4 w-4" />}
                isLoading={isLoading}
              />
              <MetricCard
                title="Today Invoices"
                value={dashboardData?.members?.todayInvoices || 0}
                icon={<DollarSign className="h-4 w-4" />}
                isLoading={isLoading}
              />
              <MetricCard
                title="Total Invoices"
                value={dashboardData?.members?.totalInvoices || 0}
                icon={<DollarSign className="h-4 w-4" />}
                isLoading={isLoading}
              />
              <MetricCard
                title="Today Due Amount"
                value={formatCurrency(dashboardData?.members?.todayDueAmount || 0)}
                icon={<DollarSign className="h-4 w-4" />}
                isLoading={isLoading}
              />
              <MetricCard
                title="Today Expense"
                value={formatCurrency(dashboardData?.members?.todayExpense || 0)}
                icon={<DollarSign className="h-4 w-4" />}
                isLoading={isLoading}
              />
              <MetricCard
                title="Total Expense"
                value={formatCurrency(dashboardData?.members?.totalExpense || 0)}
                icon={<DollarSign className="h-4 w-4" />}
                isLoading={isLoading}
              />
              <MetricCard
                title="Today Enquiry"
                value={dashboardData?.members?.todayEnquiry || 0}
                icon={<Users className="h-4 w-4" />}
                isLoading={isLoading}
              />
              <MetricCard
                title="Today Follow-Ups"
                value={dashboardData?.members?.todayFollowUps || 0}
                icon={<Users className="h-4 w-4" />}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Member Profit Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">🔹 Member Profit</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard 
                title="Member Amount" 
                value={metrics.memberProfit.memberAmount} 
                format="currency"
                isLoading={isLoading}
              />
              <MetricCard 
                title="Member Expense" 
                value={metrics.memberProfit.memberExpense} 
                format="currency"
                isLoading={isLoading}
              />
              <MetricCard 
                title="Total Member Profit" 
                value={metrics.memberProfit.totalMemberProfit} 
                format="currency"
                isLoading={isLoading}
              />
            </div>
          </section>

          {/* POS Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">🔹 POS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <MetricCard 
                title="Today Purchase" 
                value={metrics.pos.todayPurchase} 
                format="currency"
                isLoading={isLoading}
              />
              <MetricCard 
                title="Total Purchase" 
                value={metrics.pos.totalPurchase} 
                format="currency"
                isLoading={isLoading}
              />
              <MetricCard 
                title="Total Stock Value" 
                value={metrics.pos.totalStockValue} 
                format="currency"
                isLoading={isLoading}
              />
              <MetricCard 
                title="Low Stock Value" 
                value={metrics.pos.lowStockValue} 
                format="currency"
                isLoading={isLoading}
              />
              <MetricCard 
                title="Total Clearing Amount" 
                value={metrics.pos.totalClearingAmount} 
                format="currency"
                isLoading={isLoading}
              />
              <MetricCard 
                title="Today Sell" 
                value={metrics.pos.todaySell} 
                format="currency"
                isLoading={isLoading}
              />
              <MetricCard 
                title="Total Sell" 
                value={metrics.pos.totalSell} 
                format="currency"
                isLoading={isLoading}
              />
              <MetricCard 
                title="Total Sell Purchase Value" 
                value={metrics.pos.totalSellPurchaseValue} 
                format="currency"
                isLoading={isLoading}
              />
              <MetricCard 
                title="Today Sell Invoice" 
                value={metrics.pos.todaySellInvoice} 
                isLoading={isLoading}
              />
              <MetricCard 
                title="Total Sell Invoice" 
                value={metrics.pos.totalSellInvoice} 
                isLoading={isLoading}
              />
              <MetricCard 
                title="Sell Due Amount" 
                value={metrics.pos.sellDueAmount} 
                format="currency"
                isLoading={isLoading}
              />
              <MetricCard 
                title="Total Pos Expense" 
                value={metrics.pos.totalPosExpense} 
                format="currency"
                isLoading={isLoading}
              />
              <MetricCard 
                title="Today Pos Expense" 
                value={metrics.pos.todayPosExpense} 
                format="currency"
                isLoading={isLoading}
              />
            </div>
          </section>

          {/* POS Profit Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">🔹 POS Profit</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MetricCard 
                title="POS Profit" 
                value={metrics.posProfit.posProfit} 
                format="currency"
                isLoading={isLoading}
              />
              <MetricCard 
                title="POS Expense" 
                value={metrics.posProfit.posExpense} 
                format="currency"
                isLoading={isLoading}
              />
            </div>
          </section>

          {/* Overall Profit Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">🔹 Overall Profit</h2>
            <div className="grid grid-cols-1 gap-4">
              <MetricCard 
                title="Total Profit" 
                value={metrics.overallProfit.totalProfit} 
                format="currency"
                isLoading={isLoading}
              />
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
