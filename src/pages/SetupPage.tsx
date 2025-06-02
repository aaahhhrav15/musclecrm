
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIndustry } from '@/context/IndustryContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import SetupSpinner from '@/components/common/SetupSpinner';

const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedIndustry, setIsSetupComplete } = useIndustry();
  const { isLoading, isAuthenticated } = useRequireAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (!selectedIndustry) {
        navigate('/');
        return;
      }

      const setupSteps = [
        `Setting up your ${selectedIndustry} CRM`,
        `Configuring ${selectedIndustry}-specific modules`,
        `Customizing dashboard for your business`,
        `Finalizing setup`,
      ];

      let currentStep = 0;
      
      const interval = setInterval(() => {
        currentStep += 1;
        
        if (currentStep >= setupSteps.length) {
          clearInterval(interval);
          setIsSetupComplete(true);
          navigate('/dashboard');
        }
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [selectedIndustry, navigate, setIsSetupComplete, isLoading, isAuthenticated]);

  if (isLoading || !selectedIndustry) {
    return <SetupSpinner message="Preparing setup..." />;
  }

  return (
    <SetupSpinner message={`Configuring your ${selectedIndustry} CRM modules`} />
  );
};

export default SetupPage;
