
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type IndustryType = 'gym' | 'spa' | 'hotel' | 'club' | null;

interface IndustryContextType {
  selectedIndustry: IndustryType;
  setSelectedIndustry: (industry: IndustryType) => void;
  isSetupComplete: boolean;
  setIsSetupComplete: (isComplete: boolean) => void;
}

const IndustryContext = createContext<IndustryContextType | undefined>(undefined);

export const IndustryProvider = ({ children }: { children: ReactNode }) => {
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

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
