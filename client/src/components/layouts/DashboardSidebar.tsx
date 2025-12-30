import * as React from 'react';
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
  Clock,
  ChevronRight,
  Package,
  Target
} from 'lucide-react';
import { Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useIndustry } from '@/context/IndustryContext';

// Custom scrollbar styles - Ultra Modern & Stylish
const scrollbarStyles = `
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--primary) / 0.3) transparent;
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: linear-gradient(180deg, 
      hsl(var(--background)) 0%, 
      hsl(var(--muted) / 0.1) 50%, 
      hsl(var(--background)) 100%);
    border-radius: 10px;
    margin: 4px 0;
    box-shadow: inset 0 0 3px hsl(var(--border) / 0.2);
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, 
      hsl(var(--primary) / 0.8) 0%, 
      hsl(var(--primary) / 0.6) 50%, 
      hsl(var(--primary) / 0.4) 100%);
    border-radius: 10px;
    border: 1px solid hsl(var(--primary) / 0.2);
    box-shadow: 
      0 2px 4px hsl(var(--primary) / 0.2),
      inset 0 1px 0 hsl(var(--primary) / 0.4),
      inset 0 -1px 0 hsl(var(--primary) / 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, 
      hsl(var(--primary)) 0%, 
      hsl(var(--primary) / 0.8) 50%, 
      hsl(var(--primary) / 0.6) 100%);
    border-color: hsl(var(--primary) / 0.4);
    box-shadow: 
      0 4px 8px hsl(var(--primary) / 0.3),
      inset 0 1px 0 hsl(var(--primary) / 0.6),
      inset 0 -1px 0 hsl(var(--primary) / 0.3),
      0 0 12px hsl(var(--primary) / 0.2);
    transform: scaleY(1.1);
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:active {
    background: linear-gradient(180deg, 
      hsl(var(--primary) / 0.9) 0%, 
      hsl(var(--primary) / 0.7) 50%, 
      hsl(var(--primary) / 0.5) 100%);
    transform: scaleY(0.95);
    box-shadow: 
      0 2px 4px hsl(var(--primary) / 0.4),
      inset 0 2px 4px hsl(var(--primary) / 0.3);
  }
  
  .custom-scrollbar::-webkit-scrollbar-corner {
    background: transparent;
  }
  
  /* Modern scrollbar animations */
  .custom-scrollbar::-webkit-scrollbar-thumb::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, 
      transparent 30%, 
      hsl(var(--primary) / 0.1) 50%, 
      transparent 70%);
    border-radius: 10px;
    animation: scrollbar-shine 2s ease-in-out infinite;
  }
  
  @keyframes scrollbar-shine {
    0%, 100% { 
      opacity: 0;
      transform: translateX(-100%);
    }
    50% { 
      opacity: 1;
      transform: translateX(100%);
    }
  }
  
  /* Enhanced track styling with gradient borders */
  .custom-scrollbar::-webkit-scrollbar-track:hover {
    background: linear-gradient(180deg, 
      hsl(var(--muted) / 0.1) 0%, 
      hsl(var(--muted) / 0.2) 50%, 
      hsl(var(--muted) / 0.1) 100%);
    box-shadow: inset 0 0 6px hsl(var(--border) / 0.3);
  }
  
  /* Responsive scrollbar for different screen sizes */
  @media (max-width: 768px) {
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
      border-radius: 8px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
      border-radius: 8px;
    }
  }
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = scrollbarStyles;
  if (!document.head.querySelector('style[data-scrollbar="custom"]')) {
    styleSheet.setAttribute('data-scrollbar', 'custom');
    document.head.appendChild(styleSheet);
  }
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, href, active, onClick }) => {
  return (
    <Link to={href} onClick={onClick}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative"
      >
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start mb-1 group relative overflow-hidden transition-all duration-200',
            active 
              ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-semibold border-r-2 border-primary shadow-sm' 
              : 'font-normal hover:bg-muted/50 hover:text-foreground'
          )}
        >
          {/* Animated background for active state */}
          {active && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.3 }}
            />
          )}
          
          {/* Icon with enhanced styling */}
          <div className={cn(
            "relative z-10 transition-colors duration-200",
            active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          )}>
            {icon}
          </div>
          
          {/* Label with better typography */}
          <span className={cn(
            "ml-3 relative z-10 transition-all duration-200",
            active ? "text-primary font-semibold" : "group-hover:text-foreground"
          )}>
            {label}
          </span>
          
          {/* Subtle arrow indicator for active items */}
          {active && (
            <motion.div
              className="ml-auto relative z-10"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <ChevronRight className="w-4 h-4 text-primary" />
            </motion.div>
          )}
        </Button>
      </motion.div>
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

  // --- Sidebar scroll position preservation ---
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const SCROLL_KEY = 'dashboardSidebarScroll';

  // Restore scroll position on mount and when location changes
  React.useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (scrollRef.current && saved) {
      scrollRef.current.scrollTop = parseInt(saved, 10);
    }
  }, [location.pathname]);

  // Save scroll position on unmount
  React.useEffect(() => {
    const handleSave = () => {
      if (scrollRef.current) {
        sessionStorage.setItem(SCROLL_KEY, String(scrollRef.current.scrollTop));
      }
    };
    window.addEventListener('beforeunload', handleSave);
    return () => {
      handleSave();
      window.removeEventListener('beforeunload', handleSave);
    };
  }, []);

  // Save scroll position on sidebar link click
  const handleSidebarLinkClick = () => {
    if (scrollRef.current) {
      sessionStorage.setItem(SCROLL_KEY, String(scrollRef.current.scrollTop));
    }
  };

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
    // Only gym modules remain
    return [
      { icon: <User className="w-5 h-5" />, label: 'Staff Management', href: '/dashboard/gym/staff' },
      { icon: <TrendingUp className="w-5 h-5" />, label: 'Leads', href: '/dashboard/gym/leads' },
      { icon: <DollarSign className="w-5 h-5" />, label: 'Finance & Billing', href: '/dashboard/gym/finance' },
      { icon: <QrCode className="w-5 h-5" />, label: 'Attendance System', href: '/dashboard/gym/attendance' },
      { icon: <Dumbbell className="w-5 h-5" />, label: 'Workout Plans', href: '/dashboard/gym/workout-plans' },
      { icon: <CalendarIcon className="w-5 h-5" />, label: 'Class Schedule', href: '/dashboard/gym/class-schedule' },
      { icon: <FileText className="w-5 h-5" />, label: 'Membership Plans', href: '/dashboard/gym/membership-plans' },
      { icon: <UserPlus className="w-5 h-5" />, label: 'Personal Trainers', href: '/dashboard/gym/trainers' },
      { icon: <Users className="w-5 h-5" />, label: 'Personal Training', href: '/dashboard/gym/personal-training' },
      { icon: <FileText className="w-5 h-5" />, label: 'Nutrition Plans', href: '/dashboard/gym/nutrition-plans' },
      { icon: <MessageSquare className="w-5 h-5" />, label: 'Member Communications', href: '/dashboard/gym/communications' },
      { icon: <File className="w-5 h-5" />, label: 'Health Assessments', href: '/dashboard/gym/health-assessments' },
      { icon: <Target className="w-5 h-5" />, label: 'Accountabilities', href: '/dashboard/gym/accountabilities' },
      { icon: <Target className="w-5 h-5" />, label: 'Results', href: '/dashboard/gym/results' },
      { icon: <Package className="w-5 h-5" />, label: 'Products', href: '/dashboard/gym/products' },
      { icon: <CreditCard className="w-5 h-5" />, label: 'Payments', href: '/dashboard/gym/payments' },
      { icon: <Film className="w-5 h-5" />, label: 'Reels', href: '/dashboard/gym/reels' },
      { icon: <CalendarIcon className="w-5 h-5" />, label: 'Events & Workshops', href: '/dashboard/gym/events-workshops' },
      { icon: <FileText className="w-5 h-5" />, label: 'Waiver Forms', href: '/dashboard/gym/waiver-forms' }
    ];
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
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        className="relative z-30 h-full overflow-hidden border-r bg-gradient-to-b from-background to-muted/20 border-border/50 shadow-xl"
        variants={sidebarVariants}
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
        style={{
          '--scrollbar-width': '6px',
          '--scrollbar-track': 'transparent',
          '--scrollbar-thumb': 'hsl(var(--muted-foreground) / 0.2)',
          '--scrollbar-thumb-hover': 'hsl(var(--muted-foreground) / 0.4)'
        } as React.CSSProperties}
      >
        {/* Close button for mobile */}
        <div className="absolute top-0 right-0 pt-4 pr-4 md:hidden z-40">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="hover:bg-muted/80 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <motion.div
          ref={scrollRef}
          className="flex flex-col h-full p-4 overflow-y-auto custom-scrollbar"
          variants={contentVariants}
          initial={false}
          animate={isOpen ? 'open' : 'closed'}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'hsl(var(--primary) / 0.3) transparent'
          }}
        >
          {/* Logo section with enhanced styling */}
          <motion.div variants={itemVariants} className="mb-8">
            <Link to="/" className="flex items-center group" onClick={handleSidebarLinkClick}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                  <Dumbbell className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MuscleCRM
                </h2>
              </motion.div>
            </Link>
          </motion.div>

          <nav className="space-y-8 flex-1">
            {/* Core section */}
            <div>
              <motion.div 
                variants={itemVariants}
                className="flex items-center mb-4"
              >
                <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                <h3 className="px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Core
                </h3>
                <div className="w-full h-px bg-gradient-to-r from-border via-transparent to-transparent"></div>
              </motion.div>
              
              <div className="space-y-2">
                <motion.div variants={itemVariants}>
                  <SidebarItem
                    icon={<Home className="w-5 h-5" />}
                    label="Dashboard"
                    href="/dashboard"
                    active={location.pathname === '/dashboard'}
                    onClick={handleSidebarLinkClick}
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <SidebarItem
                    icon={<Users className="w-5 h-5" />}
                    label="Customers"
                    href="/dashboard/customers"
                    active={location.pathname === '/dashboard/customers'}
                    onClick={handleSidebarLinkClick}
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <SidebarItem
                    icon={<CalendarIcon className="w-5 h-5" />}
                    label="Bookings"
                    href="/dashboard/bookings"
                    active={location.pathname === '/dashboard/bookings'}
                    onClick={handleSidebarLinkClick}
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <SidebarItem
                    icon={<CreditCard className="w-5 h-5" />}
                    label="Invoices"
                    href="/dashboard/invoices"
                    active={location.pathname === '/dashboard/invoices'}
                    onClick={handleSidebarLinkClick}
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <SidebarItem
                    icon={<Bell className="w-5 h-5" />}
                    label="Notifications"
                    href="/dashboard/notifications"
                    active={location.pathname === '/dashboard/notifications'}
                    onClick={handleSidebarLinkClick}
                  />
                </motion.div>
              </div>
            </div>

            {/* Industry-specific modules */}
            {selectedIndustry && industryModules.length > 0 && (
              <div>
                <motion.div 
                  variants={itemVariants}
                  className="flex items-center mb-4"
                >
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                  <h3 className="px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {selectedIndustry.charAt(0).toUpperCase() + selectedIndustry.slice(1)} Modules
                  </h3>
                  <div className="w-full h-px bg-gradient-to-r from-border via-transparent to-transparent"></div>
                </motion.div>
                
                <div className="space-y-2">
                  {industryModules.map((module, index) => (
                    <motion.div key={index} variants={itemVariants}>
                      <SidebarItem
                        icon={module.icon}
                        label={module.label}
                        href={module.href}
                        active={location.pathname === module.href}
                        onClick={handleSidebarLinkClick}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings section */}
            <div>
              <motion.div 
                variants={itemVariants}
                className="flex items-center mb-4"
              >
                <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                <h3 className="px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Settings
                </h3>
                <div className="w-full h-px bg-gradient-to-r from-border via-transparent to-transparent"></div>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <SidebarItem
                  icon={<Settings className="w-5 h-5" />}
                  label="Settings"
                  href="/dashboard/settings"
                  active={location.pathname === '/dashboard/settings'}
                  onClick={handleSidebarLinkClick}
                />
              </motion.div>
            </div>
          </nav>

          {/* Footer with enhanced styling */}
          <motion.div variants={itemVariants} className="pt-6 mt-auto border-t border-border/50">
            <div className="px-3 py-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground/80">MuscleCRM v1.0</p>
                <p className="text-xs">© 2025 MuscleCRM Inc.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default DashboardSidebar;