import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Dumbbell, 
  Users, 
  Calendar, 
  CreditCard, 
  ChevronRight, 
  ArrowRight, 
  CheckIcon,
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

const Home = () => {
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
      title: 'Starter',
      price: '₹49',
      period: '/month',
      description: 'Perfect for boutique studios and small gyms',
      features: [
        { text: 'Up to 500 members', included: true },
        { text: 'Basic scheduling & bookings', included: true },
        { text: 'Payment processing', included: true },
        { text: 'Email notifications', included: true },
        { text: 'Basic analytics', included: true },
        { text: 'Mobile app access', included: true },
        { text: 'SMS notifications', included: false },
        { text: 'Advanced reporting', included: false },
        { text: 'API access', included: false }
      ],
      buttonText: 'Start Free Trial',
      buttonLink: '/signup',
      popular: false
    },
    {
      title: 'Professional',
      price: '₹99',
      period: '/month',
      description: 'Ideal for growing fitness businesses',
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
      buttonText: 'Start Free Trial',
      buttonLink: '/signup',
      popular: true
    },
    {
      title: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large gym chains and franchises',
      features: [
        { text: 'Everything in Professional', included: true },
        { text: 'Multi-location management', included: true },
        { text: 'White-label mobile apps', included: true },
        { text: 'Advanced integrations', included: true },
        { text: 'Custom workflows', included: true },
        { text: 'Dedicated success manager', included: true },
        { text: 'Priority support', included: true },
        { text: 'Custom training', included: true },
        { text: 'SLA guarantee', included: true }
      ],
      buttonText: 'Contact Sales',
      buttonLink: '/contact',
      popular: false
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Owner, FitLife Studio',
      avatar: 'SJ',
      content: 'FlexCRM transformed our member retention from 60% to 85%. The automated communications and analytics are game-changers.',
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
      <Header transparent />
      
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
                  asChild
                >
                  <Link to="/signup">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-slate-300 dark:border-slate-600 px-8 py-4 text-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 group"
                  asChild
                >
                  <Link to="/contact">
                    <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Watch Demo
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
                  <CheckIcon className="w-4 h-4 text-green-500" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon className="w-4 h-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon className="w-4 h-4 text-green-500" />
                  <span>Setup in 5 minutes</span>
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
                Unlike generic CRMs, FlexCRM understands the unique challenges and opportunities in fitness management.
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
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                Flexible pricing that grows with your business. Start free, scale when ready.
              </p>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {pricing.map((plan, index) => (
              <motion.div
                key={plan.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <Card className={cn(
                  "h-full transition-all duration-300 hover:shadow-2xl border-0",
                  plan.popular 
                    ? "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 ring-2 ring-blue-500/20 dark:ring-blue-400/20 shadow-xl scale-105" 
                    : "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg"
                )}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-6">
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                      {plan.title}
                    </CardTitle>
                    <div className="flex items-baseline justify-center gap-2 mb-2">
                      <span className="text-4xl font-bold text-slate-900 dark:text-white">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-slate-600 dark:text-slate-300">
                          {plan.period}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      {plan.description}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="px-6 pb-6">
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                            {feature.included ? (
                              <CheckIcon className="w-5 h-5 text-green-500" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                            )}
                          </div>
                          <span className={cn(
                            "text-sm leading-relaxed",
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
                      className={cn(
                        "w-full font-semibold",
                        plan.popular 
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg" 
                          : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
                      )}
                    >
                      <Link to={plan.buttonLink}>
                        {plan.buttonText}
                        {plan.title === 'Enterprise' ? (
                          <Crown className="w-4 h-4 ml-2" />
                        ) : (
                          <ArrowRight className="w-4 h-4 ml-2" />
                        )}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Pricing footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              All plans include 14-day free trial • No setup fees • Cancel anytime
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Bank-level security</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>99.9% uptime guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span>24/7 customer support</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

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
                See how FlexCRM is transforming fitness businesses worldwide.
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
                Join thousands of fitness professionals who've already transformed their businesses with FlexCRM. Your members are waiting for a better experience.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-white/90 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 group"
                  asChild
                >
                  <Link to="/signup">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold backdrop-blur-sm group"
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
                    <CheckIcon className="w-6 h-6" />
                  </div>
                  <span className="font-medium">14-day free trial</span>
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