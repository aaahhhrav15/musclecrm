
import React from 'react';
import { motion } from 'framer-motion';
import { Waves, Plus, Search, Filter, Clock, DollarSign } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';

// Mock data for spa services
const spaServices = [
  { 
    id: 1, 
    name: 'Swedish Massage', 
    duration: '60 min',
    price: '$85',
    description: 'A gentle full body massage that is perfect for people who are new to massage or want to relax.'
  },
  { 
    id: 2, 
    name: 'Deep Tissue Massage', 
    duration: '90 min',
    price: '$120',
    description: 'A therapeutic massage that focuses on realigning deeper layers of muscles and connective tissue.'
  },
  { 
    id: 3, 
    name: 'Hot Stone Massage', 
    duration: '75 min',
    price: '$110',
    description: 'A specialty massage that uses smooth, heated stones as an extension of the therapist's hands.'
  },
  { 
    id: 4, 
    name: 'Aromatherapy Facial', 
    duration: '45 min',
    price: '$75',
    description: 'A refreshing facial treatment that combines essential oils to address skin concerns and promote relaxation.'
  },
  { 
    id: 5, 
    name: 'Deluxe Spa Package', 
    duration: '3 hours',
    price: '$250',
    description: 'Our premium package includes massage, facial, and body treatment for complete relaxation and rejuvenation.'
  },
];

const ServicesPage: React.FC = () => {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Spa Services</h1>
            <p className="text-muted-foreground">
              Manage your spa services and treatments.
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Service
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              className="pl-8"
            />
          </div>
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaServices.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{service.name}</CardTitle>
                  <div className="p-2 rounded-full bg-primary/10">
                    <Waves className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <CardDescription>
                  <div className="flex gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/10">
                      <Clock className="h-3 w-3" /> {service.duration}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/10">
                      <DollarSign className="h-3 w-3" /> {service.price}
                    </span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">Edit</Button>
                <Button variant="outline" size="sm">View Bookings</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default ServicesPage;
