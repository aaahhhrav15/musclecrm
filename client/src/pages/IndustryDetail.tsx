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
  BarChart3,
  Play
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
      name: 'Member Management',
      description:
        'Complete member lifecycle from onboarding to renewal. Track attendance, manage members with renewal features.',
      icon: <Users className="w-6 h-6 text-blue-600" />
    },
    {
      name: 'Class & Session Booking',
      description:
        'Comprehensive booking system for classes, personal training sessions, and gym facilities with real-time availability tracking.',
      icon: <Calendar className="w-6 h-6 text-green-600" />
    },
    {
      name: 'Billing & Payments',
      description:
        'Automated billing, invoice generation, payment tracking, and membership plan management with flexible pricing.',
      icon: <CreditCard className="w-6 h-6 text-purple-600" />
    },
    {
      name: 'Analytics & Reports',
      description:
        'Comprehensive analytics dashboard with revenue insights, member insights, and performance metrics for data-driven decisions.',
      icon: <BarChart3 className="w-6 h-6 text-orange-600" />
    },
    {
      name: 'Communication Hub',
      description:
        'Multi-channel communication with email, SMS, and WhatsApp notifications for member engagement and marketing campaigns.',
      icon: <Target className="w-6 h-6 text-pink-600" />
    },
    {
      name: 'Personal Training',
      description:
        'Complete personal training management with trainer assignments, session tracking, and progress monitoring.',
      icon: <Dumbbell className="w-6 h-6 text-indigo-600" />
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
    name: 'Member Management',
    description:
      'Complete member lifecycle from onboarding to renewal. Track attendance, manage members with renewal features.',
    icon: <Users className="w-5 h-5 text-blue-600" />
  },
  {
    name: 'Class & Session Booking',
    description:
      'Comprehensive booking system for classes, personal training sessions, and gym facilities with real-time availability tracking.',
    icon: <Calendar className="w-5 h-5 text-green-600" />
  },
  {
    name: 'Billing & Payments',
    description:
      'Automated billing, invoice generation, payment tracking, and membership plan management with flexible pricing.',
    icon: <CreditCard className="w-5 h-5 text-purple-600" />
  },
  {
    name: 'Analytics & Reports',
    description:
      'Comprehensive analytics dashboard with revenue insights, member insights, and performance metrics for data-driven decisions.',
    icon: <BarChart3 className="w-5 h-5 text-orange-600" />
  },
  {
    name: 'Communication Hub',
    description:
      'Multi-channel communication with email, SMS, and WhatsApp notifications for member engagement and marketing campaigns.',
    icon: <Sparkles className="w-5 h-5 text-pink-600" />
  },
  {
    name: 'Personal Training',
    description:
      'Complete personal training management with trainer assignments, session tracking, and progress monitoring.',
    icon: <Dumbbell className="w-5 h-5 text-indigo-600" />
  },
  {
    name: 'Staff Management',
    description:
      'Manage gym staff, trainers, and employees with role-based access control and performance tracking.',
    icon: <Users className="w-5 h-5 text-cyan-600" />
  },
  {
    name: 'Attendance Tracking',
    description:
      'QR code-based attendance system with real-time check-ins and comprehensive attendance reports.',
    icon: <Target className="w-5 h-5 text-emerald-600" />
  },
  {
    name: 'Nutrition Plans',
    description:
      'AI-powered nutrition planning and meal tracking for comprehensive member wellness management.',
    icon: <Heart className="w-5 h-5 text-red-600" />
  },
  {
    name: 'Workout Plans',
    description:
      'Create and assign personalized workout plans with exercise libraries and progress monitoring.',
    icon: <Timer className="w-5 h-5 text-violet-600" />
  },
  {
    name: 'Lead Management',
    description:
      'Track potential members, manage inquiries, and convert leads into active gym memberships.',
    icon: <TrendingUp className="w-5 h-5 text-yellow-600" />
  },
  {
    name: 'Expense Tracking',
    description:
      'Monitor gym expenses, track operational costs, and maintain financial records for better business insights.',
    icon: <BarChart3 className="w-5 h-5 text-teal-600" />
  }
];

const stats = [
  { number: '500+', label: 'Active Gyms', icon: Dumbbell },
  { number: '100K+', label: 'Members Added', icon: Users },
  { number: '95%', label: 'Member Retention', icon: Shield },
  { number: '10K+', label: 'Invoices Generated', icon: Clock }
];

