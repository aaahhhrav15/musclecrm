import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Dumbbell, 
  Users, 
  Calendar, 
  CreditCard, 
  ChevronRight, 
  ArrowRight, 
  Check,
  Star,
  Zap,
  Shield,
  Smartphone,
  BarChart3,
  Bell,
  Layers,
  Sparkles,
  Crown,
  Target,
  TrendingUp,
  Award,
  Clock,
  Play,
  Heart,
  Activity,
  Timer,
  Trophy,
  Gauge,
  MessageCircle,
  Settings,
  ChevronDown,
  Rocket,
  Globe,
  Lock,
  CheckCircle2,
  ArrowUpRight,
  LineChart,
  UserCheck,
  Briefcase,
  Code,
  Database,
  Laptop,
  Building2,
  ChevronLeft,
  Headphones,
  Fingerprint,
  Cpu,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Download,
  Upload,
  FileText,
  PieChart,
  DollarSign,
  Percent,
  UserPlus,
  CalendarDays,
  Clock3,
  Wifi,
  Target as TargetIcon,
  Award as AwardIcon,
  Zap as ZapIcon,
  Globe as GlobeIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  ArrowUpRight as ArrowUpRightIcon,
  LineChart as LineChartIcon,
  UserCheck as UserCheckIcon,
  Briefcase as BriefcaseIcon,
  Code as CodeIcon,
  Database as DatabaseIcon,
  Laptop as LaptopIcon,
  Building2 as Building2Icon,
  ChevronLeft as ChevronLeftIcon,
  Headphones as HeadphonesIcon,
  Fingerprint as FingerprintIcon,
  Cpu as CpuIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  MapPin as MapPinIcon,
  ExternalLink as ExternalLinkIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  FileText as FileTextIcon,
  PieChart as PieChartIcon,
  DollarSign as DollarSignIcon,
  Percent as PercentIcon,
  UserPlus as UserPlusIcon,
  CalendarDays as CalendarDaysIcon,
  Clock3 as Clock3Icon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import axios from 'axios';
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

