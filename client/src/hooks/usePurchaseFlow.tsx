
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePurchase } from '@/context/PurchaseContext';
import { useIndustry } from '@/context/IndustryContext';

export function usePurchaseFlow() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { checkPurchase } = usePurchase();
  const { setSelectedIndustry } = useIndustry();

  const handleBuyClick = async (industry: string) => {
    console.log('Buy clicked for industry:', industry);
    
    // If not authenticated, redirect to login with return URL
    if (!isAuthenticated && !authLoading) {
      const returnUrl = `/payment?industry=${industry}`;
      navigate(`/login`, { state: { returnUrl, industry } });
      return;
    }

    // If authenticated, check if already purchased
    if (isAuthenticated) {
      const hasPurchased = await checkPurchase(industry);
      
      if (hasPurchased) {
        // Already purchased, go to dashboard
        setSelectedIndustry(industry as any);
        navigate('/dashboard');
      } else {
        // Not purchased, go to payment page
        navigate(`/payment?industry=${industry}`);
      }
    }
  };

  const handleLoginRedirect = async (industry?: string, returnUrl?: string) => {
    if (!industry && !returnUrl) {
      navigate('/dashboard');
      return;
    }

    if (returnUrl) {
      navigate(returnUrl);
      return;
    }

    if (industry) {
      // Check if user has purchased the industry CRM
      const hasPurchased = await checkPurchase(industry);
      
      if (hasPurchased) {
        setSelectedIndustry(industry as any);
        navigate('/dashboard');
      } else {
        navigate(`/payment?industry=${industry}`);
      }
    }
  };

  return {
    handleBuyClick,
    handleLoginRedirect
  };
}
