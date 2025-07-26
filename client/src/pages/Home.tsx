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
  ChevronDown
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

  // Stats data with enhanced visuals
  const stats = [
    { 
      number: '10,000+', 
      label: 'Active Members', 
      icon: Users, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950'
    },
    { 
      number: '50+', 
      label: 'Fitness Centers', 
      icon: Dumbbell, 
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950'
    },
    { 
      number: '99.9%', 
      label: 'Uptime', 
      icon: Shield, 
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950'
    },
    { 
      number: '24/7', 
      label: 'Support', 
      icon: Clock, 
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950'
    }
  ];

  // Enhanced features with better categorization
  const features = [
    {
      category: 'Member Management',
      items: [
        {
          title: 'Smart Member Profiles',
          description: 'Comprehensive member tracking with workout history, preferences, and progress analytics.',
          icon: <Users className="w-6 h-6" />,
          gradient: 'from-blue-500 to-cyan-500'
        },
        {
          title: 'Automated Communications',
          description: 'Smart notifications for renewals, promotions, and personalized member engagement.',
          icon: <MessageCircle className="w-6 h-6" />,
          gradient: 'from-purple-500 to-pink-500'
        }
      ]
    },
    {
      category: 'Operations',
      items: [
        {
          title: 'Advanced Scheduling',
          description: 'AI-powered class scheduling with capacity management and waitlist automation.',
          icon: <Calendar className="w-6 h-6" />,
          gradient: 'from-green-500 to-emerald-500'
        },
        {
          title: 'Equipment Tracking',
          description: 'Real-time equipment monitoring with maintenance scheduling and usage analytics.',
          icon: <Settings className="w-6 h-6" />,
          gradient: 'from-orange-500 to-red-500'
        }
      ]
    },
    {
      category: 'Business Growth',
      items: [
        {
          title: 'Revenue Analytics',
          description: 'Deep insights into membership trends, revenue streams, and growth opportunities.',
          icon: <BarChart3 className="w-6 h-6" />,
          gradient: 'from-indigo-500 to-purple-500'
        },
        {
          title: 'Automated Billing',
          description: 'Seamless payment processing with flexible membership plans and dunning management.',
          icon: <CreditCard className="w-6 h-6" />,
          gradient: 'from-teal-500 to-cyan-500'
        }
      ]
    }
  ];

  // Enhanced pricing with better visual hierarchy
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

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Owner, FitLife Studio',
      avatar: 'SJ',
      content: 'MuscleCRM transformed our member retention from 60% to 85%. The automated communications and analytics are game-changers.',
      rating: 5,
      color: 'from-pink-500 to-rose-500'
    },
    {
      name: 'Mike Rodriguez',
      role: 'Manager, PowerFit Gym',
      avatar: 'MR',
      content: 'Cut our admin time by 70% and increased revenue by 35% in just 6 months. The ROI speaks for itself.',
      rating: 5,
      color: 'from-blue-500 to-indigo-500'
    },
    {
      name: 'Emma Chen',
      role: 'CEO, Wellness Chain',
      avatar: 'EC',
      content: 'Managing 12 locations is now effortless. The insights help us make data-driven decisions across all centers.',
      rating: 5,
      color: 'from-green-500 to-emerald-500'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header />
      
      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden pt-24">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="container relative z-10 px-4 py-20 mx-auto sm:px-6 lg:px-8 sm:py-24 lg:py-32">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center px-4 py-2 mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-full border border-blue-200 dark:border-blue-800"
              >
                <Sparkles className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Trusted by 10,000+ Fitness Professionals
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl mb-6"
              >
                <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-100 dark:to-white bg-clip-text text-transparent">
                  The Future of
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                  Fitness Management
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="max-w-3xl mx-auto text-xl text-slate-600 dark:text-slate-300 mb-10 leading-relaxed"
              >
                Streamline operations, boost member retention, and accelerate growth with the most advanced CRM built specifically for gyms, studios, and fitness centers.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
              >
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 group"
                  onClick={() => {
                    if (!isAuthenticated) {
                      window.location.href = '/login';
                      return;
                    }
                    setShowFreeTrialDialog(true);
                  }}
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
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
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-slate-300 dark:border-slate-600 px-8 py-4 text-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 group"
                  asChild
                >
                  <Link to="/contact">
                    <Calendar className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Schedule Demo
                  </Link>
                </Button>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap justify-center items-center gap-6 text-sm text-slate-500 dark:text-slate-400"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>7-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Setup in 2 minutes</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section className="py-20 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stat.number}</div>
                <div className="text-slate-600 dark:text-slate-300 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Completely Redesigned Industry Focus Section */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-6 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                <Target className="w-4 h-4 mr-2" />
                Built for Fitness Excellence
              </Badge>
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Designed Specifically for Your Industry
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                Unlike generic CRMs, MuscleCRM understands the unique challenges and opportunities in fitness management.
              </p>
            </motion.div>
          </div>

          {/* New centered gym management showcase */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950 p-8 lg:p-12">
              {/* Background decoration */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl"></div>
              </div>

              <div className="relative z-10 text-center">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                  <Dumbbell className="w-10 h-10 text-white" />
                </div>

                {/* Content */}
                <div className="mb-8">
                  <h3 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">
                    Complete Gym Management Solution
                  </h3>
                  <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                    From member onboarding to workout tracking, equipment management to trainer scheduling – everything you need to run a successful fitness business.
                  </p>
                </div>

                {/* Feature grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-slate-700/20">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Member Management</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Complete member lifecycle management with smart insights</p>
                  </div>
                  
                  <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-slate-700/20">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Workout Tracking</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Advanced fitness tracking and progress monitoring</p>
                  </div>
                  
                  <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-slate-700/20">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Performance Analytics</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Real-time insights to optimize gym operations</p>
                  </div>
                </div>

                {/* CTA */}
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 font-semibold group"
                  asChild
                >
                  <Link to="/industries/gym">
                    Explore Gym Features
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-6 bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                <Zap className="w-4 h-4 mr-2" />
                Powerful Features
              </Badge>
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Everything You Need to Succeed
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                Comprehensive tools designed to streamline operations and accelerate growth.
              </p>
            </motion.div>
          </div>

          <div className="space-y-16">
            {features.map((category, categoryIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {category.category}
                  </h3>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  {category.items.map((feature, index) => (
                    <Card key={feature.title} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                      <CardContent className="p-8">
                        <div className="flex items-start gap-4">
                          <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                            {feature.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                              {feature.title}
                            </h4>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Pricing Section */}
      {!subscriptionActive && (
        <section className="py-24 bg-white dark:bg-slate-900" id="pricing">
          <div className="container px-4 mx-auto sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center mb-16">
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
                            asChild 
                            size="lg"
                            className={cn(
                              "w-full font-semibold text-lg py-4 transition-all duration-200 group",
                              plan.popular 
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" 
                                : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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
      )}

      {/* Enhanced Testimonials Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-6 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700">
                <Star className="w-4 h-4 mr-2" />
                Success Stories
              </Badge>
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Loved by Fitness Professionals
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                See how MuscleCRM is transforming fitness businesses worldwide.
              </p>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8">
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container relative z-10 px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-8 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 mr-2" />
                Ready to Transform Your Gym?
              </Badge>
              
              <h2 className="text-4xl font-bold text-white mb-6 sm:text-5xl lg:text-6xl">
                Start Your Success Story Today
              </h2>
              
              <p className="text-xl text-white/90 mb-10 leading-relaxed max-w-3xl mx-auto">
                Join thousands of fitness professionals who've already transformed their businesses with MuscleCRM. Your members are waiting for a better experience.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-white/90 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 group"
                  onClick={() => {
                    if (!isAuthenticated) {
                      window.location.href = '/login';
                      return;
                    }
                    setShowFreeTrialDialog(true);
                  }}
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Button 
                  size="lg" 
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20 px-8 py-4 text-lg font-semibold backdrop-blur-sm group"
                  asChild
                >
                  <Link to="/contact">
                    <Calendar className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Schedule Demo
                  </Link>
                </Button>
              </div>

              {/* Enhanced trust indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div className="flex flex-col items-center text-white/80">
                  <div className="w-12 h-12 mb-3 rounded-full bg-white/20 flex items-center justify-center">
                    <Check className="w-6 h-6" />
                  </div>
                  <span className="font-medium">7-day free trial</span>
                  <span className="text-sm">No commitment required</span>
                </div>
                
                <div className="flex flex-col items-center text-white/80">
                  <div className="w-12 h-12 mb-3 rounded-full bg-white/20 flex items-center justify-center">
                    <Timer className="w-6 h-6" />
                  </div>
                  <span className="font-medium">5-minute setup</span>
                  <span className="text-sm">Get started instantly</span>
                </div>
                
                <div className="flex flex-col items-center text-white/80">
                  <div className="w-12 h-12 mb-3 rounded-full bg-white/20 flex items-center justify-center">
                    <Heart className="w-6 h-6" />
                  </div>
                  <span className="font-medium">24/7 support</span>
                  <span className="text-sm">We're here to help</span>
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