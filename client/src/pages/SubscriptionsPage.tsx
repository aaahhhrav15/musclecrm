import * as React from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  ArrowRight, 
  Check,
  TrendingUp,
  Shield,
  Zap,
  Heart,
  Timer,
  Star,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import axios from 'axios';
import { ApiService } from '@/services/ApiService';
import { useGym } from '@/context/GymContext';
import { useToast } from '@/hooks/use-toast';

const pricing = [
  {
    title: 'Monthly',
    originalPrice: '₹600',
    price: '₹600',
    period: '/month',
    description: 'Perfect for growing fitness businesses',
    features: [
      { text: 'Unlimited members', included: true },
      { text: 'Advanced scheduling & automation', included: true },
      { text: 'Automated billing & invoicing', included: true },
      { text: 'Email & SMS notifications', included: true },
      { text: 'Advanced analytics dashboard', included: true },
      { text: 'Mobile app & integrations', included: true },
      { text: 'Equipment tracking', included: true },
      { text: 'Custom reports', included: true },
      { text: 'API access', included: true }
    ],
    buttonText: 'Pay Monthly',
    buttonLink: '/signup',
    popular: false,
    badge: null,
    savings: null
  },
  {
    title: 'Yearly',
    originalPrice: '₹7,200',
    price: '₹6,120',
    period: '/year',
    description: 'Save 15% with annual billing',
    features: [
      { text: 'Unlimited members', included: true },
      { text: 'Advanced scheduling & automation', included: true },
      { text: 'Automated billing & invoicing', included: true },
      { text: 'Email & SMS notifications', included: true },
      { text: 'Advanced analytics dashboard', included: true },
      { text: 'Mobile app & integrations', included: true },
      { text: 'Equipment tracking', included: true },
      { text: 'Custom reports', included: true },
      { text: 'API access', included: true },
      { text: 'Priority customer support', included: true }
    ],
    buttonText: 'Pay Yearly',
    buttonLink: '/signup',
    popular: true,
    badge: 'Most Popular',
    savings: 'Save ₹1,080/year'
  }
];

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) return resolve(true);
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Specify Razorpay handler and window types
interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const handlePay = async (_amount: number, planType: string) => {
  console.log('handlePay called with:', { planType });
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded) {
    alert('Failed to load Razorpay. Please try again.');
    return;
  }
  try {
    // Call backend to create order
    const data = await ApiService.post('/payment/create-order', {
      planType,
      currency: 'INR',
      notes: { plan: planType }
    });
    if (typeof data !== 'object' || !data || typeof (data as any).success !== 'boolean' || !(data as any).order) {
      throw new Error('Order creation failed');
    }
    const { success, order } = data as { success: boolean; order: any };
    console.log('create-order API response:', data);
    if (!success) throw new Error('Order creation failed');
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Use Vite environment variable
      amount: order.amount,
      currency: order.currency,
      name: 'MuscleCRM',
      description: `${planType} Subscription`,
      order_id: order.id,
      handler: async function (response: RazorpayResponse) {
        console.log('Razorpay payment response:', response);
        // Verify payment
        const verifyRes = await ApiService.post('/payment/verify', {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          planType
        });
        if (typeof verifyRes === 'object' && verifyRes && (verifyRes as any).success) {
          alert('Payment successful! Subscription activated.');
          window.location.reload();
        } else {
          alert('Payment verification failed.');
        }
      },
      prefill: {},
      theme: { color: '#6366f1' },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err: unknown) {
    console.error('Payment error:', err);
    let message = 'Payment failed.';
    if (err && typeof err === 'object' && 'response' in err && (err as any).response?.data?.message) {
      message = (err as any).response.data.message;
    } else if (err instanceof Error) {
      message = err.message;
    }
    alert('Payment failed: ' + message);
  }
};

