import React, { useState, useEffect, useMemo } from 'react';
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
  User,
  Search,
  X
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
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allWorkoutPlans, setAllWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
  const [selectedMember, setSelectedMember] = useState<Customer | null>(null);
  
  // Search states
  const [customerSearch, setCustomerSearch] = useState('');
  const [planSearch, setPlanSearch] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [planDropdownOpen, setPlanDropdownOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memberId: '',
      planId: '',
      startDate: new Date().toISOString().split('T')[0], // Default to today
      notes: '',
    },
  });

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return allCustomers;
    
    const search = customerSearch.toLowerCase();
    return allCustomers.filter(customer => 
      customer.name.toLowerCase().includes(search) ||
      customer.email?.toLowerCase().includes(search) ||
      customer.membershipType?.toLowerCase().includes(search)
    );
  }, [allCustomers, customerSearch]);

  // Filter workout plans based on search
  const filteredWorkoutPlans = useMemo(() => {
    if (!planSearch.trim()) return allWorkoutPlans;
    
    const search = planSearch.toLowerCase();
    return allWorkoutPlans.filter(plan => 
      plan.name.toLowerCase().includes(search) ||
      plan.goal?.toLowerCase().includes(search) ||
      plan.level?.toLowerCase().includes(search)
    );
  }, [allWorkoutPlans, planSearch]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, plansRes] = await Promise.all([
          // Fetch all customers without pagination limit
          axios.get(`${API_URL}/customers`, {
            params: { 
              page: 1, 
              limit: 10000 // Large enough to get all customers
            },
            withCredentials: true
          }),
          // Fetch all workout plans without pagination limit
          axios.get(`${API_URL}/workout-plans`, {
            params: { 
              page: 1, 
              limit: 10000 // Large enough to get all plans
            },
            withCredentials: true
          }),
        ]);
        
        setAllCustomers(customersRes.data.customers || []);
        setAllWorkoutPlans(plansRes.data.workoutPlans || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch data');
        setAllCustomers([]);
        setAllWorkoutPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (data: FormData) => {
    try {
      // Find the selected member to get their name
      const member = allCustomers.find(c => c._id === data.memberId);
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
    const member = allCustomers.find(c => c._id === watchedMemberId);
    setSelectedMember(member || null);
  }, [watchedMemberId, allCustomers]);

  useEffect(() => {
    const plan = allWorkoutPlans.find(p => p._id === watchedPlanId);
    setSelectedPlan(plan || null);
  }, [watchedPlanId, allWorkoutPlans]);

  // Handle customer selection
  const handleCustomerSelect = (customerId: string) => {
    form.setValue('memberId', customerId);
    setCustomerDropdownOpen(false);
    setCustomerSearch('');
  };

  // Handle plan selection
  const handlePlanSelect = (planId: string) => {
    form.setValue('planId', planId);
    setPlanDropdownOpen(false);
    setPlanSearch('');
  };

  // Clear customer selection
  const clearCustomerSelection = () => {
    form.setValue('memberId', '');
    setSelectedMember(null);
    setCustomerSearch('');
  };

  // Clear plan selection
  const clearPlanSelection = () => {
    form.setValue('planId', '');
    setSelectedPlan(null);
    setPlanSearch('');
  };

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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Clients</p>
                  <p className="text-2xl font-bold text-blue-700">{allCustomers.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Workout Plans</p>
                  <p className="text-2xl font-bold text-green-700">{allWorkoutPlans.length}</p>
                </div>
                <Dumbbell className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Ready to Assign</p>
                  <p className="text-2xl font-bold text-purple-700">{selectedMember && selectedPlan ? '1' : '0'}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
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
                    {/* Client Selection with Search */}
                    <FormField
                      control={form.control}
                      name="memberId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Select Client ({filteredCustomers.length} available)
                          </FormLabel>
                          <div className="space-y-2">
                            {selectedMember ? (
                              <div className="flex items-center justify-between p-3 border rounded-md bg-green-50">
                                <div>
                                  <p className="font-medium">{selectedMember.name}</p>
                                  {selectedMember.email && (
                                    <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {selectedMember.membershipType && getMembershipBadge(selectedMember.membershipType)}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearCustomerSelection}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Search clients by name, email, or membership type..."
                                    value={customerSearch}
                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                    onFocus={() => setCustomerDropdownOpen(true)}
                                    className="pl-10"
                                  />
                                </div>
                                
                                {customerDropdownOpen && (
                                  <div className="relative border rounded-md bg-background shadow-lg max-h-80 overflow-hidden z-20">
                                    {/* Scrollable list container */}
                                    <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                                      {filteredCustomers.length > 0 ? (
                                        <>
                                          {/* Header showing count */}
                                          <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-3 py-2 text-xs text-muted-foreground border-b">
                                            {filteredCustomers.length} client{filteredCustomers.length !== 1 ? 's' : ''} found
                                          </div>
                                          
                                          {/* Customer list */}
                                          {filteredCustomers.map((customer, index) => (
                                            <div
                                              key={customer._id}
                                              className={`p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors ${
                                                index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                                              }`}
                                              onClick={() => handleCustomerSelect(customer._id)}
                                            >
                                              <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                  <p className="font-medium truncate">{customer.name}</p>
                                                  {customer.email && (
                                                    <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                                                  )}
                                                </div>
                                                <div className="flex-shrink-0 ml-2">
                                                  {customer.membershipType && getMembershipBadge(customer.membershipType)}
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </>
                                      ) : (
                                        <div className="p-6 text-center text-muted-foreground">
                                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                          <p className="font-medium">No clients found</p>
                                          <p className="text-sm">Try adjusting your search: "{customerSearch}"</p>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Scroll indicator */}
                                    {filteredCustomers.length > 8 && (
                                      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Workout Plan Selection with Search */}
                    <FormField
                      control={form.control}
                      name="planId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Dumbbell className="h-4 w-4" />
                            Select Workout Plan ({filteredWorkoutPlans.length} available)
                          </FormLabel>
                          <div className="space-y-2">
                            {selectedPlan ? (
                              <div className="flex items-center justify-between p-3 border rounded-md bg-green-50">
                                <div>
                                  <p className="font-medium">{selectedPlan.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {selectedPlan.goal && (
                                      <span className="text-sm text-muted-foreground">{selectedPlan.goal}</span>
                                    )}
                                    {selectedPlan.duration && (
                                      <span className="text-sm text-muted-foreground">• {selectedPlan.duration} weeks</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {selectedPlan.level && getLevelBadge(selectedPlan.level)}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearPlanSelection}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Search workout plans by name, goal, or level..."
                                    value={planSearch}
                                    onChange={(e) => setPlanSearch(e.target.value)}
                                    onFocus={() => setPlanDropdownOpen(true)}
                                    className="pl-10"
                                  />
                                </div>
                                
                                {planDropdownOpen && (
                                  <div className="relative border rounded-md bg-background shadow-lg max-h-80 overflow-hidden z-20">
                                    {/* Scrollable list container */}
                                    <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                                      {filteredWorkoutPlans.length > 0 ? (
                                        <>
                                          {/* Header showing count */}
                                          <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-3 py-2 text-xs text-muted-foreground border-b">
                                            {filteredWorkoutPlans.length} workout plan{filteredWorkoutPlans.length !== 1 ? 's' : ''} found
                                          </div>
                                          
                                          {/* Workout plans list */}
                                          {filteredWorkoutPlans.map((plan, index) => (
                                            <div
                                              key={plan._id}
                                              className={`p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors ${
                                                index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                                              }`}
                                              onClick={() => handlePlanSelect(plan._id)}
                                            >
                                              <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                  <p className="font-medium truncate">{plan.name}</p>
                                                  <div className="flex items-center gap-2 mt-1">
                                                    {plan.goal && (
                                                      <span className="text-sm text-muted-foreground truncate">{plan.goal}</span>
                                                    )}
                                                    {plan.duration && (
                                                      <span className="text-sm text-muted-foreground">• {plan.duration} weeks</span>
                                                    )}
                                                  </div>
                                                </div>
                                                <div className="flex-shrink-0 ml-2">
                                                  {plan.level && getLevelBadge(plan.level)}
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </>
                                      ) : (
                                        <div className="p-6 text-center text-muted-foreground">
                                          <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                          <p className="font-medium">No workout plans found</p>
                                          <p className="text-sm">Try adjusting your search: "{planSearch}"</p>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Scroll indicator */}
                                    {filteredWorkoutPlans.length > 8 && (
                                      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
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
                        disabled={!selectedMember || !selectedPlan}
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
                  <p className="text-sm text-muted-foreground">Search and choose a client to see their details</p>
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
                  <p className="text-sm text-muted-foreground">Search and choose a workout plan to see details</p>
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

        {/* Click outside to close dropdowns */}
        {(customerDropdownOpen || planDropdownOpen) && (
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => {
              setCustomerDropdownOpen(false);
              setPlanDropdownOpen(false);
            }}
          />
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default AssignWorkoutPlanPage;