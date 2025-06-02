
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { usePurchase } from '@/context/PurchaseContext';
import { useIndustry } from '@/context/IndustryContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { createPurchase, checkPurchase, isLoading } = usePurchase();
  const { setSelectedIndustry } = useIndustry();
  
  const industry = searchParams.get('industry') || 'gym';
  const [purchasing, setPurchasing] = useState(false);
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);

  useEffect(() => {
    const checkExistingPurchase = async () => {
      const hasPurchased = await checkPurchase(industry);
      if (hasPurchased) {
        setAlreadyPurchased(true);
      }
    };
    
    if (user) {
      checkExistingPurchase();
    }
  }, [user, industry, checkPurchase]);

  const handlePurchase = async () => {
    setPurchasing(true);
    
    try {
      const success = await createPurchase(industry, 99);
      if (success) {
        setSelectedIndustry(industry as any);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setPurchasing(false);
    }
  };

  const handleGoToDashboard = () => {
    setSelectedIndustry(industry as any);
    navigate('/dashboard');
  };

  const industryDisplayNames = {
    gym: 'Gym & Fitness',
    spa: 'Spa & Wellness',
    hotel: 'Hotel & Hospitality',
    club: 'Club & Entertainment'
  };

  const industryName = industryDisplayNames[industry as keyof typeof industryDisplayNames] || 'CRM';

  if (alreadyPurchased) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="w-full max-w-md text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <CardTitle>Already Purchased!</CardTitle>
                <CardDescription>
                  You already own the {industryName} CRM
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleGoToDashboard} className="w-full">
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <CreditCard className="w-8 h-8 text-primary" />
                </div>
              </div>
              <CardTitle>Purchase {industryName} CRM</CardTitle>
              <CardDescription>
                Complete your purchase to access all {industry} CRM features
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{industryName} CRM</span>
                  <span className="text-2xl font-bold">$99</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  One-time payment for lifetime access
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">What's included:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    Full CRM dashboard access
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    Industry-specific modules
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    Customer management
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    Booking & invoice system
                  </li>
                </ul>
              </div>

              <Button 
                onClick={handlePurchase} 
                className="w-full" 
                disabled={purchasing || isLoading}
              >
                {purchasing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Purchase for $99`
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Secure payment processing. Cancel anytime.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentPage;
