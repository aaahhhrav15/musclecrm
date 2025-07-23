import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Dumbbell,
  Users,
  Calendar,
  CreditCard,
  Sparkles,
  Crown,
  Star,
  Target,
  Award,
  Shield,
  Zap,
  TrendingUp,
  Clock,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { cn } from '@/lib/utils';
import { Timer, Heart } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

const gymData = {
  name: 'gym',
  title: 'MuscleCRM for Gyms & Fitness Centers',
  subtitle: 'The Complete Fitness Business Solution',
  description:
    'Transform your gym operations with our specialized CRM designed exclusively for fitness centers, gyms, and personal trainers. Streamline member management, automate billing, and grow your business.',
  color: 'bg-gradient-to-br from-primary via-primary to-primary/80',
  icon: <Dumbbell className="w-16 h-16 text-white" />,
  modules: [
    {
      name: 'Workout Plan Builder',
      description:
        'Create, customize, and assign personalized workout plans with exercise libraries and progress tracking.',
      icon: <Dumbbell className="w-6 h-6 text-blue-600" />
    },
    {
      name: 'Trainer Management',
      description:
        'Manage trainer schedules, specializations, client assignments, and performance analytics.',
      icon: <Users className="w-6 h-6 text-green-600" />
    },
    {
      name: 'Class Scheduling',
      description:
        'Advanced class scheduling with capacity management, waitlists, and automated notifications.',
      icon: <Calendar className="w-6 h-6 text-purple-600" />
    },
    {
      name: 'Member Check-In System',
      description:
        'QR code check-ins, attendance tracking, and real-time gym capacity monitoring.',
      icon: <Target className="w-6 h-6 text-orange-600" />
    },
    {
      name: 'Equipment Management',
      description:
        'Track equipment usage, maintenance schedules, and member equipment preferences.',
      icon: <Award className="w-6 h-6 text-pink-600" />
    },
    {
      name: 'Nutrition Tracking',
      description:
        'Integrated nutrition planning and tracking tools for comprehensive member wellness.',
      icon: <BarChart3 className="w-6 h-6 text-indigo-600" />
    }
  ],
  benefits: [
    'Increase member retention by 40%',
    'Reduce administrative work by 80%',
    'Automate 90% of billing processes',
    'Improve trainer utilization by 60%',
    'Boost revenue with upselling tools'
  ]
};

const coreFeatures = [
  {
    name: 'Smart Member Management',
    description:
      'Comprehensive member profiles with visit history, preferences, payment status, and automated communications.',
    icon: <Users className="w-5 h-5 text-blue-600" />
  },
  {
    name: 'Intelligent Booking System',
    description:
      'AI-powered scheduling with calendar integration, automatic reminders, and conflict resolution.',
    icon: <Calendar className="w-5 h-5 text-green-600" />
  },
  {
    name: 'Automated Billing & Invoices',
    description:
      'Recurring billing, payment tracking, financial reporting, and integrated payment processing.',
    icon: <CreditCard className="w-5 h-5 text-purple-600" />
  },
  {
    name: 'Advanced Analytics Dashboard',
    description:
      'Real-time business insights, member analytics, revenue tracking, and predictive reports.',
    icon: <BarChart3 className="w-5 h-5 text-orange-600" />
  },
  {
    name: 'Multi-Channel Communications',
    description:
      'Automated email, SMS, and push notifications for bookings, payments, and marketing campaigns.',
    icon: <Sparkles className="w-5 h-5 text-pink-600" />
  },
  {
    name: 'Mobile App Integration',
    description:
      'Native mobile apps for members and staff with offline capabilities and real-time sync.',
    icon: <Shield className="w-5 h-5 text-indigo-600" />
  }
];

const stats = [
  { number: '500+', label: 'Gyms Using MuscleCRM', icon: Dumbbell },
  { number: '50K+', label: 'Active Members', icon: Users },
  { number: '99.9%', label: 'Uptime Guarantee', icon: Shield },
  { number: '24/7', label: 'Support Available', icon: Clock }
];

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
      { text: 'Everything in Monthly plan', included: true },
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