const Home = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showFreeTrialDialog, setShowFreeTrialDialog] = useState(false);
  const [isLoadingTrial, setIsLoadingTrial] = useState(false);

  useEffect(() => {
    axios.get('/api/gym/info')
      .then(res => {
        setSubscriptionActive(res.data.subscriptionActive);
      })
      .catch(() => setSubscriptionActive(false));
  }, []);

  // Real CRM statistics and metrics
  const stats = [
    { 
      number: '500+', 
      label: 'Active Gyms', 
      icon: Users, 
      color: 'from-blue-600 to-indigo-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      delay: 0,
      description: 'Managing fitness journeys'
    },
    { 
      number: '100,000+', 
      label: 'Members Added', 
      icon: DollarSign, 
      color: 'from-green-600 to-emerald-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      delay: 0.1,
      description: 'For gym partners'
    },
    { 
      number: '95%', 
      label: 'Member Retention', 
      icon: TrendingUp, 
      color: 'from-purple-600 to-pink-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      delay: 0.2,
      description: 'Average retention rate'
    },
    { 
      number: '10,000+', 
      label: 'Invoices Generated', 
      icon: Calendar, 
      color: 'from-orange-600 to-red-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      delay: 0.3,
      description: 'Monthly across gyms'
    }
  ];

  // Real CRM features and capabilities
  const features = [
    {
      icon: <Users className="w-7 h-7" />,
      title: 'Member Management',
      description: 'Complete member lifecycle from onboarding to renewal. Track attendance, manage members with renewal features.',
      color: 'from-blue-600 to-indigo-600',
      pattern: 'dots',
      benefits: ['Member profiles', 'Attendance tracking', 'Progress monitoring', 'Renewal management']
    },
    {
      icon: <Calendar className="w-7 h-7" />,
      title: 'Class & Session Booking',
      description: 'Comprehensive booking system for classes, personal training sessions, and gym facilities with real-time availability tracking.',
      color: 'from-green-600 to-emerald-600',
      pattern: 'grid',
      benefits: ['Class scheduling', 'Session booking', 'Automatic invoice generation', 'Booking management']
    },
    {
      icon: <CreditCard className="w-7 h-7" />,
      title: 'Billing & Payments',
      description: 'Automated billing, invoice generation, payment tracking, and membership plan management with flexible pricing.',
      color: 'from-purple-600 to-pink-600',
      pattern: 'waves',
      benefits: ['Automated billing', 'Invoice generation', 'Payment tracking', 'Membership plans']
    },
    {
      icon: <BarChart3 className="w-7 h-7" />,
      title: 'Analytics & Reports',
      description: 'Comprehensive analytics dashboard with revenue insights, member isights, and performance metrics for data-driven decisions.',
      color: 'from-orange-600 to-red-600',
      pattern: 'circles',
      benefits: ['Revenue Insights', 'Member insights', 'Personal Training insights', 'Sales management']
    },
    {
      icon: <MessageCircle className="w-7 h-7" />,
      title: 'Communication Hub',
      description: 'Multi-channel communication with email, SMS, and push notifications for member engagement and marketing campaigns.',
      color: 'from-cyan-600 to-blue-600',
      pattern: 'triangles',
      benefits: ['Email campaigns', 'SMS notifications', 'Whatsapp Notifications', 'Marketing automation']
    },
    {
      icon: <Dumbbell className="w-7 h-7" />,
      title: 'Personal Training',
      description: 'Complete personal training management with trainer assignments, session tracking, and progress monitoring.',
      color: 'from-violet-600 to-indigo-600',
      pattern: 'hexagons',
      benefits: ['Trainer management', 'Renewal system', 'Trainer Assignment', 'Automatic invoices']
    }
  ];

  // Comprehensive pricing plans with real features
  const pricing = [
    {
      title: 'Monthly Plan',
      originalPrice: '₹999',
      price: '₹999',
      period: '/month',
      description: 'Perfect for growing fitness businesses',
      features: [
        { text: 'Unlimited member profiles', included: true },
        { text: 'Advanced class scheduling', included: true },
        { text: 'Automated billing & invoicing', included: true },
        { text: 'Multi-channel notifications (Email, SMS)', included: true },
        { text: 'Advanced analytics dashboard', included: true },
        { text: 'Mobile app & integrations', included: true },
        { text: 'Personal training management', included: true },
        { text: 'Custom reporting suite', included: true },
        { text: 'API access', included: true },
        { text: 'Priority support', included: true }
      ],
      buttonText: 'Start Free Trial',
      buttonLink: '/subscriptions',
      popular: false,
      badge: null,
      savings: null
    },
    {
      title: 'Annual Plan',
      originalPrice: '₹11,988',
      price: '₹9,999',
      period: '/year',
      description: 'Save 16.6% with annual billing',
      features: [
        { text: 'Everything in Monthly plan', included: true },
        { text: 'Unlimited member profiles', included: true },
        { text: 'Advanced class scheduling', included: true },
        { text: 'Automated billing & invoicing', included: true },
        { text: 'Multi-channel notifications (Email, SMS)', included: true },
        { text: 'Advanced analytics dashboard', included: true },
        { text: 'Mobile app & integrations', included: true },
        { text: 'Personal training management', included: true },
        { text: 'Custom reporting suite', included: true },
        { text: 'API access', included: true },
        { text: 'Priority support', included: true }
      ],
      buttonText: 'Start Free Trial',
      buttonLink: '/subscriptions',
      popular: true,
      badge: 'Most Popular',
      savings: 'Save ₹1,989/year'
    }
  ];

  // Real customer testimonials
  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Owner, PowerFit Gym',
      avatar: 'RK',
      content: 'MuscleCRM helped us increase member retention from 65% to 92% in just 8 months. The automated billing and communication features are incredible.',
      rating: 5,
      color: 'from-blue-600 to-indigo-600',
      location: 'Mumbai, Maharashtra'
    },
    {
      name: 'Priya Sharma',
      role: 'Manager, FitLife Studio',
      avatar: 'PS',
      content: 'We reduced administrative work by 80% and increased our monthly revenue by 40%. The analytics dashboard gives us insights we never had before.',
      rating: 5,
      color: 'from-purple-600 to-pink-600',
      location: 'Delhi, NCR'
    },
    {
      name: 'Amit Patel',
      role: 'CEO, Wellness Chain',
      avatar: 'AP',
      content: 'Managing 15 locations across 3 cities is now seamless. The multi-location features and real-time reporting have transformed our operations.',
      rating: 5,
      color: 'from-green-600 to-emerald-600',
      location: 'Bangalore, Karnataka'
    },
    {
      name: 'Neha Singh',
      role: 'Fitness Director, Elite Gym',
      avatar: 'NS',
      content: 'The personal training management module is fantastic. We can track trainer performance and member progress like never before.',
      rating: 5,
      color: 'from-orange-600 to-red-600',
      location: 'Pune, Maharashtra'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      
            {/* Professional Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/30">
        {/* Professional background elements */}
        <div className="absolute inset-0">
          {/* Subtle geometric patterns */}
          <div className="absolute top-20 left-20 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-3xl rotate-12"></div>
          <div className="absolute top-40 right-32 w-16 h-16 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full"></div>
          <div className="absolute bottom-32 left-1/4 w-24 h-24 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl -rotate-12"></div>
          <div className="absolute bottom-20 right-20 w-18 h-18 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl rotate-45"></div>
          
          {/* Professional grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:80px_80px] opacity-20 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
        </div>

        <div className="container relative z-10 px-6 py-24 mx-auto">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              {/* Left column - Content */}
              <div className="space-y-8">
                {/* Professional badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-3 px-6 py-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-full border border-slate-200/60 dark:border-slate-700/60 shadow-lg"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Trusted by 500+ Fitness Businesses
                  </span>
                </motion.div>

                {/* Main headline */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="space-y-6"
                >
                  <h1 className="text-5xl md:text-6xl xl:text-7xl font-black leading-tight">
                    <span className="block text-slate-900 dark:text-white">
                      Complete Gym
                    </span>
                    <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Management
                    </span>
                    <span className="block text-slate-900 dark:text-white">
                      Solution
                    </span>
                  </h1>
                </motion.div>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl"
                >
                  The most comprehensive CRM platform designed specifically for fitness businesses. 
                  <strong className="text-blue-600 dark:text-blue-400"> Manage members</strong>, 
                  <strong className="text-purple-600 dark:text-purple-400"> automate billing</strong>, 
                  <strong className="text-pink-600 dark:text-pink-400"> track progress</strong>, and 
                  <strong className="text-green-600 dark:text-green-400"> grow your business</strong> with powerful analytics.
                </motion.p>

                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="flex flex-col sm:flex-row gap-6"
                >
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-6 text-lg font-bold rounded-2xl shadow-xl hover:shadow-blue-500/25 transition-all duration-300 group"
                    onClick={() => {
                      if (!isAuthenticated) {
                        window.location.href = '/login';
                        return;
                      }
                      setShowFreeTrialDialog(true);
                    }}
                  >
                    <Play className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                    Start Free Trial
                  </Button>
                  
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="px-10 py-6 text-lg font-bold rounded-2xl border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 group"
                    asChild
                  >
                    <Link to="/contact">
                      <Calendar className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                      Schedule Demo
                    </Link>
                  </Button>
                </motion.div>

                {/* Trust indicators */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="flex flex-wrap gap-8 text-sm text-slate-500 dark:text-slate-400"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="font-medium">7-day free trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-500" />
                    <span className="font-medium">5-minute setup</span>
                  </div>
                </motion.div>
              </div>

              {/* Right column - Professional Dashboard Preview */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="relative lg:block hidden"
              >
                <div className="relative">
                  {/* Main dashboard card */}
                  <div className="relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xl p-8 hover:shadow-3xl transition-all duration-500">
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                            <Dumbbell className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                              MuscleCRM Dashboard
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Real-time overview
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-3 py-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Live
                        </Badge>
                      </div>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">500+</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">Active Gyms</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-xl p-4 border border-green-100 dark:border-green-800">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">100K+</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">Members Added</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">95%</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">Retention Rate</div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50 rounded-xl p-4 border border-orange-100 dark:border-orange-800">
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">10K+</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">Invoices Generated</div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-3">
                        <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                          <Users className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                          <span className="text-xs text-slate-600 dark:text-slate-400">Members</span>
                        </div>
                        <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                          <Calendar className="w-5 h-5 mx-auto mb-1 text-green-500" />
                          <span className="text-xs text-slate-600 dark:text-slate-400">Schedule</span>
                        </div>
                        <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                          <FileText className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                          <span className="text-xs text-slate-600 dark:text-slate-400">Invoices</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating notification cards */}
                  <div className="absolute -top-4 -right-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">System Update</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">New features available</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <Wifi className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">Connected</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">All systems online</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Free Trial Dialog */}
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
      </section>

      {/* Modern Stats Section with Card Layout */}
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
                  transition={{ duration: 0.6, delay: stat.delay }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <div className={`relative ${stat.bgColor} rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1`}>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
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

      {/* Industry Focus Section with Split Layout */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="container px-6 mx-auto">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Content */}
              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <Badge className="mb-6 bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 px-4 py-2">
                    <Building2 className="w-4 h-4 mr-2" />
                    Industry Focused
                  </Badge>
                  
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
                    <span className="block">Built Specifically</span>
                    <span className="block text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">
                      for Fitness
                    </span>
                  </h2>
                  
                  <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
                    Unlike generic CRMs, MuscleCRM understands the unique challenges of fitness businesses. Every feature is crafted with deep industry expertise.
                  </p>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Member Management</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Complete members management with renewal features</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white">AI Generated Nutrition Plan</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Create AI Generated Nutrition Plans seamlessly for anyone</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Dashboard Insights</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Real-time insights for your gym</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Automatic Invoices</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Automatic invoice generation for various features</p>
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button 
                      size="lg"
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 font-bold rounded-xl shadow-lg transition-all duration-300"
                      asChild
                    >
                      <Link to="/industries/gym">
                        Explore Features
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              </div>

              {/* Visual */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl"></div>
                  <div className="relative space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-white">Analytics</h3>
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
                        <div className="text-2xl font-bold text-white">500+</div>
                        <div className="text-white/70 text-sm">Total Gyms</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
                        <div className="text-2xl font-bold text-white">95%</div>
                        <div className="text-white/70 text-sm">Retention</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-white/70 text-sm">
                        <span>Monthly Revenue</span>
                        <span>+12%</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div className="bg-gradient-to-r from-cyan-400 to-blue-400 h-2 rounded-full w-3/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Features Section */}
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
                  <span className="block">Professional Gym</span>
                  <span className="block text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                    Management Platform
                  </span>
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto leading-relaxed">
                  Everything you need to run a successful fitness business. From member management to revenue optimization, 
                  we've got every aspect of your gym operations covered.
                </p>
              </motion.div>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group relative"
                >
                  <div className="relative bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 p-8 h-full">
                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-5 rounded-3xl group-hover:opacity-10 transition-opacity duration-300`}></div>
                    
                    {/* Icon */}
                    <div className={`relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                    
                    {/* Content */}
                    <div className="relative space-y-4">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {feature.description}
                      </p>
                      
                      {/* Feature benefits */}
                      <div className="space-y-2">
                        {feature.benefits.map((benefit, benefitIndex) => (
                          <div key={benefitIndex} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                            <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                              {benefit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Hover indicator */}
                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ArrowUpRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Modern Pricing Section */}
      {!subscriptionActive && (
        <section className="py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950" id="pricing">
          <div className="container px-6 mx-auto">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="text-center mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <Badge className="mb-6 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800 px-4 py-2">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Simple Pricing
                  </Badge>
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
                    <span className="block">Choose Your</span>
                    <span className="block text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text">
                      Growth Plan
                    </span>
                  </h2>
                  <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-12">
                    Transparent pricing that scales with your success. Start free, upgrade when ready.
                  </p>

                  {/* Billing Toggle */}
                  <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <button
                      onClick={() => setIsYearly(false)}
                      className={cn(
                        "px-6 py-3 text-sm font-bold rounded-lg transition-all duration-300",
                        !isYearly 
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md" 
                          : "text-slate-600 dark:text-slate-400"
                      )}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setIsYearly(true)}
                      className={cn(
                        "px-6 py-3 text-sm font-bold rounded-lg transition-all duration-300 relative",
                        isYearly 
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md" 
                          : "text-slate-600 dark:text-slate-400"
                      )}
                    >
                      Annual
                      <Badge className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        -16.6%
                      </Badge>
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* Pricing Cards */}
              <div className="grid lg:grid-cols-1 gap-8 max-w-xl mx-auto">
                {pricing.map((plan, index) => {
                  const isCurrentPlan = isYearly ? plan.title === 'Annual Plan' : plan.title === 'Monthly Plan';
                  
                  if (!isCurrentPlan) return null;
                  
                  return (
                    <motion.div
                      key={plan.title}
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="relative"
                    >
                      {/* Popular Badge */}
                      {plan.popular && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                          <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 font-bold shadow-lg">
                            <Crown className="w-4 h-4 mr-2" />
                            {plan.badge}
                          </Badge>
                        </div>
                      )}
                      
                      <Card className={cn(
                        "relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
                        plan.popular 
                          ? "border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20" 
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      )}>
                        <CardHeader className="text-center pb-8 pt-12">
                          <div className="flex justify-center mb-6">
                            <div className={cn(
                              "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg",
                              plan.popular 
                                ? "bg-gradient-to-r from-green-600 to-emerald-600" 
                                : "bg-gradient-to-r from-slate-600 to-slate-700"
                            )}>
                              <CreditCard className="w-8 h-8 text-white" />
                            </div>
                          </div>
                          
                          <CardTitle className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                            {plan.title}
                          </CardTitle>
                          
                          {plan.savings && (
                            <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 px-3 py-1">
                              {plan.savings}
                            </Badge>
                          )}
                          
                          <div className="flex items-baseline justify-center gap-2 mb-2">
                            {plan.savings && (
                              <span className="text-2xl text-slate-400 line-through">
                                {plan.originalPrice}
                              </span>
                            )}
                            <span className="text-5xl font-black text-slate-900 dark:text-white">
                              {plan.price}
                            </span>
                            <span className="text-slate-600 dark:text-slate-300">
                              {plan.period}
                            </span>
                          </div>
                          
                          <p className="text-slate-600 dark:text-slate-300">
                            {plan.description}
                          </p>
                        </CardHeader>
                        
                        <CardContent className="px-6 pb-8">
                          <ul className="space-y-4 mb-8">
                            {plan.features.map((feature, featureIndex) => (
                              <li key={featureIndex} className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                                  {feature.included ? (
                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                                  )}
                                </div>
                                <span className={cn(
                                  "text-sm",
                                  feature.included 
                                    ? "text-slate-700 dark:text-slate-200" 
                                    : "text-slate-500 dark:text-slate-400"
                                )}>
                                  {feature.text}
                                </span>
                              </li>
                            ))}
                          </ul>
                          
                          <Button 
                            asChild 
                            size="lg"
                            className={cn(
                              "w-full font-bold py-4 rounded-xl transition-all duration-300 group shadow-lg",
                              plan.popular 
                                ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white" 
                                : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
                            )}
                          >
                            <Link to={plan.buttonLink}>
                              {plan.buttonText}
                              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Bottom Features */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-center mt-16"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-950/20 rounded-2xl flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">7-Day Free Trial</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Full access, no commitment</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/20 rounded-2xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Secure & Reliable</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Bank-level security</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950/20 rounded-2xl flex items-center justify-center">
                      <Headphones className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">24/7 Support</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Always here to help</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}
      
      {/* Customer Success Stories Section */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="container px-6 mx-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <Badge className="mb-6 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800 px-4 py-2">
                  <Star className="w-4 h-4 mr-2" />
                  Success Stories
                </Badge>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
                  <span className="block">Trusted by Leading</span>
                  <span className="block text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text">
                    Fitness Businesses
                  </span>
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto leading-relaxed">
                  See how fitness professionals across India are transforming their businesses with MuscleCRM. 
                  Real results from real gyms.
                </p>
              </motion.div>
            </div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 p-8 h-full">
                    {/* Rating */}
                    <div className="flex mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                      ))}
                    </div>
                    
                    {/* Quote */}
                    <blockquote className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-6 leading-relaxed">
                      "{testimonial.content}"
                    </blockquote>
                    
                    {/* Author */}
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-semibold text-lg`}>
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {testimonial.name}
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 text-sm">
                          {testimonial.role}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-xs">
                          {testimonial.location}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-white/5 to-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
        </div>

        <div className="container relative z-10 px-6 mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-xl px-6 py-3 text-lg font-bold">
                <Rocket className="w-5 h-5 mr-2" />
                Ready to Get Started?
              </Badge>
              
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight">
                <span className="block">Transform Your</span>
                <span className="block text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text">
                  Gym Business
                </span>
              </h2>
              
              <p className="text-xl text-white/80 leading-relaxed max-w-3xl mx-auto">
                Join the growing community of successful fitness businesses. Start your free trial today and experience the power of professional gym management.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                <Button 
                  size="lg" 
                  className="bg-white text-slate-900 hover:bg-white/90 px-10 py-4 text-lg font-bold shadow-2xl hover:shadow-white/25 transition-all duration-300 group rounded-xl"
                  onClick={() => {
                    if (!isAuthenticated) {
                      window.location.href = '/login';
                      return;
                    }
                    setShowFreeTrialDialog(true);
                  }}
                >
                  <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Start Free Trial
                </Button>
                
                <Button 
                  size="lg" 
                  className="bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 px-10 py-4 text-lg font-bold backdrop-blur-xl group rounded-xl transition-all duration-300"
                  asChild
                >
                  <Link to="/contact">
                    <Calendar className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Schedule Demo
                  </Link>
                </Button>
              </div>

              <div className="flex flex-wrap justify-center gap-8 pt-12 text-white/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>7-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
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

export default Home;