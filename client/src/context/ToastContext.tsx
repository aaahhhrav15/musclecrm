import React, { createContext, useContext } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ToastContextType {
  showToast: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();

  const showToast = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    toast({
      title: severity.charAt(0).toUpperCase() + severity.slice(1),
      description: message,
      variant: severity === 'error' ? 'destructive' : 'default',
    });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}; 