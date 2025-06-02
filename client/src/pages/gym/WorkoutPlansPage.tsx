
import React from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Plus, Search, Filter } from 'lucide-react';
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

// Mock data for workout plans
const workoutPlans = [
  { 
    id: 1, 
    name: 'Beginner Strength Training', 
    duration: '4 weeks',
    difficulty: 'Beginner',
    description: 'A complete workout plan for beginners focusing on building strength and proper form.'
  },
  { 
    id: 2, 
    name: 'Intermediate Hypertrophy', 
    duration: '6 weeks',
    difficulty: 'Intermediate',
    description: 'Focus on muscle growth with progressive overload techniques and proper nutrition guidance.'
  },
  { 
    id: 3, 
    name: 'Advanced Powerlifting', 
    duration: '8 weeks',
    difficulty: 'Advanced',
    description: 'Specialized training program for competitive powerlifters focusing on the big three lifts.'
  },
  { 
    id: 4, 
    name: 'Functional Fitness', 
    duration: '4 weeks',
    difficulty: 'All Levels',
    description: 'Improve everyday movement patterns and build practical strength for daily activities.'
  },
  { 
    id: 5, 
    name: 'HIIT Cardio Program', 
    duration: '3 weeks',
    difficulty: 'Intermediate',
    description: 'High-intensity interval training to improve cardiovascular health and burn fat efficiently.'
  },
];

const WorkoutPlansPage: React.FC = () => {
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
            <h1 className="text-2xl font-bold tracking-tight">Workout Plans</h1>
            <p className="text-muted-foreground">
              Create and manage workout programs for your clients.
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Plan
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workout plans..."
              className="pl-8"
            />
          </div>
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workoutPlans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="p-2 rounded-full bg-primary/10">
                    <Dumbbell className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <CardDescription>
                  <div className="flex gap-2 mt-1">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/10">
                      {plan.duration}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/10">
                      {plan.difficulty}
                    </span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">View Details</Button>
                <Button variant="outline" size="sm">Assign</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default WorkoutPlansPage;
