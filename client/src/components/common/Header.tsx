import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Menu, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  transparent?: boolean;
}

const Header: React.FC<HeaderProps> = ({ transparent = false }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { gym } = useGym();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  React.useEffect(() => {
    if (gym) {
      console.log('Gym data in header:', gym);
      console.log('Logo URL:', gym.logo);
    }
  }, [gym]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const headerClass = cn(
    'fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300',
    transparent ? 'bg-transparent' : 'bg-background/95 backdrop-blur-sm border-b border-border'
  );

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  return (
    <header className={headerClass}>
      <div className="container flex items-center justify-between h-16 px-4 mx-auto sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center">
          <span className="text-xl font-bold text-primary">FlexCRM</span>
          {isAuthenticated && user?.industry === 'gym' && gym && !isHomePage && (
            <div className="flex items-center ml-2">
              {gym.logo && (
                <img 
                  src={gym.logo} 
                  alt={`${gym.name} logo`} 
                  className="h-8 w-8 object-contain mr-2"
                  onError={(e) => {
                    console.error('Error loading logo:', e);
                    console.error('Failed URL:', e.currentTarget.src);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <span className="text-sm text-muted-foreground">- {gym.name}</span>
            </div>
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden space-x-6 md:flex">
          <Link to="/" className="text-sm font-medium transition-colors hover:text-primary">
            Home
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
                Dashboard
              </Link>
              <Link to="/dashboard/customers" className="text-sm font-medium transition-colors hover:text-primary">
                Customers
              </Link>
              <Link to="/dashboard/bookings" className="text-sm font-medium transition-colors hover:text-primary">
                Bookings
              </Link>
            </>
          )}
          <Link to="/industries/gym" className="text-sm font-medium transition-colors hover:text-primary">
            Gym
          </Link>
          <Link to="/industries/spa" className="text-sm font-medium transition-colors hover:text-primary">
            Spa
          </Link>
          <Link to="/industries/hotel" className="text-sm font-medium transition-colors hover:text-primary">
            Hotel
          </Link>
          <Link to="/industries/club" className="text-sm font-medium transition-colors hover:text-primary">
            Club
          </Link>
          <Link to="/pricing" className="text-sm font-medium transition-colors hover:text-primary">
            Pricing
          </Link>
          <Link to="/contact" className="text-sm font-medium transition-colors hover:text-primary">
            Contact
          </Link>
        </nav>

        <div className="hidden space-x-4 md:flex">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  {gym && gym.logo ? (
                    <img 
                      src={gym.logo} 
                      alt={`${gym.name} logo`} 
                      className="h-8 w-8 object-contain rounded-full"
                      onError={(e) => {
                        console.error('Error loading logo:', e);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <User className="w-8 h-8 p-2 bg-muted rounded-full" />
                  )}
                  <span>{gym ? gym.name : user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2 border-b">
                  {gym && gym.logo ? (
                    <img 
                      src={gym.logo} 
                      alt={`${gym.name} logo`} 
                      className="h-8 w-8 object-contain rounded-full"
                      onError={(e) => {
                        console.error('Error loading logo:', e);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <User className="w-8 h-8 p-2 bg-muted rounded-full" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{gym ? gym.name : user?.name}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu}>
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 overflow-hidden bg-background/95 backdrop-blur-sm"
          >
            <div className="container flex flex-col h-full p-6">
              <div className="flex items-center justify-between">
                <Link to="/" className="flex items-center" onClick={() => setIsMenuOpen(false)}>
                  <span className="text-xl font-bold text-primary">FlexCRM</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={toggleMenu}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <nav className="flex flex-col items-start mt-8 space-y-6">
                <Link 
                  to="/" 
                  className="text-xl font-medium hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                {isAuthenticated && (
                  <>
                    <Link 
                      to="/dashboard" 
                      className="text-xl font-medium hover:text-primary"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/dashboard/customers" 
                      className="text-xl font-medium hover:text-primary"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Customers
                    </Link>
                    <Link 
                      to="/dashboard/bookings" 
                      className="text-xl font-medium hover:text-primary"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Bookings
                    </Link>
                  </>
                )}
                <Link 
                  to="/industries/gym" 
                  className="text-xl font-medium hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Gym
                </Link>
                <Link 
                  to="/industries/spa" 
                  className="text-xl font-medium hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Spa
                </Link>
                <Link 
                  to="/industries/hotel" 
                  className="text-xl font-medium hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Hotel
                </Link>
                <Link 
                  to="/industries/club" 
                  className="text-xl font-medium hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Club
                </Link>
                <Link 
                  to="/pricing" 
                  className="text-xl font-medium hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link 
                  to="/contact" 
                  className="text-xl font-medium hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </Link>
              </nav>

              <div className="flex flex-col w-full mt-auto mb-8 space-y-4">
                {isAuthenticated ? (
                  <>
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                        Profile
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/dashboard/settings" onClick={() => setIsMenuOpen(false)}>
                        Settings
                      </Link>
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                        Login
                      </Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                        Get Started
                      </Link>
                    </Button>
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
