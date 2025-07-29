import React from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  Heart, 
  Users, 
  Award, 
  Lightbulb,
  Shield,
  TrendingUp,
  Globe,
  Zap,
  Star,
  ArrowRight,
  CheckCircle,
  Building,
  Clock,
  Dumbbell,
  Check
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
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

const About: React.FC = () => {
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

  const stats = [
    { 
      number: '500+', 
      label: 'Active Gyms', 
      icon: Users, 
      color: 'from-blue-600 to-indigo-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20'
    },
    { 
      number: '100,000+', 
      label: 'Members Added', 
      icon: Globe, 
      color: 'from-green-600 to-emerald-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20'
    },
    { 
      number: '95%', 
      label: 'Member Retention', 
      icon: Shield, 
      color: 'from-purple-600 to-pink-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20'
    },
    { 
      number: '10,000+', 
      label: 'Invoices Generated', 
      icon: Building, 
      color: 'from-orange-600 to-red-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20'
    }
  ];

  const values = [
    {
      title: "Innovation First",
      description: "We continuously push the boundaries of what's possible in fitness technology, creating solutions that anticipate industry needs.",
      icon: <Lightbulb className="w-6 h-6" />,
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      title: "Customer Success",
      description: "Your success is our success. We're committed to providing exceptional support and ensuring every customer achieves their goals.",
      icon: <Target className="w-6 h-6" />,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: "Data Security",
      description: "We maintain the highest standards of data protection and privacy, ensuring your business and member information is always secure.",
      icon: <Shield className="w-6 h-6" />,
      gradient: "from-green-500 to-emerald-500"
    },
    {
      title: "Continuous Growth",
      description: "We believe in constant improvement, both for our platform and our customers' businesses, driving mutual success and innovation.",
      icon: <TrendingUp className="w-6 h-6" />,
      gradient: "from-purple-500 to-pink-500"
    }
  ];

  const teamMembers = [
    {
      name: "Ambar Singh",
      role: "CEO & Co-Founder",
      bio: "Visionary leader who founded MuscleCRM with a mission to revolutionize fitness business management.",
      avatar: "AS",
      color: "from-blue-500 to-indigo-500"
    },
    {
      name: "Mohammad Kaif Ali",
      role: "CTO & Co-Founder", 
      bio: "Co-founder leading our team in building robust and secure fitness management platforms.",
      avatar: "MK",
      color: "from-purple-500 to-pink-500"
    },
    {
      name: "Aarav Lodha",
      role: "Head of Product",
      bio: "Product strategist driving user experience and ensuring MuscleCRM delivers intuitive solutions for gym owners.",
      avatar: "AL",
      color: "from-green-500 to-teal-500"
    },
    {
      name: "Vinit Solanki",
      role: "Head of Product",
      bio: "Product leader specializing in SaaS solutions that address real challenges faced by fitness professionals.",
      avatar: "VS",
      color: "from-orange-500 to-red-500"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header />
      
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

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-12">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/10 to-teal-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container relative z-10 px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 px-4 py-2">
                <Heart className="w-4 h-4 mr-2" />
                Our Story
              </Badge>
              
              <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent sm:text-5xl lg:text-6xl">
                Empowering Fitness
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                  Businesses Worldwide
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
                Since 2019, we've been on a mission to transform how fitness businesses operate, 
                grow, and succeed. Our comprehensive CRM platform empowers gym owners, trainers, 
                and wellness professionals to focus on what they do best – changing lives through fitness.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-slate-900">
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

      {/* Mission & Vision Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
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
                Mission & Vision
              </Badge>
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Building the Future of Fitness Management
              </h2>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Our Mission</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    To empower fitness businesses with innovative technology that simplifies operations, 
                    enhances member experiences, and drives sustainable growth. We believe that when fitness 
                    professionals can focus on their passion instead of paperwork, they create stronger, 
                    healthier communities.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Card className="h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                    <Lightbulb className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Our Vision</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    To be the global leader in fitness business management, creating a world where every 
                    fitness professional has access to powerful, intuitive tools that help them build 
                    thriving businesses and make a positive impact on their communities' health and wellness.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-6 bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                <Heart className="w-4 h-4 mr-2" />
                Our Values
              </Badge>
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                What Drives Us Forward
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                Our core values guide every decision we make and every feature we build.
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-r ${value.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                        {React.cloneElement(value.icon, { className: "w-6 h-6 text-white" })}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                          {value.title}
                        </h4>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {value.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-6 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700">
                <Users className="w-4 h-4 mr-2" />
                Meet Our Team
              </Badge>
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                The People Behind MuscleCRM
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                Meet the passionate individuals dedicated to revolutionizing fitness business management.
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r ${member.color} flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                      {member.avatar}
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      {member.name}
                    </h4>
                    <p className="text-blue-600 dark:text-blue-400 font-semibold mb-4">
                      {member.role}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                      {member.bio}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
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
                  Ready to Transform Your Fitness Business?
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                  Join thousands of fitness professionals who've already transformed their businesses with MuscleCRM. 
                  Start your journey today and see why we're the trusted choice for fitness management worldwide.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={handleFreeTrialClick}
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300"
                  onClick={() => window.location.href = '/contact'}
                >
                  Contact Us
                  <ArrowRight className="w-5 h-5 ml-2" />
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

export default About;