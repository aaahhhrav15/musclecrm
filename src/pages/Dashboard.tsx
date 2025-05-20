
import React from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, CreditCard, TrendingUp, BarChart, Dumbbell, Waves, Hotel, GlassWater } from 'lucide-react';
import { useIndustry } from '@/context/IndustryContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import DashboardCard from '@/components/dashboard/DashboardCard';
import OverviewChart from '@/components/dashboard/OverviewChart';
import RecentActivitiesCard from '@/components/dashboard/RecentActivitiesCard';

const Dashboard: React.FC = () => {
  const { selectedIndustry } = useIndustry();
  
  // Function to get industry-specific icon
  const getIndustryIcon = () => {
    switch (selectedIndustry) {
      case 'gym':
        return <Dumbbell className="w-6 h-6 text-primary" />;
      case 'spa':
        return <Waves className="w-6 h-6 text-primary" />;
      case 'hotel':
        return <Hotel className="w-6 h-6 text-primary" />;
      case 'club':
        return <GlassWater className="w-6 h-6 text-primary" />;
      default:
        return <BarChart className="w-6 h-6 text-primary" />;
    }
  };

  // Function to get industry-specific stats
  const getIndustryStats = () => {
    switch (selectedIndustry) {
      case 'gym':
        return {
          title: 'Active Members',
          value: '245',
          trend: { value: 12, isPositive: true }
        };
      case 'spa':
        return {
          title: 'Services Booked',
          value: '187',
          trend: { value: 8, isPositive: true }
        };
      case 'hotel':
        return {
          title: 'Room Occupancy',
          value: '78%',
          trend: { value: 5, isPositive: true }
        };
      case 'club':
        return {
          title: 'Members',
          value: '312',
          trend: { value: 15, isPositive: true }
        };
      default:
        return {
          title: 'Customers',
          value: '0',
          trend: { value: 0, isPositive: true }
        };
    }
  };

  // Shared metrics for all industries
  const metrics = [
    {
      title: 'Total Customers',
      value: '358',
      icon: <Users className="w-6 h-6 text-primary" />,
      trend: { value: 8, isPositive: true },
      color: 'default'
    },
    {
      title: 'Monthly Bookings',
      value: '526',
      icon: <Calendar className="w-6 h-6 text-primary" />,
      trend: { value: 12, isPositive: true },
      color: 'default'
    },
    {
      title: 'Revenue',
      value: '$12,586',
      icon: <CreditCard className="w-6 h-6 text-primary" />,
      trend: { value: 3, isPositive: true },
      color: 'default'
    },
    {
      title: getIndustryStats().title,
      value: getIndustryStats().value,
      icon: getIndustryIcon(),
      trend: getIndustryStats().trend,
      color: 'default'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-2xl font-bold"
        >
          Dashboard
        </motion.h1>

        {/* Metrics Cards */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => (
            <DashboardCard
              key={index}
              title={metric.title}
              value={metric.value}
              icon={metric.icon}
              trend={metric.trend}
              color={metric.color as any}
            />
          ))}
        </div>

        {/* Charts and Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <OverviewChart 
            title="Revenue Overview" 
            valuePrefix="$" 
          />
          <RecentActivitiesCard />
        </div>

        {/* Industry-specific modules section */}
        {selectedIndustry && (
          <div className="p-6 border rounded-lg">
            <h2 className="mb-4 text-xl font-semibold">
              {selectedIndustry.charAt(0).toUpperCase() + selectedIndustry.slice(1)} Modules
            </h2>
            <p className="text-muted-foreground">
              Your industry-specific modules are activated. Click on the modules in the sidebar to access them.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
