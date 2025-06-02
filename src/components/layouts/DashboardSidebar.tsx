
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarIcon, 
  CreditCard, 
  Users, 
  Bell, 
  Settings, 
  BarChart3, 
  Home,
  Dumbbell,
  Waves,
  Hotel,
  GlassWater,
  X,
  UserPlus,
  RefreshCw,
  UserMinus,
  TrendingUp,
  FileText,
  MessageSquare,
  User,
  DollarSign,
  File,
  QrCode,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useIndustry } from '@/context/IndustryContext';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, href, active }) => {
  return (
    <Link to={href}>
      <Button
        variant="ghost"
        className={cn(
          'w-full justify-start mb-1',
          active ? 'bg-primary/10 text-primary font-medium' : 'font-normal'
        )}
      >
        {icon}
        <span className="ml-3">{label}</span>
      </Button>
    </Link>
  );
};

interface DashboardSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { selectedIndustry } = useIndustry();

  const sidebarVariants = {
    open: { 
      width: '280px', 
      transition: { 
        type: 'spring', 
        stiffness: 300, 
        damping: 30 
      } 
    },
    closed: { 
      width: '0px', 
      transition: { 
        type: 'spring', 
        stiffness: 300, 
        damping: 30,
        delay: 0.1 
      } 
    }
  };

  const contentVariants = {
    open: { 
      opacity: 1,
      transition: { 
        delay: 0.1,
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    },
    closed: { 
      opacity: 0,
      transition: { 
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  const itemVariants = {
    open: { opacity: 1, y: 0 },
    closed: { opacity: 0, y: 15 }
  };

  // Function to get industry-specific modules
  const getIndustryModules = () => {
    switch (selectedIndustry) {
      case 'gym':
        return [
          { icon: <Users className="w-5 h-5" />, label: 'Member Management', href: '/dashboard/gym/members' },
          { icon: <TrendingUp className="w-5 h-5" />, label: 'Lead Management', href: '/dashboard/gym/leads' },
          { icon: <User className="w-5 h-5" />, label: 'Staff Management', href: '/dashboard/gym/staff' },
          { icon: <DollarSign className="w-5 h-5" />, label: 'Finance & Billing', href: '/dashboard/gym/finance' },
          { icon: <QrCode className="w-5 h-5" />, label: 'Attendance System', href: '/dashboard/gym/attendance' },
          { icon: <Dumbbell className="w-5 h-5" />, label: 'Workout Plans', href: '/dashboard/workout-plans' }
        ];
      case 'spa':
        return [
          { icon: <Waves className="w-5 h-5" />, label: 'Services', href: '/dashboard/services' },
          { icon: <CalendarIcon className="w-5 h-5" />, label: 'Therapist Calendar', href: '/dashboard/therapist-calendar' },
          { icon: <Users className="w-5 h-5" />, label: 'Slot Booking', href: '/dashboard/slot-booking' }
        ];
      case 'hotel':
        return [
          { icon: <Hotel className="w-5 h-5" />, label: 'Room Management', href: '/dashboard/room-management' },
          { icon: <Users className="w-5 h-5" />, label: 'Housekeeping', href: '/dashboard/housekeeping' },
          { icon: <CalendarIcon className="w-5 h-5" />, label: 'Check-in/Check-out', href: '/dashboard/checkin-checkout' }
        ];
      case 'club':
        return [
          { icon: <Users className="w-5 h-5" />, label: 'Memberships', href: '/dashboard/memberships' },
          { icon: <GlassWater className="w-5 h-5" />, label: 'Events', href: '/dashboard/events' },
          { icon: <Users className="w-5 h-5" />, label: 'Guest Passes', href: '/dashboard/guest-passes' }
        ];
      default:
        return [];
    }
  };

  const industryModules = getIndustryModules();

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        className="relative z-30 h-full overflow-hidden border-r shadow-sm bg-sidebar border-border"
        variants={sidebarVariants}
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
      >
        <div className="absolute top-0 right-0 pt-4 pr-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="md:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <motion.div
          className="flex flex-col h-full p-4 overflow-y-auto"
          variants={contentVariants}
          initial={false}
          animate={isOpen ? 'open' : 'closed'}
        >
          <motion.div variants={itemVariants} className="mb-6">
            <Link to="/" className="flex items-center">
              <h2 className="text-xl font-bold text-primary">FlexCRM</h2>
            </Link>
          </motion.div>

          <nav className="space-y-5 flex-1">
            <div>
              <motion.h3 variants={itemVariants} className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase">
                Core
              </motion.h3>
              <motion.div variants={itemVariants}>
                <SidebarItem
                  icon={<Home className="w-5 h-5" />}
                  label="Dashboard"
                  href="/dashboard"
                  active={location.pathname === '/dashboard'}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <SidebarItem
                  icon={<Users className="w-5 h-5" />}
                  label="Customers"
                  href="/dashboard/customers"
                  active={location.pathname === '/dashboard/customers'}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <SidebarItem
                  icon={<CalendarIcon className="w-5 h-5" />}
                  label="Bookings"
                  href="/dashboard/bookings"
                  active={location.pathname === '/dashboard/bookings'}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <SidebarItem
                  icon={<CreditCard className="w-5 h-5" />}
                  label="Invoices"
                  href="/dashboard/invoices"
                  active={location.pathname === '/dashboard/invoices'}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <SidebarItem
                  icon={<Bell className="w-5 h-5" />}
                  label="Notifications"
                  href="/dashboard/notifications"
                  active={location.pathname === '/dashboard/notifications'}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <SidebarItem
                  icon={<BarChart3 className="w-5 h-5" />}
                  label="Analytics"
                  href="/dashboard/analytics"
                  active={location.pathname === '/dashboard/analytics'}
                />
              </motion.div>
            </div>

            {selectedIndustry && industryModules.length > 0 && (
              <div>
                <motion.h3 
                  variants={itemVariants} 
                  className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase"
                >
                  {selectedIndustry.charAt(0).toUpperCase() + selectedIndustry.slice(1)} Modules
                </motion.h3>
                {industryModules.map((module, index) => (
                  <motion.div key={index} variants={itemVariants}>
                    <SidebarItem
                      icon={module.icon}
                      label={module.label}
                      href={module.href}
                      active={location.pathname === module.href}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            <div>
              <motion.h3 variants={itemVariants} className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase">
                Settings
              </motion.h3>
              <motion.div variants={itemVariants}>
                <SidebarItem
                  icon={<Settings className="w-5 h-5" />}
                  label="Settings"
                  href="/dashboard/settings"
                  active={location.pathname === '/dashboard/settings'}
                />
              </motion.div>
            </div>
          </nav>

          <motion.div variants={itemVariants} className="pt-4 mt-auto">
            <div className="px-3 py-2 text-xs text-muted-foreground">
              <p>FlexCRM v1.0</p>
              <p className="mt-1">© 2025 FlexCRM Inc.</p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default DashboardSidebar;
