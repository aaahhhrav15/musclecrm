import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

// Configure axios
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

axios.defaults.withCredentials = true;

interface User {
  id: string;
  name: string;
  email: string;
  industry: string;
  role?: 'admin' | 'staff' | 'member';
  membershipType?: string;
  joinDate?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, industry: string) => Promise<void>;
  logout: () => void;
  updateUserProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check for token in cookies on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // The server will check the cookie, no need to send token explicitly
        const response = await axios.get(`${API_URL}/auth/profile`);
        
        if (response.data.success) {
          const userData = response.data.user;
          setUser({
            id: userData._id,
            name: userData.name,
            email: userData.email,
            industry: userData.industry,
            role: userData.role,
            membershipType: userData.membershipType,
            joinDate: userData.joinDate
          });
          setIsAuthenticated(true);
        }
      } catch (error: any) {
        // Only log the error if it's not a 401 (unauthorized)
        if (error.response?.status !== 401) {
          console.error('Auth check error:', error);
        }
        // User is not authenticated, which is fine
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      if (response.data.success) {
        const userData = response.data.user;
        
        setUser({
          id: userData._id,
          name: userData.name,
          email: userData.email,
          industry: userData.industry,
          role: userData.role,
          membershipType: userData.membershipType,
          joinDate: userData.joinDate
        });
        setIsAuthenticated(true);
        
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
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, industry: string) => {
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/auth/signup`, {
        name,
        email,
        password,
        industry
      });
      
      if (response.data.success) {
        const userData = response.data.user;
        
        setUser({
          id: userData._id,
          name: userData.name,
          email: userData.email,
          industry: userData.industry,
          role: userData.role,
          joinDate: userData.joinDate
        });
        setIsAuthenticated(true);
        
        toast({
          title: "Account created",
          description: "Your account has been successfully created.",
        });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      toast({
        title: "Signup failed",
        description: error.response?.data?.message || "There was a problem creating your account.",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
      
      setUser(null);
      setIsAuthenticated(false);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      
      toast({
        title: "Logout error",
        description: "There was a problem logging out.",
        variant: "destructive",
      });
    }
  };

  const updateUserProfile = async (userData: Partial<User>) => {
    setIsLoading(true);
    
    try {
      const response = await axios.put(`${API_URL}/auth/profile`, userData);
      
      if (response.data.success) {
        const updatedUserData = response.data.user;
        setUser(prevUser => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            name: updatedUserData.name || prevUser.name,
            email: updatedUserData.email || prevUser.email,
            industry: updatedUserData.industry || prevUser.industry,
          };
        });
        
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoading,
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
