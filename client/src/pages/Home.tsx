
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dumbbell, GlassWater, Hotel, Waves, Users, Calendar, CreditCard, ChevronRight, ArrowRight, CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import IndustryCard from '@/components/common/IndustryCard';
import FeatureCard from '@/components/common/FeatureCard';
import TestimonialCard from '@/components/common/TestimonialCard';
import PricingCard from '@/components/common/PricingCard';

const Home: React.FC = () => {
  // Industry data
  const industries = [
    {
      title: 'Gym CRM',
      description: 'Complete CRM solution for fitness centers, gyms, and personal trainers.',
      icon: <Dumbbell className="w-6 h-6 text-white" />,
      color: 'gym',
      path: '/industries/gym'
    },
    {
      title: 'Spa CRM',
      description: 'Tailored CRM for spas, salons, and wellness centers.',
      icon: <Waves className="w-6 h-6 text-white" />,
      color: 'spa',
      path: '/industries/spa'
    },
    {
      title: 'Hotel CRM',
      description: 'Comprehensive CRM system for hotels, resorts, and hospitality businesses.',
      icon: <Hotel className="w-6 h-6 text-white" />,
      color: 'hotel',
      path: '/industries/hotel'
    },
    {
      title: 'Club CRM',
      description: 'Specialized CRM for clubs, entertainment venues, and membership-based businesses.',
      icon: <GlassWater className="w-6 h-6 text-white" />,
      color: 'club',
      path: '/industries/club'
    }
  ];

  // Feature data
  const features = [
    {
      title: 'Customer Management',
      description: 'Track customer details, preferences, activity history, and communications in one place.',
      icon: <Users className="w-5 h-5 text-primary" />
    },
    {
      title: 'Booking System',
      description: 'Flexible and customizable booking system with calendar integration and automatic reminders.',
      icon: <Calendar className="w-5 h-5 text-primary" />
    },
    {
      title: 'Invoice Management',
      description: 'Create, send, and track invoices effortlessly with flexible payment options.',
      icon: <CreditCard className="w-5 h-5 text-primary" />
    },
    {
      title: 'Analytics & Reporting',
      description: 'Gain insights with customizable reports and real-time dashboards to track business performance.',
      icon: <BarChart className="w-5 h-5 text-primary" />
    },
    {
      title: 'Notification System',
      description: 'Automated email and SMS notifications for bookings, invoices, and custom events.',
      icon: <BellIcon className="w-5 h-5 text-primary" />
    },
    {
      title: 'Industry-Specific Modules',
      description: 'Specialized features tailored to your industry needs with customizable workflows.',
      icon: <Layers className="w-5 h-5 text-primary" />
    }
  ];

  // Pricing data
  const pricing = [
    {
      title: 'Starter',
      price: '$49',
      description: 'Essential features for small businesses',
      features: [
        { text: 'Up to 500 customers', included: true },
        { text: 'Basic booking system', included: true },
        { text: 'Invoice management', included: true },
        { text: 'Email notifications', included: true },
        { text: 'Core reports', included: true },
        { text: 'Industry modules', included: false },
        { text: 'SMS notifications', included: false },
        { text: 'API access', included: false }
      ],
      buttonText: 'Get Started',
      buttonLink: '/signup'
    },
    {
      title: 'Professional',
      price: '$99',
      description: 'Comprehensive solution for growing businesses',
      features: [
        { text: 'Unlimited customers', included: true },
        { text: 'Advanced booking system', included: true },
        { text: 'Invoice management', included: true },
        { text: 'Email & SMS notifications', included: true },
        { text: 'Advanced reports', included: true },
        { text: '2 Industry modules', included: true },
        { text: 'API access', included: true },
        { text: 'Premium support', included: false }
      ],
      buttonText: 'Get Started',
      buttonLink: '/signup',
      highlighted: true
    },
    {
      title: 'Enterprise',
      price: 'Custom',
      description: 'Tailored solution for large organizations',
      features: [
        { text: 'Unlimited customers', included: true },
        { text: 'Advanced booking system', included: true },
        { text: 'Invoice management', included: true },
        { text: 'Email & SMS notifications', included: true },
        { text: 'Custom reports', included: true },
        { text: 'All industry modules', included: true },
        { text: 'API access', included: true },
        { text: 'Dedicated support', included: true }
      ],
      buttonText: 'Contact Sales',
      buttonLink: '/contact'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header transparent />
      
      {/* Hero Section */}
      <section className="relative pt-24 overflow-hidden bg-gradient-to-b from-background to-secondary/20">
        <div className="container relative z-10 px-4 py-20 mx-auto text-center sm:px-6 lg:px-8 sm:py-24 lg:py-32">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            One CRM Platform. <br />
            <span className="text-primary">Any Industry.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-2xl mx-auto mt-6 text-lg text-muted-foreground sm:text-xl"
          >
            FlexCRM adapts to your industry needs with specialized modules and customizable workflows. Manage customers, bookings, and invoices all in one place.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col justify-center gap-4 mt-8 sm:flex-row"
          >
            <Button size="lg" asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">Book a Demo</Link>
            </Button>
          </motion.div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[1000px] h-[1000px] rounded-full bg-primary/5 -right-[300px] -top-[300px]"></div>
          <div className="absolute w-[800px] h-[800px] rounded-full bg-primary/5 -left-[200px] -bottom-[300px]"></div>
        </div>
      </section>

      {/* Industry Cards Section */}
      <section className="py-16 bg-gray-50 sm:py-24">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Tailored for Your Industry</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose your industry to discover specialized CRM features designed for your business needs.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {industries.map((industry, index) => (
              <IndustryCard
                key={industry.title}
                title={industry.title}
                description={industry.description}
                icon={industry.icon}
                color={industry.color}
                path={industry.path}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Powerful CRM Features</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Core functionality available in every FlexCRM package, regardless of your industry.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50 sm:py-24" id="pricing">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose the plan that works best for your business needs.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {pricing.map((plan, index) => (
              <PricingCard
                key={plan.title}
                title={plan.title}
                price={plan.price}
                description={plan.description}
                features={plan.features}
                buttonText={plan.buttonText}
                buttonLink={plan.buttonLink}
                highlighted={plan.highlighted}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What Our Customers Say</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Trusted by businesses across different industries.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <TestimonialCard
              quote="FlexCRM has completely transformed how we manage our gym. The member tracking and workout planning modules are game-changers for our trainers."
              author="Alex Johnson"
              role="Owner"
              company="Flex Fitness Center"
              delay={0.1}
            />
            <TestimonialCard
              quote="The booking system is so intuitive that our therapists picked it up without any training. Our customers love the automated reminders."
              author="Sarah Williams"
              role="Manager"
              company="Serenity Spa"
              delay={0.2}
            />
            <TestimonialCard
              quote="Managing room bookings and check-ins has never been easier. The specialized hotel modules saved us from buying multiple software solutions."
              author="Michael Thompson"
              role="General Manager"
              company="Harbor View Hotel"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary sm:py-24">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Transform Your Business?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Join thousands of businesses that trust FlexCRM to manage their operations.
            </p>
            <div className="flex flex-col justify-center gap-4 mt-8 sm:flex-row">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary" asChild>
                <Link to="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

// These are placeholder components for the icons not already imported
const BellIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

const BarChart: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
);

const Layers: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
    <polyline points="2 17 12 22 22 17"></polyline>
    <polyline points="2 12 12 17 22 12"></polyline>
  </svg>
);

export default Home;
