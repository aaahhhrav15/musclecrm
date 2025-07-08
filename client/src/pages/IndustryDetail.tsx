import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
import { useIndustry } from '@/context/IndustryContext';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

interface IndustryModule {
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface IndustryData {
  name: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  modules: IndustryModule[];
  benefits: string[];
}

const IndustryDetail: React.FC = () => {
  const { industry } = useParams<{ industry: string }>();
  const navigate = useNavigate();
  const { setSelectedIndustry } = useIndustry();

  // Enhanced industry-specific data
  const industryData: Record<string, IndustryData> = {
    gym: {
      name: 'gym',
      title: 'MuscleCRM for Gyms & Fitness Centers',
      subtitle: 'The Complete Fitness Business Solution',
      description: 'Transform your gym operations with our specialized CRM designed exclusively for fitness centers, gyms, and personal trainers. Streamline member management, automate billing, and grow your business.',
      color: 'bg-gradient-to-br from-primary via-primary to-primary/80',
      icon: <Dumbbell className="w-16 h-16 text-white" />,
      modules: [
        {
          name: 'Workout Plan Builder',
          description: 'Create, customize, and assign personalized workout plans with exercise libraries and progress tracking.',
          icon: <Dumbbell className="w-6 h-6 text-blue-600" />
        },
        {
          name: 'Trainer Management',
          description: 'Manage trainer schedules, specializations, client assignments, and performance analytics.',
          icon: <Users className="w-6 h-6 text-green-600" />
        },
        {
          name: 'Class Scheduling',
          description: 'Advanced class scheduling with capacity management, waitlists, and automated notifications.',
          icon: <Calendar className="w-6 h-6 text-purple-600" />
        },
        {
          name: 'Member Check-In System',
          description: 'QR code check-ins, attendance tracking, and real-time gym capacity monitoring.',
          icon: <Target className="w-6 h-6 text-orange-600" />
        },
        {
          name: 'Equipment Management',
          description: 'Track equipment usage, maintenance schedules, and member equipment preferences.',
          icon: <Award className="w-6 h-6 text-pink-600" />
        },
        {
          name: 'Nutrition Tracking',
          description: 'Integrated nutrition planning and tracking tools for comprehensive member wellness.',
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
    }
  };

  const data = industryData[industry as keyof typeof industryData];

  useEffect(() => {
    if (!data) {
      navigate('/');
    }
  }, [data, navigate]);

  if (!data) {
    return null;
  }

  // Enhanced core features
  const coreFeatures = [
    { 
      name: 'Smart Member Management', 
      description: 'Comprehensive member profiles with visit history, preferences, payment status, and automated communications.',
      icon: <Users className="w-5 h-5 text-blue-600" />
    },
    { 
      name: 'Intelligent Booking System', 
      description: 'AI-powered scheduling with calendar integration, automatic reminders, and conflict resolution.',
      icon: <Calendar className="w-5 h-5 text-green-600" />
    },
    { 
      name: 'Automated Billing & Invoices', 
      description: 'Recurring billing, payment tracking, financial reporting, and integrated payment processing.',
      icon: <CreditCard className="w-5 h-5 text-purple-600" />
    },
    { 
      name: 'Advanced Analytics Dashboard', 
      description: 'Real-time business insights, member analytics, revenue tracking, and predictive reports.',
      icon: <BarChart3 className="w-5 h-5 text-orange-600" />
    },
    { 
      name: 'Multi-Channel Communications', 
      description: 'Automated email, SMS, and push notifications for bookings, payments, and marketing campaigns.',
      icon: <Sparkles className="w-5 h-5 text-pink-600" />
    },
    { 
      name: 'Mobile App Integration', 
      description: 'Native mobile apps for members and staff with offline capabilities and real-time sync.',
      icon: <Shield className="w-5 h-5 text-indigo-600" />
    }
  ];

  const handleBuyClick = () => {
    setSelectedIndustry(data.name as any);
    navigate('/setup');
  };

  const stats = [
    { number: '500+', label: 'Gyms Using MuscleCRM', icon: Dumbbell },
    { number: '50K+', label: 'Active Members', icon: Users },
    { number: '99.9%', label: 'Uptime Guarantee', icon: Shield },
    { number: '24/7', label: 'Support Available', icon: Clock }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      {/* Enhanced Hero Section */}
      <section className={`pt-20 ${data.color} relative overflow-hidden`}>
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
                  {data.icon}
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                    {data.title}
                  </h1>
                  <p className="text-lg text-white/90 mt-2 font-medium">
                    {data.subtitle}
                  </p>
                </div>
              </div>
              
              <p className="max-w-2xl text-lg text-white/90 leading-relaxed mb-8">
                {data.description}
              </p>
              
              {/* Key Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {data.benefits.slice(0, 4).map((benefit, index) => (
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
                  onClick={handleBuyClick}
                  className="bg-white text-primary hover:bg-white/90 px-8 py-3 text-lg font-semibold shadow-xl"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg"
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

      {/* Enhanced What's Included Section */}
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
                A comprehensive CRM solution specifically designed for your {data.name} business needs.
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
                {coreFeatures.map((feature, index) => (
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

            {/* Industry-Specific Modules */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="mb-8 text-2xl font-bold">{data.name.charAt(0).toUpperCase() + data.name.slice(1)}-Specific Modules</h3>
              <div className="space-y-6">
                {data.modules.map((module, index) => (
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

      {/* Enhanced Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-muted/20 to-muted/40">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto mb-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 bg-gradient-to-r from-green-100 to-green-200 text-green-700">
                <CreditCard className="w-4 h-4 mr-2" />
                Simple Pricing
              </Badge>
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Transparent, Affordable Pricing
              </h2>
              <p className="mt-6 text-xl text-muted-foreground">
                One comprehensive package with everything you need to succeed.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-lg mx-auto"
          >
            <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-background to-muted/30">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white px-6 py-2">
                  <Crown className="w-4 h-4 mr-2" />
                  Complete Package
                </Badge>
              </div>
              
              <CardHeader className="text-center pt-12 pb-8">
                <CardTitle className="text-3xl font-bold">{data.name.charAt(0).toUpperCase() + data.name.slice(1)} CRM Package</CardTitle>
                <div className="flex items-baseline justify-center gap-2 mt-4">
                  <span className="text-5xl font-bold">₹99</span>
                  <span className="text-xl text-muted-foreground">/month</span>
                </div>
                <p className="mt-4 text-muted-foreground">
                  Everything included - no hidden fees or add-ons required
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4 px-8 pb-8">
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Unlimited members & staff</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>All core CRM features</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>All {data.name}-specific modules</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Mobile apps for members & staff</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Advanced analytics & reporting</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>24/7 priority support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>Free updates & new features</span>
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-lg py-3" 
                    onClick={handleBuyClick}
                  >
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
                
                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    <Shield className="w-4 h-4 inline mr-1" />
                    14-day free trial • No credit card required • Cancel anytime
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
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
                Ready to Transform Your {data.name.charAt(0).toUpperCase() + data.name.slice(1)}?
              </h2>
              <p className="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
                Join hundreds of successful {data.name} businesses that trust MuscleCRM to streamline operations and accelerate growth.
              </p>
              
              <div className="flex flex-col justify-center gap-4 mt-10 sm:flex-row">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  onClick={handleBuyClick}
                  className="bg-white text-primary hover:bg-white/90 px-8 py-4 text-lg font-semibold shadow-xl"
                >
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold" 
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
                  <span>Free 14-day trial</span>
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