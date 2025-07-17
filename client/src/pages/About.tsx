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
  Dumbbell
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

const About: React.FC = () => {
  const stats = [
    { 
      number: '10,000+', 
      label: 'Active Users', 
      icon: Users, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950'
    },
    { 
      number: '50+', 
      label: 'Countries', 
      icon: Globe, 
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950'
    },
    { 
      number: '99.9%', 
      label: 'Uptime', 
      icon: Shield, 
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950'
    },
    { 
      number: '2019', 
      label: 'Founded', 
      icon: Building, 
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950'
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
      name: "Alex Johnson",
      role: "CEO & Co-Founder",
      bio: "Former fitness industry executive with 15+ years of experience building scalable tech solutions.",
      avatar: "AJ",
      color: "from-blue-500 to-indigo-500"
    },
    {
      name: "Sarah Chen",
      role: "CTO & Co-Founder", 
      bio: "Engineering leader with expertise in enterprise software and passion for fitness technology innovation.",
      avatar: "SC",
      color: "from-purple-500 to-pink-500"
    },
    {
      name: "Mike Rodriguez",
      role: "Head of Product",
      bio: "Product strategist focused on creating intuitive experiences that solve real business challenges.",
      avatar: "MR",
      color: "from-green-500 to-teal-500"
    },
    {
      name: "Emma Davis",
      role: "Head of Customer Success",
      bio: "Customer advocate ensuring every MuscleCRM user maximizes their platform investment and success.",
      avatar: "ED",
      color: "from-orange-500 to-red-500"
    }
  ];

  const milestones = [
    {
      year: "2019",
      title: "Company Founded",
      description: "Started with a vision to revolutionize fitness business management",
      icon: <Building className="w-5 h-5" />
    },
    {
      year: "2020",
      title: "First 1,000 Users",
      description: "Reached our first major milestone with fitness centers across 10 countries",
      icon: <Users className="w-5 h-5" />
    },
    {
      year: "2022",
      title: "Major Platform Upgrade",
      description: "Launched advanced analytics and AI-powered insights features",
      icon: <Zap className="w-5 h-5" />
    },
    {
      year: "2024",
      title: "Industry Recognition",
      description: "Named 'Best Fitness CRM Platform' by Fitness Tech Awards",
      icon: <Award className="w-5 h-5" />
    },
    {
      year: "2025",
      title: "Global Expansion",
      description: "Serving 10,000+ fitness businesses worldwide with 99.9% uptime",
      icon: <Globe className="w-5 h-5" />
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header />
      
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

      {/* Timeline Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-6 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700">
                <Clock className="w-4 h-4 mr-2" />
                Our Journey
              </Badge>
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Milestones & Achievements
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                From startup to industry leader – here's how we've grown alongside our customers.
              </p>
            </motion.div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-600"></div>
              
              <div className="space-y-12">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.year}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="relative flex items-start gap-8"
                  >
                    {/* Timeline dot */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                      {React.cloneElement(milestone.icon, { className: "w-6 h-6 text-white" })}
                    </div>
                    
                    {/* Content */}
                    <Card className="flex-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                            {milestone.year}
                          </Badge>
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                          {milestone.title}
                        </h4>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {milestone.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
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
      <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
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
                <Dumbbell className="w-4 h-4 mr-2" />
                Join Our Mission
              </Badge>
              
              <h2 className="text-4xl font-bold text-white mb-6 sm:text-5xl">
                Ready to Transform Your
                <br />
                Fitness Business?
              </h2>
              
              <p className="text-xl text-white/90 mb-10 leading-relaxed max-w-3xl mx-auto">
                Join thousands of fitness professionals who've already transformed their businesses with MuscleCRM. 
                Start your journey today and see why we're the trusted choice for fitness management worldwide.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-white/90 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 group"
                  onClick={() => window.location.href = '/signup'}
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Button 
                  size="lg" 
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20 px-8 py-4 text-lg font-semibold backdrop-blur-sm group"
                  onClick={() => window.location.href = '/contact'}
                >
                  Contact Us
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
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