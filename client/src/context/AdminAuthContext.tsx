import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import axiosInstance from '@/lib/axios';

interface Admin {
  email: string;
  type: string;
}

interface AdminAuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check for admin token in cookies on load
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const response = await axiosInstance.get('/admin/auth/me');
        
        if (response.data.success) {
          setAdmin(response.data.admin);
          setIsAuthenticated(true);
        }
      } catch (error: unknown) {
        // Only show error toast if not on admin login page and not a 401 error
        const isAdminLoginPage = window.location.pathname.includes('/admin/login');
        if (error && typeof error === 'object' && 'response' in error) {
          const err = error as { response?: { status?: number } };
          if (err.response?.status !== 401 && !isAdminLoginPage) {
            console.error('Admin auth check error:', error);
            toast({
              title: "Admin authentication error",
              description: "There was a problem verifying your admin session. Please log in again.",
              variant: "destructive",
            });
          }
        }
        setAdmin(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminAuth();
  }, [toast]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const response = await axiosInstance.post('/admin/auth/login', {
        email,
        password
      });
      
      if (response.data.success) {
        const { admin: adminData, token } = response.data;
        
        localStorage.setItem('adminToken', token);
        
        setAdmin(adminData);
        setIsAuthenticated(true);
        
        toast({
          title: "Admin login successful",
          description: "Welcome to the admin dashboard!",
        });
      }
    } catch (error: unknown) {
      console.error('Admin login error:', error);
      let errorMessage = "Invalid admin credentials. Please try again.";
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as { response?: { data?: { message?: string } } };
        errorMessage = err.response?.data?.message || errorMessage;
      }
      toast({
        title: "Admin login failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/admin/auth/logout');
    } catch (error) {
      console.error('Admin logout error:', error);
    } finally {
      localStorage.removeItem('adminToken');
      setAdmin(null);
      setIsAuthenticated(false);
      
      toast({
        title: "Admin logged out",
        description: "You have been successfully logged out from admin panel.",
      });
      
      // Redirect to admin login page after logout
      navigate('/admin/login');
    }
  };

  return (
    <AdminAuthContext.Provider value={{
      admin,
      isAuthenticated,
      loading,
      error,
      login,
      logout
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
