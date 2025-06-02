import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type IndustryType = 'gym' | 'spa' | 'hotel' | 'club' | null;

interface IndustryContextType {
  selectedIndustry: IndustryType;
  setSelectedIndustry: (industry: IndustryType) => void;
  isSetupComplete: boolean;
  setIsSetupComplete: (isComplete: boolean) => void;
}

const IndustryContext = createContext<IndustryContextType | undefined>(undefined);

export const IndustryProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage if available
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>(() => {
    const saved = localStorage.getItem('selectedIndustry');
    return (saved as IndustryType) || null;
  });
  
  const [isSetupComplete, setIsSetupComplete] = useState(() => {
    const saved = localStorage.getItem('isSetupComplete');
    return saved === 'true';
  });

  // Update localStorage when state changes
  useEffect(() => {
    if (selectedIndustry) {
      localStorage.setItem('selectedIndustry', selectedIndustry);
    } else {
      localStorage.removeItem('selectedIndustry');
    }
  }, [selectedIndustry]);

  useEffect(() => {
    localStorage.setItem('isSetupComplete', isSetupComplete.toString());
  }, [isSetupComplete]);

  return (
    <IndustryContext.Provider value={{ 
      selectedIndustry, 
      setSelectedIndustry,
      isSetupComplete,
      setIsSetupComplete
    }}>
      {children}
    </IndustryContext.Provider>
  );
};

export const useIndustry = () => {
  const context = useContext(IndustryContext);
  if (context === undefined) {
    throw new Error('useIndustry must be used within an IndustryProvider');
  }
  return context;
};
