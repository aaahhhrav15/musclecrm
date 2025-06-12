import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Users, 
  Calendar, 
  Settings, 
  LogOut, 
  CreditCard,
  Utensils,
  Activity,
  Stethoscope
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useIndustry } from '@/context/IndustryContext';

const gymLinks = [
  {
    title: 'Dashboard',
    href: '/gym/dashboard',
    icon: Home
  },
  {
    title: 'Members',
    href: '/gym/members',
    icon: Users
  },
  {
    title: 'Membership Plans',
    href: '/gym/membership-plans',
    icon: CreditCard
  },
  {
    title: 'Nutrition Plans',
    href: '/gym/nutrition-plans',
    icon: Utensils
  },
  {
    title: 'Events & Workshops',
    href: '/gym/events',
    icon: Calendar
  },
  {
    title: 'Health Assessments',
    href: '/gym/health-assessments',
    icon: Stethoscope
  },
  {
    title: 'Settings',
    href: '/gym/settings',
    icon: Settings
  }
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const { selectedIndustry } = useIndustry();

  const links = selectedIndustry === 'gym' ? gymLinks : [];

  return (
    <div className="flex flex-col h-full bg-white border-r">
      <div className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {links.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center px-4 py-2 text-sm font-medium rounded-md',
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 