const pricing = [
  {
    title: 'Monthly',
    originalPrice: '₹999',
    price: '₹999',
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
    originalPrice: '₹11988',
    price: '₹9999',
    period: '/year',
    description: 'Save 16.6% with annual billing',
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
    savings: 'Save ₹1,989/year'
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
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/30">
        {/* Subtle background elements */}
        <div className="absolute inset-0">
          {/* Soft geometric patterns */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-3xl rotate-12"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full"></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl -rotate-12"></div>
          
          {/* Subtle grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:80px_80px] opacity-10 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
        </div>

        <div className="container relative z-10 px-6 py-16 mx-auto">
          <div className="max-w-6xl mx-auto">
            {/* Main content in a unique layout */}
            <div className="grid lg:grid-cols-5 gap-12 items-center">
              {/* Left column - Main content (3 columns) */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="lg:col-span-3"
              >
                <div className="space-y-8">
                  {/* Industry badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full border border-blue-200 dark:border-blue-700"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-blue-700 dark:text-blue-300 font-semibold">Industry Leading Solution</span>
                  </motion.div>

                  {/* Main headline with icon */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl">
                        {gymData.icon}
                      </div>
                      <div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                          {gymData.title}
                        </h1>
                        <p className="text-xl text-slate-600 dark:text-slate-300 mt-2 font-medium">
                          {gymData.subtitle}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed"
                  >
                    {gymData.description}
                  </motion.p>
                  
                  {/* Benefits in a unique horizontal layout */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    {gymData.benefits.slice(0, 4).map((benefit, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                        className="flex items-center gap-3 p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 shadow-sm hover:shadow-md"
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-slate-700 dark:text-slate-200 font-medium text-sm">{benefit}</span>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Action buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <Button
                      size="lg"
                      onClick={handleFreeTrialClick}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-bold rounded-2xl shadow-xl hover:shadow-blue-500/25 transition-all duration-300 group"
                    >
                      <ArrowRight className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                      Start Free Trial
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-8 py-4 text-lg font-bold rounded-2xl transition-all duration-300 group"
                      asChild
                    >
                      <Link to="/contact">
                        <Calendar className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                        Schedule Demo
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </motion.div>

              {/* Right column - Stats showcase (2 columns) */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="lg:col-span-2 space-y-6"
              >
                {/* Main stats card */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/60 dark:border-slate-700/60 p-8 shadow-xl">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Trusted by Fitness Leaders</h3>
                    <p className="text-slate-600 dark:text-slate-300">Join thousands of successful businesses</p>
                  </div>
                  
                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {stats.map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                        className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all duration-300"
                      >
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <stat.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{stat.number}</div>
                        <div className="text-slate-600 dark:text-slate-300 text-sm font-medium">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Trust indicators */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl border border-green-200 dark:border-green-700 p-6"
                >
                  <div className="flex flex-col gap-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-green-700 dark:text-green-300">7-day free trial</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-semibold text-blue-700 dark:text-blue-300">No credit card required</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="font-semibold text-purple-700 dark:text-purple-300">5-minute setup</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      {/* Stats Section */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="container px-6 mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">
                Trusted by Fitness Leaders
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Join thousands of successful fitness businesses worldwide
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <div className="relative bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">
                      {stat.number}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 font-medium">
                      {stat.label}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="container px-6 mx-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-20">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <Badge className="mb-6 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800 px-4 py-2">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Complete Solution
                </Badge>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
                  <span className="block">Everything You Need,</span>
                  <span className="block text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                    All in One Place
                  </span>
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto leading-relaxed">
                  A comprehensive CRM solution specifically designed for your gym business needs.
                </p>
              </motion.div>
            </div>
          </div>
          <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
            {/* All Features */}
            {coreFeatures.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="border-0 shadow-lg bg-gradient-to-r from-background to-muted/30 hover:shadow-xl transition-all duration-300 h-full">
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
              </motion.div>
            ))}
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
                    Save 16.6%
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
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        <div className="container px-6 mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Ready to get started?
              </div>

              {/* Main content */}
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                  Ready to Transform Your Gym?
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                  Join hundreds of successful gym businesses that trust MuscleCRM to streamline operations and accelerate growth.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={handleFreeTrialClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300"
                  asChild
                >
                  <Link to="/contact">
                    Schedule Demo
                    <Calendar className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>

              {/* Simple trust indicators */}
              <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-500 dark:text-slate-400 pt-8">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>7-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-500" />
                  <span>5-minute setup</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default IndustryDetail;