const IndustryDetail: React.FC = () => {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = React.useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showFreeTrialDialog, setShowFreeTrialDialog] = React.useState(false);
  const [isLoadingTrial, setIsLoadingTrial] = React.useState(false);

  // Shared handler for all free trial buttons
  const handleFreeTrialClick = () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    setShowFreeTrialDialog(true);
  };

  const handleBuyClick = () => {
    navigate('/setup');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      {/* Free Trial Dialog (shared) */}
      <AlertDialog open={showFreeTrialDialog} onOpenChange={setShowFreeTrialDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Free Trial?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to start your 7-day free trial? This can only be used once per gym.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoadingTrial}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isLoadingTrial}
              onClick={async () => {
                setIsLoadingTrial(true);
                try {
                  const response = await axiosInstance.post('/gym/start-free-trial');
                  if (response.data.success) {
                    toast({
                      title: 'Free Trial Started',
                      description: 'Your free trial is now active!',
                    });
                    setShowFreeTrialDialog(false);
                    window.location.reload();
                  } else {
                    toast({
                      title: 'Error',
                      description: response.data.message || 'Could not start free trial',
                      variant: 'destructive',
                    });
                  }
                } catch (error: unknown) {
                  const err = error as { response?: { data?: { message?: string } } };
                  toast({
                    title: 'Error',
                    description: err?.response?.data?.message || 'Could not start free trial',
                    variant: 'destructive',
                  });
                } finally {
                  setIsLoadingTrial(false);
                }
              }}
            >
              {isLoadingTrial ? 'Starting...' : 'Start Free Trial'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Hero Section */}
      <section className={`pt-20 ${gymData.color} relative overflow-hidden`}>
        <div className="container px-4 py-20 mx-auto sm:px-6 lg:px-8 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-6 bg-white/20 text-white border-white/30">
                <Award className="w-4 h-4 mr-2" />
                Industry Leading Solution
              </Badge>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm shadow-xl">
                  {gymData.icon}
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                    {gymData.title}
                  </h1>
                  <p className="text-lg text-white/90 mt-2 font-medium">
                    {gymData.subtitle}
                  </p>
                </div>
              </div>
              <p className="max-w-2xl text-lg text-white/90 leading-relaxed mb-8">
                {gymData.description}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {gymData.benefits.slice(0, 4).map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-white/90">
                    <Check className="w-5 h-5 text-white flex-shrink-0" />
                    <span className="text-sm font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handleFreeTrialClick}
                  className="bg-white text-primary hover:bg-white/90 px-8 py-3 text-lg font-semibold shadow-xl"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white bg-white/10 px-8 py-3 text-lg"
                  asChild
                >
                  <Link to="/contact">
                    Schedule Demo
                    <Calendar className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <Card className="w-full h-[500px] bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl overflow-hidden">
                <CardContent className="p-8 h-full flex flex-col justify-center">
                  <div className="text-center text-white">
                    <div className="mb-6">
                      <Dumbbell className="w-24 h-24 mx-auto mb-4 opacity-80" />
                      <h3 className="text-2xl font-bold mb-2">Dashboard Preview</h3>
                      <p className="text-white/80">Powerful analytics and insights</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white/10 rounded-lg p-4">
                        <div className="text-2xl font-bold">2,847</div>
                        <div className="text-white/70">Active Members</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4">
                        <div className="text-2xl font-bold">94%</div>
                        <div className="text-white/70">Retention Rate</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4">
                        <div className="text-2xl font-bold">₹8.4L</div>
                        <div className="text-white/70">Monthly Revenue</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4">
                        <div className="text-2xl font-bold">156</div>
                        <div className="text-white/70">Classes This Week</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            </motion.div>
          </div>
        </div>
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[800px] h-[800px] rounded-full bg-white/5 -right-[200px] -top-[200px] blur-3xl"></div>
          <div className="absolute w-[600px] h-[600px] rounded-full bg-white/5 -left-[100px] -bottom-[200px] blur-3xl"></div>
        </div>
      </section>
      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/30">
                    <stat.icon className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* What's Included Section */}
      <section className="py-20 bg-background">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto mb-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700">
                <Zap className="w-4 h-4 mr-2" />
                Complete Solution
              </Badge>
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Everything You Need, All in One Place
              </h2>
              <p className="mt-6 text-xl text-muted-foreground">
                A comprehensive CRM solution specifically designed for your gym business needs.
              </p>
            </motion.div>
          </div>
          <div className="grid gap-16 lg:grid-cols-2">
            {/* Core Features */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="mb-8 text-2xl font-bold">Core CRM Features</h3>
              <div className="space-y-6">
                {coreFeatures.map((feature) => (
                  <Card key={feature.name} className="border-0 shadow-lg bg-gradient-to-r from-background to-muted/30 hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/30 flex-shrink-0">
                          {feature.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg mb-2">{feature.name}</h4>
                          <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
            {/* Gym-Specific Modules */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="mb-8 text-2xl font-bold">Gym-Specific Modules</h3>
              <div className="space-y-6">
                {gymData.modules.map((module) => (
                  <Card key={module.name} className="border-0 shadow-lg bg-gradient-to-r from-primary/5 to-primary/10 hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/30 flex-shrink-0">
                          {module.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg mb-2">{module.name}</h4>
                          <p className="text-muted-foreground leading-relaxed">{module.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      {/* Pricing Section - replaced with Home page pricing section */}
      <section className="py-20 bg-gradient-to-br from-muted/20 to-muted/40">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto mb-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-6 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700">
                <CreditCard className="w-4 h-4 mr-2" />
                Transparent Pricing
              </Badge>
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Choose Your Perfect Plan
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
                Flexible pricing that grows with your business. Start free, scale when ready.
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
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-1 gap-8 lg:gap-12 pt-8">
              {pricing.map((plan, index) => {
                const isCurrentPlan = isYearly ? plan.title === 'Yearly' : plan.title === 'Monthly';
                if (!isCurrentPlan) return null;
                return (
                  <motion.div
                    key={plan.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="relative max-w-4xl mx-auto"
                  >
                    {/* Popular badge positioned outside the card */}
                    {plan.popular && (
                      <div className="flex justify-center mb-4">
                        <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 text-sm font-semibold shadow-lg">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          {plan.badge}
                        </Badge>
                      </div>
                    )}
                    <Card className={cn(
                      "h-full transition-all duration-300 hover:shadow-2xl border-0 relative overflow-hidden",
                      plan.popular 
                        ? "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 ring-2 ring-blue-500/20 dark:ring-blue-400/20 shadow-xl" 
                        : "bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg hover:shadow-xl"
                    )}>
                      {/* Background decoration for popular plan */}
                      {plan.popular && (
                        <>
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
                          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-indigo-400/10 to-blue-400/10 rounded-full blur-2xl"></div>
                        </>
                      )}
                      <CardHeader className="text-center pb-8 pt-12">
                        <div className="flex justify-center items-center gap-3 mb-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            plan.popular 
                              ? "bg-gradient-to-r from-blue-500 to-purple-600" 
                              : "bg-gradient-to-r from-slate-600 to-slate-700"
                          )}>
                            <CreditCard className="w-6 h-6 text-white" />
                          </div>
                          <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                            {plan.title}
                          </CardTitle>
                        </div>
                        {plan.savings && (
                          <div className="mb-4">
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-3 py-1">
                              <Sparkles className="w-3 h-3 mr-1" />
                              {plan.savings}
                            </Badge>
                          </div>
                        )}
                        <div className="flex items-baseline justify-center gap-2 mb-4">
                          {plan.savings && (
                            <span className="text-2xl text-slate-400 dark:text-slate-500 line-through font-semibold">
                              {plan.originalPrice}
                            </span>
                          )}
                          <span className="text-5xl font-bold text-slate-900 dark:text-white">
                            {plan.price}
                          </span>
                          {plan.period && (
                            <span className="text-xl text-slate-600 dark:text-slate-300 font-medium">
                              {plan.period}
                            </span>
                          )}
                        </div>
                        <p className="text-lg text-slate-600 dark:text-slate-300 font-medium">
                          {plan.description}
                        </p>
                      </CardHeader>
                      <CardContent className="px-8 pb-8">
                        <div className="grid md:grid-cols-2 gap-6 mb-10">
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Core Features</h4>
                            <ul className="space-y-3">
                              {plan.features.slice(0, Math.ceil(plan.features.length / 2)).map((feature, featureIndex) => (
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
                              {plan.features.slice(Math.ceil(plan.features.length / 2)).map((feature, featureIndex) => (
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
                            plan.popular 
                              ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" 
                              : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          )}
                          onClick={() => navigate('/subscriptions')}
                        >
                          {plan.buttonText}
                          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
          {/* Enhanced pricing footer with better trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <div className="max-w-4xl mx-auto">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                Everything you need to succeed
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <div className="w-12 h-12 mb-3 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="font-medium text-slate-900 dark:text-white">7-day free trial</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">No commitment required</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <div className="w-12 h-12 mb-3 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Timer className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium text-slate-900 dark:text-white">5-minute setup</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Get started instantly</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <div className="w-12 h-12 mb-3 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-medium text-slate-900 dark:text-white">Bank-level security</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Your data is protected</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <div className="w-12 h-12 mb-3 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="font-medium text-slate-900 dark:text-white">24/7 support</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">We're here to help</span>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span>4.9/5 customer rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-500" />
                  <span>99.9% uptime guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span>GDPR compliant</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary via-primary to-primary/90 relative overflow-hidden">
        <div className="container relative z-10 px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-6 bg-white/20 text-white border-white/30">
                <TrendingUp className="w-4 h-4 mr-2" />
                Join the Success Story
              </Badge>
              <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Ready to Transform Your Gym?
              </h2>
              <p className="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
                Join hundreds of successful gym businesses that trust MuscleCRM to streamline operations and accelerate growth.
              </p>
              <div className="flex flex-col justify-center gap-4 mt-10 sm:flex-row">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handleFreeTrialClick}
                  className="bg-white text-primary hover:bg-white/90 px-8 py-4 text-lg font-semibold shadow-xl"
                >
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white bg-white/10 px-8 py-4 text-lg font-semibold"
                  asChild
                >
                  <Link to="/contact">
                    Schedule Demo
                    <Calendar className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
              {/* Trust indicators */}
              <div className="flex flex-col items-center gap-4 mt-10 sm:flex-row sm:justify-center">
                <div className="flex items-center gap-2 text-white/80">
                  <Check className="w-5 h-5" />
                  <span>Free 7-day trial</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Check className="w-5 h-5" />
                  <span>Setup in under 30 minutes</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Check className="w-5 h-5" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[800px] h-[800px] rounded-full bg-white/5 -right-[200px] -top-[200px] blur-3xl"></div>
          <div className="absolute w-[600px] h-[600px] rounded-full bg-white/5 -left-[100px] -bottom-[200px] blur-3xl"></div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default IndustryDetail;