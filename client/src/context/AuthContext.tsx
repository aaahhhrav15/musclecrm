import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import axiosInstance from '@/lib/axios';
import { useIndustry } from './IndustryContext';

interface User {
  id: string;
  name: string;
  email: string;
  industry: string;
  role?: 'admin' | 'staff' | 'member';
  membershipType?: string;
  joinDate?: string;
  gymId?: string;
}

interface SignupResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    industry: string;
    role: string;
    gymId: string;
  };
  gym?: {
    id: string;
    gymCode: string;
    name: string;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    industry: string;
    gymName?: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    logo?: File | null;
  }) => Promise<SignupResponse>;
  logout: () => void;
  updateUserProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { setSelectedIndustry } = useIndustry();
  const navigate = useNavigate();

  // Check for token in cookies on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axiosInstance.get('/auth/profile');
        
        if (response.data.success) {
          const userData = response.data.user;
          setUser({
            id: userData._id,
            name: userData.name,
            email: userData.email,
            industry: userData.industry,
            role: userData.role,
            membershipType: userData.membershipType,
            joinDate: userData.joinDate,
            gymId: userData.gymId
          });
          setIsAuthenticated(true);
          setSelectedIndustry(userData.industry);
        }
      } catch (error: any) {
        // Only show error toast if not on auth pages and not a 401 error
        const isAuthPage = window.location.pathname.includes('/login') || 
                          window.location.pathname.includes('/signup');
        if (error.response?.status !== 401 && !isAuthPage) {
          console.error('Auth check error:', error);
          toast({
            title: "Authentication error",
            description: "There was a problem verifying your session. Please log in again.",
            variant: "destructive",
          });
        }
        setUser(null);
        setIsAuthenticated(false);
        setSelectedIndustry(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [setSelectedIndustry, toast]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const response = await axiosInstance.post('/auth/login', {
        email,
        password
      });
      
      if (response.data.success) {
        const { user: userData, token } = response.data;
        
        localStorage.setItem('token', token);
        
        setUser({
          id: userData._id,
          name: userData.name,
          email: userData.email,
          industry: userData.industry,
          role: userData.role,
          membershipType: userData.membershipType,
          joinDate: userData.joinDate,
          gymId: userData.gymId
        });
        setIsAuthenticated(true);
        setSelectedIndustry(userData.industry);
        
        toast({
          title: "Login successful",
          description: "Welcome back to the system!",
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      toast({
        title: "Login failed",
        description: error.response?.data?.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: {
    name: string;
    email: string;
    password: string;
    industry: string;
    gymName?: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    logo?: File | null;
  }): Promise<SignupResponse> => {
    console.log('AuthContext signup called with data:', data);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('industry', data.industry);
      if (data.gymName) formData.append('gymName', data.gymName);
      if (data.phone) formData.append('phone', data.phone);
      if (data.address) formData.append('address', JSON.stringify(data.address));
      if (data.logo) formData.append('logo', data.logo);

      console.log('Sending FormData to /auth/register...');
      const response = await axiosInstance.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Backend response:', response.data);

      if (response.data.success) {
        const userData = response.data.user;
        setUser({
          id: userData._id,
          name: userData.name,
          email: userData.email,
          industry: userData.industry,
          role: userData.role,
          joinDate: userData.joinDate,
          gymId: userData.gymId
        });
        setIsAuthenticated(true);
        toast({
          title: "Account created",
          description: "Your account has been successfully created.",
        });
        return response.data;
      }
      throw new Error('Signup failed');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Signup failed",
        description: error.response?.data?.message || "There was a problem creating your account.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      setSelectedIndustry(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Redirect to home page after logout
      navigate('/');
    }
  };

  const updateUserProfile = async (userData: Partial<User>) => {
    try {
      const response = await axiosInstance.put('/auth/profile', userData);
      
      if (response.data.success) {
        setUser(prev => prev ? { ...prev, ...userData } : null);
        
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        });
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      
      toast({
        title: "Update failed",
        description: error.response?.data?.message || "There was a problem updating your profile.",
        variant: "destructive",
      });
      
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      error,
      login,
      signup,
      logout,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
