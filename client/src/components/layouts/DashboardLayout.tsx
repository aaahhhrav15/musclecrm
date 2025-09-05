import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, Menu, User, LogOut, Settings, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { useIndustry } from '@/context/IndustryContext';
import { useGym } from '@/context/GymContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import DashboardSidebar from './DashboardSidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { selectedIndustry } = useIndustry();
  const { gym } = useGym();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Use the auth hook to check authentication
  const { isLoading } = useRequireAuth();

  const handleLogout = () => {
    logout();
    // Navigation is now handled in the AuthContext logout function
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="w-64 h-full bg-background border-r border-border">
          <Skeleton className="h-full" />
        </div>
        <div className="flex flex-col flex-1 w-0 overflow-hidden">
          <div className="relative z-10 flex items-center justify-between flex-shrink-0 h-16 px-4 border-b bg-background border-border md:px-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-32" />
          </div>
          <main className="flex-1 p-4 overflow-y-auto md:p-6">
            <div className="space-y-6">
              <Skeleton className="h-8 w-1/3" />
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <DashboardSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Topbar */}
        <div className="relative z-10 flex items-center justify-between flex-shrink-0 h-16 px-4 border-b bg-background border-border md:px-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-2"
            >
              <Menu className="w-5 h-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <h1 className="text-xl font-semibold">
              Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 rounded-full" asChild>
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      {gym && gym.logo ? (
                        <AvatarImage 
                          src={gym.logo} 
                          alt={`${gym.name} logo`}
                          onError={(e) => {
                            console.error('Error loading logo:', e);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <AvatarImage src="/placeholder.svg" />
                      )}
                      <AvatarFallback>
                        {(gym ? gym.name : user?.name)?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline-flex">{gym ? gym.name : user?.name}</span>
                    {gym && (
                      <span className="ml-2">
                        <Badge variant="secondary" className="text-xs px-2 py-1">
                          {gym.subscriptionEndDate
                            ? `Ends: ${new Date(gym.subscriptionEndDate).toLocaleDateString('en-GB')}`
                            : 'No Subscription'}
                        </Badge>
                      </span>
                    )}
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2 border-b">
                  <Avatar className="w-8 h-8">
                    {gym && gym.logo ? (
                      <AvatarImage 
                        src={gym.logo} 
                        alt={`${gym.name} logo`}
                        onError={(e) => {
                          console.error('Error loading logo:', e);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <AvatarImage src="/placeholder.svg" />
                    )}
                    <AvatarFallback>
                      {(gym ? gym.name : user?.name)?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{gym ? gym.name : user?.name}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 overflow-y-auto md:p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
