import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/config';

interface Customer {
  _id: string;
  name: string;
}

interface WorkoutPlan {
  _id: string;
  name: string;
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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memberId: '',
      planId: '',
      startDate: '',
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
        setWorkoutPlans(plansRes.data.plans);
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
      const selectedMember = customers.find(c => c._id === data.memberId);
      if (!selectedMember) {
        toast.error('Selected member not found');
        return;
      }

      await axios.post(`${API_URL}/workout-plans/assign`, {
        ...data,
        memberName: selectedMember.name
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

  if (loading) {
    return (
      <DashboardLayout>
        <div>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Assign Workout Plan</h1>
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="memberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Member</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer._id} value={customer._id}>
                              {customer.name}
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
                      <FormLabel>Workout Plan</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select workout plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {workoutPlans.map((plan) => (
                            <SelectItem key={plan._id} value={plan._id}>
                              {plan.name}
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
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Optional notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard/gym/workout-plans/assigned')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Assign Plan</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AssignWorkoutPlanPage; 