// Enhanced PricingCard component with fixed badge positioning
const PricingCard = ({ 
  title, 
  originalPrice, 
  price, 
  period, 
  description, 
  features, 
  buttonText, 
  buttonLink, 
  popular, 
  badge, 
  savings 
}) => {
  const { toast } = useToast();
  const { gym } = useGym();
  const isSubscriptionActive = gym?.subscriptionEndDate && new Date(gym.subscriptionEndDate) >= new Date();

  const handlePayWithCheck = async (_amount: number, planType: string) => {
    if (isSubscriptionActive) {
      toast({
        title: 'Subscription Active',
        description: 'You already have an active subscription. Renewal is only allowed after expiry.',
        variant: 'destructive',
      });
      return;
    }
    await handlePay(_amount, planType);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="relative max-w-4xl mx-auto"
    >
      {/* Popular badge positioned OUTSIDE the card with proper spacing */}
      {popular && (
        <div className="flex justify-center mb-4">
          <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 text-sm font-semibold shadow-lg">
            <TrendingUp className="w-4 h-4 mr-2" />
            {badge}
          </Badge>
        </div>
      )}
      
      <Card className={cn(
        "h-full transition-all duration-300 hover:shadow-2xl border-0 relative overflow-hidden",
        popular 
          ? "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 ring-2 ring-blue-500/20 dark:ring-blue-400/20 shadow-xl" 
          : "bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg hover:shadow-xl"
      )}>
        {/* Background decoration for popular plan */}
        {popular && (
          <>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-indigo-400/10 to-blue-400/10 rounded-full blur-2xl"></div>
          </>
        )}
        
        <CardHeader className="text-center pb-8 pt-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              popular 
                ? "bg-gradient-to-r from-blue-500 to-purple-600" 
                : "bg-gradient-to-r from-slate-600 to-slate-700"
            )}>
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
              {title}
            </CardTitle>
          </div>

          {savings && (
            <div className="mb-4">
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-3 py-1">
                <Sparkles className="w-3 h-3 mr-1" />
                {savings}
              </Badge>
            </div>
          )}
          
          <div className="flex items-baseline justify-center gap-2 mb-4">
            {savings && (
              <span className="text-2xl text-slate-400 dark:text-slate-500 line-through font-semibold">
                {originalPrice}
              </span>
            )}
            <span className="text-5xl font-bold text-slate-900 dark:text-white">
              {price}
            </span>
            {period && (
              <span className="text-xl text-slate-600 dark:text-slate-300 font-medium">
                {period}
              </span>
            )}
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-300 font-medium">
            {description}
          </p>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Core Features</h4>
              <ul className="space-y-3">
                {features.slice(0, Math.ceil(features.length / 2)).map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                      {feature.included ? (
                        <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                        </div>
                      )}
                    </div>
                    <span className={cn(
                      "text-sm leading-relaxed font-medium",
                      feature.included 
                        ? "text-slate-700 dark:text-slate-200" 
                        : "text-slate-500 dark:text-slate-400"
                    )}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Advanced Features</h4>
              <ul className="space-y-3">
                {features.slice(Math.ceil(features.length / 2)).map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                      {feature.included ? (
                        <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                        </div>
                      )}
                    </div>
                    <span className={cn(
                      "text-sm leading-relaxed font-medium",
                      feature.included 
                        ? "text-slate-700 dark:text-slate-200" 
                        : "text-slate-500 dark:text-slate-400"
                    )}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <Button 
            size="lg"
            className={cn(
              "w-full font-semibold text-lg py-4 transition-all duration-200 group",
              popular 
                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" 
                : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            )}
            onClick={() => handlePayWithCheck(parseInt(price.replace(/[^0-9]/g, '')), title)}
          >
            {buttonText}
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const SubscriptionsPage = () => {
  const [isYearly, setIsYearly] = React.useState(false);
  const { gym } = useGym();
  const { toast } = useToast();
  const isSubscriptionActive = gym?.subscriptionEndDate && new Date(gym.subscriptionEndDate) >= new Date();

  const handlePayWithCheck = async (_amount: number, planType: string) => {
    if (isSubscriptionActive) {
      toast({
        title: 'Subscription Active',
        description: 'You already have an active subscription. Renewal is only allowed after expiry.',
        variant: 'destructive',
      });
      return;
    }
    await handlePay(_amount, planType);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center py-16 px-4 pt-32 pb-24">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/10 to-teal-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Header Section */}
        <div className="max-w-4xl mx-auto text-center mb-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-6 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700 px-4 py-2">
              <CreditCard className="w-4 h-4 mr-2" />
              Choose Your Plan
            </Badge>
            <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Choose Your Subscription Plan
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
              Flexible pricing that grows with your fitness business. Start free, scale when ready.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setIsYearly(false)}
                className={cn(
                  "px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                  !isYearly 
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                    : "text-slate-600 dark:text-slate-400"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={cn(
                  "px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative",
                  isYearly 
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                    : "text-slate-600 dark:text-slate-400"
                )}
              >
                Yearly
                <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5">
                  Save 15%
                </Badge>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Single Pricing Card based on toggle */}
        <div className="max-w-5xl mx-auto relative z-10">
          {pricing.map((plan) => {
            const isCurrentPlan = isYearly ? plan.title === 'Yearly' : plan.title === 'Monthly';
            
            if (!isCurrentPlan) return null;
            
            return (
              <PricingCard key={plan.title} {...plan} />
            );
          })}
        </div>

        {/* Enhanced Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-20 max-w-5xl mx-auto relative z-10"
        >
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-8">
            Everything you need to succeed
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="flex flex-col items-center p-6 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50">
              <div className="w-14 h-14 mb-4 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-white mb-1">14-day free trial</span>
              <span className="text-sm text-slate-600 dark:text-slate-400 text-center">No commitment required</span>
            </div>
            
            <div className="flex flex-col items-center p-6 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50">
              <div className="w-14 h-14 mb-4 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Timer className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-white mb-1">5-minute setup</span>
              <span className="text-sm text-slate-600 dark:text-slate-400 text-center">Get started instantly</span>
            </div>
            
            <div className="flex flex-col items-center p-6 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50">
              <div className="w-14 h-14 mb-4 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Shield className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-white mb-1">Bank-level security</span>
              <span className="text-sm text-slate-600 dark:text-slate-400 text-center">Your data is protected</span>
            </div>
            
            <div className="flex flex-col items-center p-6 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border border-slate-200/50 dark:border-slate-700/50">
              <div className="w-14 h-14 mb-4 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Heart className="w-7 h-7 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-white mb-1">24/7 support</span>
              <span className="text-sm text-slate-600 dark:text-slate-400 text-center">We're here to help</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="font-medium">4.9/5 customer rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-500" />
              <span className="font-medium">99.9% uptime guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              <span className="font-medium">GDPR compliant</span>
            </div>
          </div>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SubscriptionsPage;