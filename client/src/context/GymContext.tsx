import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '@/lib/axios';
import { useAuth } from '../context/AuthContext';

interface Gym {
  _id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactInfo: {
    phone: string;
    email: string;
    website: string;
  };
}

interface GymContextType {
  gym: Gym | null;
  loading: boolean;
  error: string | null;
  setGym: (gym: Gym | null) => void;
}

const GymContext = createContext<GymContextType | undefined>(undefined);

export const GymProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gym, setGym] = useState<Gym | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const fetchGymInfo = async () => {
      // Only fetch gym info if user is authenticated and is from gym industry
      if (!isAuthenticated || user?.industry !== 'gym') {
        setLoading(false);
        setGym(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get('/gym/info');
        if (response.data.success && response.data.gym) {
          setGym(response.data.gym);
        } else {
          setError(response.data.message || 'Failed to fetch gym information');
          setGym(null);
        }
      } catch (err: any) {
        console.error('Error fetching gym info:', err);
        setError(err.response?.data?.message || 'Failed to fetch gym information');
        setGym(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGymInfo();
  }, [isAuthenticated, user]);

  return (
    <GymContext.Provider value={{ gym, loading, error, setGym }}>
      {children}
    </GymContext.Provider>
  );
};

export const useGym = () => {
  const context = useContext(GymContext);
  if (context === undefined) {
    throw new Error('useGym must be used within a GymProvider');
  }
  return context;
}; 