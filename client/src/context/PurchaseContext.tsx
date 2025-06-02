
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Purchase, PurchaseService } from '@/services/PurchaseService';
import { useToast } from '@/hooks/use-toast';

interface PurchaseContextType {
  purchases: Purchase[];
  isLoading: boolean;
  checkPurchase: (industry: string) => Promise<boolean>;
  createPurchase: (industry: string, amount?: number) => Promise<boolean>;
  getUserPurchases: () => Promise<void>;
  hasPurchased: (industry: string) => boolean;
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

export const PurchaseProvider = ({ children }: { children: ReactNode }) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const checkPurchase = async (industry: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await PurchaseService.checkPurchase(industry);
      return response.hasPurchased;
    } catch (error) {
      console.error('Purchase check error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createPurchase = async (industry: string, amount?: number): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await PurchaseService.createPurchase(industry, amount);
      
      if (response.success) {
        toast({
          title: "Purchase successful",
          description: `You have successfully purchased the ${industry} CRM!`,
        });
        
        // Add to local purchases
        setPurchases(prev => [...prev, response.purchase]);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Purchase creation error:', error);
      toast({
        title: "Purchase failed",
        description: error.response?.data?.message || "Failed to create purchase",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getUserPurchases = async () => {
    try {
      setIsLoading(true);
      const response = await PurchaseService.getUserPurchases();
      setPurchases(response.purchases);
    } catch (error) {
      console.error('Get purchases error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPurchased = (industry: string): boolean => {
    return purchases.some(purchase => 
      purchase.industry === industry && purchase.paymentStatus === 'completed'
    );
  };

  return (
    <PurchaseContext.Provider value={{
      purchases,
      isLoading,
      checkPurchase,
      createPurchase,
      getUserPurchases,
      hasPurchased
    }}>
      {children}
    </PurchaseContext.Provider>
  );
};

export const usePurchase = () => {
  const context = useContext(PurchaseContext);
  if (context === undefined) {
    throw new Error('usePurchase must be used within a PurchaseProvider');
  }
  return context;
};
