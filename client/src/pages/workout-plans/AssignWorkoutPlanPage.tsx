import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import * as z from 'zod';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/config';
import { 
  ArrowLeft, 
  UserPlus, 
  Users, 
  Dumbbell, 
  Calendar, 
  FileText,
  CheckCircle,
  Clock,
  Target,
  Award,
  Activity,
  User
} from 'lucide-react';

interface Customer {
  _id: string;
  name: string;
  email?: string;
  membershipType?: string;
}

interface WorkoutPlan {
  _id: string;
  name: string;
  goal?: string;
  level?: string;
  duration?: number;
}

const formSchema = z.object({
  memberId: z.string().min(1, 'Member is required'),
  planId: z.string().min(1, 'Workout plan is required'),
  startDate: z.string().min(1, 'Start date is required'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const AssignWorkoutPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
  const [selectedMember, setSelectedMember] = useState<Customer | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memberId: '',
      planId: '',
      startDate: new Date().toISOString().split('T')[0], // Default to today
      notes: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, plansRes] = await Promise.all([
          axios.get(`${API_URL}/customers`, {
            withCredentials: true
          }),
          axios.get(`${API_URL}/workout-plans`, {
            withCredentials: true
          }),
        ]);
        setCustomers(customersRes.data.customers);
        setWorkoutPlans(plansRes.data.workoutPlans);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (data: FormData) => {
    try {
      // Find the selected member to get their name
      const member = customers.find(c => c._id === data.memberId);
      if (!member) {
        toast.error('Selected member not found');
        return;
      }

      await axios.post(`${API_URL}/workout-plans/assign`, {
        ...data,
        memberName: member.name
      }, {
        withCredentials: true,
      });
      toast.success('Workout plan assigned successfully');
      navigate('/dashboard/gym/workout-plans/assigned');
    } catch (error) {
      console.error('Error assigning workout plan:', error);
      toast.error('Failed to assign workout plan');
    }
  };

  const handleGoBack = () => {
    navigate('/dashboard/gym/workout-plans/assigned');
  };

  const getLevelBadge = (level?: string) => {
    if (!level) return null;
    switch (level.toLowerCase()) {
      case 'beginner':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Beginner</Badge>;
      case 'intermediate':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Intermediate</Badge>;
      case 'advanced':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Advanced</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const getMembershipBadge = (type?: string) => {
    if (!type) return null;
    switch (type.toLowerCase()) {
      case 'vip':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">VIP</Badge>;
      case 'premium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Premium</Badge>;
      case 'basic':
        return <Badge variant="outline">Basic</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Watch form changes to update selected items
  const watchedMemberId = form.watch('memberId');
  const watchedPlanId = form.watch('planId');

  useEffect(() => {
    const member = customers.find(c => c._id === watchedMemberId);
    setSelectedMember(member || null);
  }, [watchedMemberId, customers]);

  useEffect(() => {
    const plan = workoutPlans.find(p => p._id === watchedPlanId);
    setSelectedPlan(plan || null);
  }, [watchedPlanId, workoutPlans]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[400px] bg-muted animate-pulse rounded" />
            <div className="h-[400px] bg-muted animate-pulse rounded" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-8"
      >
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-4 border-b">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Assignments
              </Button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Assign Workout Plan
            </h1>
            <p className="text-muted-foreground text-lg">
              Connect clients with personalized training programs tailored to their fitness goals.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-muted-foreground">
            <UserPlus className="h-5 w-5" />
            <span className="text-sm">Client Assignment</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Assignment Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-lg border-0">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-xl font-semibold flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Assignment Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="memberId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Select Client
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Choose a client to assign plan to" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers.map((customer) => (
                                <SelectItem key={customer._id} value={customer._id}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{customer.name}</span>
                                    {customer.membershipType && (
                                      <span className="ml-2">
                                        {getMembershipBadge(customer.membershipType)}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="planId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Dumbbell className="h-4 w-4" />
                            Select Workout Plan
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Choose a workout plan to assign" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {workoutPlans.map((plan) => (
                                <SelectItem key={plan._id} value={plan._id}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{plan.name}</span>
                                    {plan.level && (
                                      <span className="ml-2">
                                        {getLevelBadge(plan.level)}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Program Start Date
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Assignment Notes
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Add any specific instructions, modifications, or notes for this client assignment..."
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-4 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoBack}
                        className="px-6"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="px-6"
                        disabled={!form.formState.isValid}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Assign Plan
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preview Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Selected Client Preview */}
            {selectedMember ? (
              <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Selected Client
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{selectedMember.name}</h3>
                      {selectedMember.membershipType && getMembershipBadge(selectedMember.membershipType)}
                    </div>
                    {selectedMember.email && (
                      <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                    )}
                    <div className="pt-2 border-t border-muted-foreground/20">
                      <p className="text-xs text-muted-foreground">
                        This workout plan will be assigned to {selectedMember.name}'s profile
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-dashed border-muted">
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-medium text-muted-foreground">No Client Selected</h3>
                  <p className="text-sm text-muted-foreground">Choose a client to see their details</p>
                </CardContent>
              </Card>
            )}

            {/* Selected Plan Preview */}
            {selectedPlan ? (
              <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Dumbbell className="h-5 w-5" />
                    Selected Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{selectedPlan.name}</h3>
                      {selectedPlan.level && getLevelBadge(selectedPlan.level)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedPlan.goal && (
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedPlan.goal}</span>
                        </div>
                      )}
                      {selectedPlan.duration && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedPlan.duration} weeks</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-2 border-t border-muted-foreground/20">
                      <p className="text-xs text-muted-foreground">
                        This comprehensive training program will guide the client's fitness journey
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-dashed border-muted">
                <CardContent className="p-6 text-center">
                  <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-medium text-muted-foreground">No Plan Selected</h3>
                  <p className="text-sm text-muted-foreground">Choose a workout plan to see details</p>
                </CardContent>
              </Card>
            )}

            {/* Assignment Summary */}
            {selectedMember && selectedPlan && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-0 bg-gradient-to-r from-muted/30 to-muted/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Ready to Assign
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>{selectedMember.name}</strong> will be assigned to <strong>{selectedPlan.name}</strong></p>
                      <p className="text-muted-foreground">
                        The client will receive their personalized workout schedule and can track progress through their assigned program.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default AssignWorkoutPlanPage;