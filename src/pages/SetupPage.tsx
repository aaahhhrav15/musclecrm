
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIndustry } from '@/context/IndustryContext';
import SetupSpinner from '@/components/common/SetupSpinner';

const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedIndustry, setIsSetupComplete } = useIndustry();

  useEffect(() => {
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
  }, [selectedIndustry, navigate, setIsSetupComplete]);

  if (!selectedIndustry) {
    return null;
  }

  return (
    <SetupSpinner message={`Configuring your ${selectedIndustry} CRM modules`} />
  );
};

export default SetupPage;
