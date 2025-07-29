import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Menu, User, LogOut, Dumbbell, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  transparent?: boolean;
}

const Header: React.FC<HeaderProps> = ({ transparent = false }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { gym } = useGym();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  React.useEffect(() => {
    if (gym) {
      console.log('Gym data in header:', gym);
    }
  }, [gym]);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const headerClass = cn(
    'fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300',
    'bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50 shadow-lg'
  );

  const logoTextClass = 'transition-all duration-300 font-bold text-xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent';

  const navLinkClass = 'text-sm font-semibold transition-all duration-300 hover:scale-105 relative group px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800';

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  return (
    <header className={headerClass}>
      <div className="container flex items-center justify-between h-16 px-4 mx-auto sm:px-6 lg:px-8">
        {/* Enhanced Logo */}
        <Link to="/" className="flex items-center group">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            {/* Logo Icon */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            
            {/* Brand Name */}
            <span className={logoTextClass}>
              MuscleCRM
            </span>
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden space-x-1 md:flex">
          {[
            { to: '/', label: 'Home' },
            ...(isAuthenticated ? [
              { to: '/dashboard', label: 'Dashboard' },
              { to: '/dashboard/customers', label: 'Customers' },
              { to: '/dashboard/bookings', label: 'Bookings' }
            ] : []),
            { to: '/industries/gym', label: 'Gym' },
            { to: '/subscriptions', label: 'Pricing' },
            { to: '/contact', label: 'Contact' }
          ].map((link) => (
            <Link key={link.to} to={link.to} className={navLinkClass}>
              <span>{link.label}</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 group-hover:w-full rounded-full"></div>
            </Link>
          ))}
        </nav>

        {/* Enhanced Desktop Auth Section */}
        <div className="hidden space-x-3 md:flex items-center">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-3 px-3 py-2 h-10 rounded-lg transition-all duration-300 hover:scale-105 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {/* User Avatar */}
                  {gym && gym.logo ? (
                    <div className="relative">
                      <img 
                        src={gym.logo} 
                        alt={`${gym.name} logo`} 
                        className="h-8 w-8 object-contain rounded-full ring-2 ring-white/20"
                        onError={(e) => {
                          console.error('Error loading logo:', e);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  
                  {/* User Info */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {gym ? gym.name : user?.name || 'User'}
                    </span>
                    {gym && gym.subscriptionEndDate && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Ends: {new Date(gym.subscriptionEndDate).toLocaleDateString('en-GB')}
                      </span>
                    )}
                  </div>
                  
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-64 p-2">
                {/* User Profile Header */}
                <div className="flex items-center gap-3 p-3 border-b border-slate-200 dark:border-slate-700 mb-2">
                  {gym && gym.logo ? (
                    <img 
                      src={gym.logo} 
                      alt={`${gym.name} logo`} 
                      className="h-10 w-10 object-contain rounded-full ring-2 ring-blue-500/20"
                      onError={(e) => {
                        console.error('Error loading logo:', e);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {gym ? gym.name : user?.name || 'User'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {user?.email}
                    </span>
                    {gym && gym.subscriptionEndDate && (
                      <span className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        Ends: {new Date(gym.subscriptionEndDate).toLocaleDateString('en-GB')}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Menu Items */}
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/dashboard/settings" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="cursor-pointer text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button 
                variant="ghost" 
                className="transition-all duration-300 hover:scale-105 px-4 py-2 h-9 rounded-lg font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                asChild
              >
                <Link to="/login">Login</Link>
              </Button>
              <Button 
                className="transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl px-4 py-2 h-9 rounded-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                asChild
              >
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Enhanced Mobile menu button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            'md:hidden transition-all duration-300 hover:scale-110 w-9 h-9 rounded-lg',
            transparent && !isScrolled && isHomePage
              ? 'text-white hover:bg-white/10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
          onClick={toggleMenu}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Enhanced Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '100vh' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-50 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg"
          >
            <div className="container flex flex-col h-full p-6">
              {/* Mobile Header */}
              <div className="flex items-center justify-between mb-8">
                <Link to="/" className="flex items-center" onClick={() => setIsMenuOpen(false)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      MuscleCRM
                    </span>
                  </div>
                </Link>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleMenu}
                  className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 w-9 h-9 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* User Info for Mobile */}
              {isAuthenticated && gym && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="flex items-center gap-4 p-4 mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-xl border border-blue-200 dark:border-blue-800"
                >
                  {gym.logo ? (
                    <img 
                      src={gym.logo} 
                      alt={`${gym.name} logo`} 
                      className="h-12 w-12 object-contain rounded-full ring-2 ring-blue-500/20"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 dark:text-white">{gym.name}</span>
                    <span className="text-sm text-slate-600 dark:text-slate-300">{user?.email}</span>
                    {gym.subscriptionEndDate && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Ends: {new Date(gym.subscriptionEndDate).toLocaleDateString('en-GB')}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Enhanced Mobile Navigation Links */}
              <nav className="flex flex-col space-y-2 flex-1">
                {[
                  { to: '/', label: 'Home' },
                  ...(isAuthenticated ? [
                    { to: '/dashboard', label: 'Dashboard' },
                    { to: '/dashboard/customers', label: 'Customers' },
                    { to: '/dashboard/bookings', label: 'Bookings' }
                  ] : []),
                  { to: '/industries/gym', label: 'Gym' },
                  { to: '/subscriptions', label: 'Pricing' },
                  { to: '/contact', label: 'Contact' }
                ].map((link, index) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                  >
                    <Link 
                      to={link.to}
                      className="flex items-center justify-between p-4 text-lg font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>{link.label}</span>
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Enhanced Mobile Auth Buttons */}
              <div className="flex flex-col w-full mt-auto mb-8 space-y-4">
                {isAuthenticated ? (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <Button 
                        variant="outline" 
                        asChild 
                        className="w-full h-12 text-base font-medium border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                      >
                        <Link to="/dashboard/settings" onClick={() => setIsMenuOpen(false)}>
                          <User className="w-5 h-5 mr-2" />
                          Settings
                        </Link>
                      </Button>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                    >
                      <Button 
                        variant="destructive" 
                        className="w-full h-12 text-base font-medium bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-5 h-5 mr-2" />
                        Logout
                      </Button>
                    </motion.div>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <Button 
                        variant="outline" 
                        asChild 
                        className="w-full h-12 text-base font-medium border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                      >
                        <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                          Login
                        </Link>
                      </Button>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                    >
                      <Button 
                        asChild 
                        className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                          Get Started
                        </Link>
                      </Button>
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;