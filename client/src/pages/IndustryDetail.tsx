
import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Dumbbell, GlassWater, Hotel, Users, Calendar, CreditCard, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  description: string;
  color: string;
  icon: React.ReactNode;
  modules: IndustryModule[];
}

const IndustryDetail: React.FC = () => {
  const { industry } = useParams<{ industry: string }>();
  const navigate = useNavigate();
  const { setSelectedIndustry } = useIndustry();

  // Industry-specific data
  const industryData: Record<string, IndustryData> = {
    gym: {
      name: 'gym',
      title: 'CRM for Gyms & Fitness Centers',
      description: 'Streamline member management, automate class bookings, and grow your fitness business with our specialized gym CRM.',
      color: 'bg-gym',
      icon: <Dumbbell className="w-16 h-16 text-white" />,
      modules: [
        {
          name: 'Workout Plan Builder',
          description: 'Create and assign personalized workout plans for your members.',
          icon: <Dumbbell className="w-5 h-5" />
        },
        {
          name: 'Trainer Scheduling',
          description: 'Manage trainer availability and class assignments in one place.',
          icon: <Calendar className="w-5 h-5" />
        },
        {
          name: 'Attendance Tracking',
          description: 'Track member check-ins and class attendance for better engagement.',
          icon: <Users className="w-5 h-5" />
        }
      ]
    },
    spa: {
      name: 'spa',
      title: 'CRM for Spas & Wellness Centers',
      description: 'Manage appointments, services, and client relationships effortlessly with our spa-focused CRM solution.',
      color: 'bg-spa',
      icon: <Waves className="w-16 h-16 text-white" />,
      modules: [
        {
          name: 'Services Catalog',
          description: 'Organize and showcase your spa services with pricing and duration.',
          icon: <Waves className="w-5 h-5" />
        },
        {
          name: 'Therapist Calendar',
          description: 'Manage therapist schedules and availability for optimal staffing.',
          icon: <Calendar className="w-5 h-5" />
        },
        {
          name: 'Slot Booking',
          description: 'Allow clients to book specific time slots for their preferred services.',
          icon: <Calendar className="w-5 h-5" />
        }
      ]
    },
    hotel: {
      name: 'hotel',
      title: 'CRM for Hotels & Resorts',
      description: 'Enhance guest experiences, streamline reservations, and boost occupancy with our hotel-specific CRM.',
      color: 'bg-hotel',
      icon: <Hotel className="w-16 h-16 text-white" />,
      modules: [
        {
          name: 'Room Management',
          description: 'Manage room inventory, pricing, and availability in real-time.',
          icon: <Hotel className="w-5 h-5" />
        },
        {
          name: 'Housekeeping',
          description: 'Track room cleaning status and maintenance schedules efficiently.',
          icon: <Users className="w-5 h-5" />
        },
        {
          name: 'Check-in/Check-out',
          description: 'Streamline guest arrival and departure processes for smoother operations.',
          icon: <Calendar className="w-5 h-5" />
        }
      ]
    },
    club: {
      name: 'club',
      title: 'CRM for Clubs & Entertainment Venues',
      description: 'Manage memberships, events, and guest lists seamlessly with our club-oriented CRM platform.',
      color: 'bg-club',
      icon: <GlassWater className="w-16 h-16 text-white" />,
      modules: [
        {
          name: 'Membership Management',
          description: 'Track memberships, renewals, and benefits in a comprehensive system.',
          icon: <Users className="w-5 h-5" />
        },
        {
          name: 'Event Scheduling',
          description: 'Plan and promote club events with ticketing and attendance tracking.',
          icon: <Calendar className="w-5 h-5" />
        },
        {
          name: 'Guest Pass Logs',
          description: 'Issue and monitor guest passes for controlled access to your club.',
          icon: <GlassWater className="w-5 h-5" />
        }
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

  // Core features that are shared across all industries
  const coreFeatures = [
    { name: 'Customers', description: 'Comprehensive customer database with history and preferences' },
    { name: 'Bookings', description: 'Flexible booking system with calendar integration' },
    { name: 'Invoices', description: 'Create and manage invoices with payment tracking' },
    { name: 'Dashboard', description: 'Customizable dashboard with key business metrics' },
    { name: 'Reports', description: 'Detailed reports on customers, bookings, and revenue' },
    { name: 'Notifications', description: 'Automated email and SMS notifications' }
  ];

  const handleBuyClick = () => {
    setSelectedIndustry(data.name as any);
    navigate('/setup');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className={`pt-20 ${data.color}`}>
        <div className="container px-4 py-16 mx-auto sm:px-6 lg:px-8 sm:py-24">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-white/20">
                {data.icon}
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                {data.title}
              </h1>
              <p className="max-w-2xl mt-4 text-lg text-white/90">
                {data.description}
              </p>
              <div className="mt-8">
                <Button size="lg" variant="secondary" onClick={handleBuyClick}>
                  Buy FlexCRM for {data.name.charAt(0).toUpperCase() + data.name.slice(1)}
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="w-full h-[400px] bg-white/10 rounded-lg border border-white/20 backdrop-blur-sm shadow-lg">
                <div className="absolute p-2 text-sm text-white rounded-md top-10 left-10 bg-white/10">
                  Dashboard Preview
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="py-16 sm:py-24">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What's Included</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A comprehensive CRM solution tailored for your {data.name} business.
            </p>
          </div>

          <div className="grid gap-16 lg:grid-cols-2">
            {/* Core Features */}
            <div>
              <h3 className="mb-6 text-xl font-semibold">Core CRM Features</h3>
              <ul className="space-y-4">
                {coreFeatures.map((feature) => (
                  <li key={feature.name} className="flex">
                    <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 mr-3 rounded-full bg-primary/10">
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{feature.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Industry-Specific Modules */}
            <div>
              <h3 className="mb-6 text-xl font-semibold">{data.name.charAt(0).toUpperCase() + data.name.slice(1)}-Specific Modules</h3>
              <ul className="space-y-4">
                {data.modules.map((module) => (
                  <li key={module.name} className="flex">
                    <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 mr-3 rounded-full bg-primary/10">
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{module.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50 sm:py-24">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Pricing</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Affordable plans for businesses of all sizes.
            </p>
          </div>

          <div className="max-w-lg p-8 mx-auto rounded-lg shadow-sm bg-background">
            <h3 className="text-xl font-semibold">{data.name.charAt(0).toUpperCase() + data.name.slice(1)} CRM Package</h3>
            <div className="flex items-baseline mt-4">
              <span className="text-4xl font-bold">$99</span>
              <span className="ml-2 text-muted-foreground">/month</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Includes all core CRM features plus {data.name}-specific modules.
            </p>

            <ul className="mt-6 space-y-3">
              <li className="flex items-center">
                <Check className="w-5 h-5 mr-2 text-primary" />
                <span>Unlimited customers</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 mr-2 text-primary" />
                <span>All core CRM features</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 mr-2 text-primary" />
                <span>All {data.name}-specific modules</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 mr-2 text-primary" />
                <span>Free updates</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 mr-2 text-primary" />
                <span>Email support</span>
              </li>
            </ul>

            <div className="mt-8">
              <Button className="w-full" onClick={handleBuyClick}>
                Buy CRM for {data.name.charAt(0).toUpperCase() + data.name.slice(1)}
              </Button>
            </div>
            <p className="mt-4 text-xs text-center text-muted-foreground">
              No credit card required. 14-day free trial.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary sm:py-24">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Transform Your {data.name.charAt(0).toUpperCase() + data.name.slice(1)} Business?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Join hundreds of {data.name} businesses that trust FlexCRM.
            </p>
            <div className="flex flex-col justify-center gap-4 mt-8 sm:flex-row">
              <Button size="lg" variant="secondary" onClick={handleBuyClick}>
                Buy CRM Now
              </Button>
              <Button size="lg" variant="secondary" asChild>
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

export default IndustryDetail;
