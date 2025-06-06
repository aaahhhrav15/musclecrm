import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/lib/constants';

const staffFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  position: z.string().min(1, 'Position is required'),
  hireDate: z.string().min(1, 'Hire date is required'),
  status: z.enum(['Active', 'Inactive', 'On Leave']),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

interface StaffFormProps {
  onSuccess?: () => void;
  initialData?: StaffFormValues;
  staffId?: string;
}

export function StaffForm({ onSuccess, initialData, staffId }: StaffFormProps) {
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: initialData || {
      name: '',
      email: '',
      phone: '',
      position: '',
      hireDate: new Date().toISOString().split('T')[0],
      status: 'Active',
    },
  });

  const onSubmit = async (data: StaffFormValues) => {
    try {
      if (staffId) {
        // Update existing staff
        await axios.put(`${API_URL}/gym/staff/${staffId}`, data, { withCredentials: true });
        toast.success('Staff member updated successfully');
      } else {
        // Create new staff
        await axios.post(`${API_URL}/gym/staff`, data, { withCredentials: true });
        toast.success('Staff member added successfully');
      }
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error saving staff:', error);
      toast.error('Failed to save staff member');
    }
  };

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        hireDate: new Date(initialData.hireDate).toISOString().split('T')[0]
      });
    }
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter staff name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="Enter phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Position</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Head Trainer">Head Trainer</SelectItem>
                  <SelectItem value="Personal Trainer">Personal Trainer</SelectItem>
                  <SelectItem value="Yoga Instructor">Yoga Instructor</SelectItem>
                  <SelectItem value="Fitness Instructor">Fitness Instructor</SelectItem>
                  <SelectItem value="Receptionist">Receptionist</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Cleaner">Cleaner</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hireDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Joining Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {staffId ? 'Update Staff' : 'Add Staff'}
        </Button>
      </form>
    </Form>
  );
} 