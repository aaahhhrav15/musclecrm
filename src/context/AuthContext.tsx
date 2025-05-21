
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

// Configure axios
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

axios.defaults.withCredentials = true;

interface User {
  id: string;
  name: string;
  email: string;
  industry: string;
  role?: 'admin' | 'staff' | 'member';
  membershipType?: string;
  joinDate?: string;
  token?: string;
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

  // Check for saved auth on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          
          // Set token in axios default headers
          if (parsedUser.token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
          }
          
          try {
            // Verify token by fetching profile
            const { data } = await axios.get(`${API_URL}/auth/profile`);
            if (data.success) {
              setUser(parsedUser);
              setIsAuthenticated(true);
            } else {
              // Token invalid, remove from storage
              localStorage.removeItem('user');
              delete axios.defaults.headers.common['Authorization'];
            }
          } catch (error) {
            console.error('Token validation error:', error);
            localStorage.removeItem('user');
            delete axios.defaults.headers.common['Authorization'];
          }
        }
      } catch (error) {
        console.error('Auth restoration error:', error);
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      if (data.success) {
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          industry: data.user.industry,
          role: data.user.role,
          membershipType: data.user.membershipType,
          joinDate: data.user.joinDate,
          token: data.token
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        
        // Set token in axios default headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(userData));

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
      const { data } = await axios.post(`${API_URL}/auth/signup`, {
        name,
        email,
        password,
        industry
      });
      
      if (data.success) {
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          industry: data.user.industry,
          role: data.user.role,
          joinDate: data.user.joinDate,
          token: data.token
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        
        // Set token in axios default headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(userData));

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
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const updateUserProfile = async (userData: Partial<User>) => {
    setIsLoading(true);
    
    try {
      const { data } = await axios.put(`${API_URL}/auth/profile`, userData);
      
      if (data.success) {
        const updatedUser = { ...user, ...data.user };
        setUser(updatedUser as User);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
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
