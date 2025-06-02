import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parse } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
import { Booking } from '@/services/BookingService';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/config';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

// Form schema for the form data
const formSchema = z.object({
  type: z.enum(['class', 'personal_training', 'equipment'], {
    required_error: 'Please select a booking type',
  }),
  customerId: z.string().min(1, 'Please select a customer'),
  startTime: z.date({
    required_error: 'Please select a start time',
  }),
  endTime: z.date({
    required_error: 'Please select an end time',
  }),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show'], {
    required_error: 'Please select a status',
  }),
  notes: z.string().optional(),
  classId: z.string().optional(),
  trainerId: z.string().optional(),
  equipmentId: z.string().optional(),
  price: z.number().min(0, 'Price must be greater than or equal to 0'),
  currency: z.string().default('INR'),
}).superRefine((data, ctx) => {
  // Validate required fields based on booking type
  if (data.type === 'class' && !data.classId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select a class',
      path: ['classId'],
    });
  }
  if (data.type === 'personal_training' && !data.trainerId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select a trainer',
      path: ['trainerId'],
    });
  }
  if (data.type === 'equipment' && !data.equipmentId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select equipment',
      path: ['equipmentId'],
    });
  }
  // Validate end time is after start time
  if (data.startTime >= data.endTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'End time must be after start time',
      path: ['endTime'],
    });
  }
});

// API data schema for the submitted data
const apiDataSchema = z.object({
  type: z.enum(['class', 'personal_training', 'equipment']),
  customerId: z.string().min(1),
  startTime: z.string(),
  endTime: z.string(),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']),
  notes: z.string().optional(),
  classId: z.string().optional(),
  trainerId: z.string().optional(),
  equipmentId: z.string().optional(),
  price: z.number().min(0),
  currency: z.string(),
});

type FormData = z.infer<typeof formSchema>;
type ApiData = z.infer<typeof apiDataSchema>;

interface BookingFormProps {
  open: boolean;
  onClose: () => void;
  booking?: Booking;
  onSubmit: (data: ApiData) => Promise<{ success: boolean; message?: string }>;
}

interface Customer {
  _id: string;
  name: string;
  email: string;
}

interface Trainer {
  _id: string;
  name: string;
  email: string;
}

interface Class {
  _id: string;
  name: string;
  description: string;
}

interface Equipment {
  _id: string;
  name: string;
  description: string;
}

const BookingForm: React.FC<BookingFormProps> = ({
  open,
  onClose,
  booking,
  onSubmit,
}) => {
  const queryClient = useQueryClient();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCustomerPopover, setOpenCustomerPopover] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(`${API_URL}/customers`, { withCredentials: true });
        setCustomers(response.data.customers);
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast.error('Failed to load customers');
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchCustomers();
    }
  }, [open]);

  const defaultValues = booking
    ? {
        type: booking.type,
        customerId: typeof booking.customerId === 'string' ? booking.customerId : booking.customerId._id,
        startTime: new Date(booking.startTime),
        endTime: new Date(booking.endTime),
        status: booking.status,
        notes: booking.notes || '',
        classId: booking.classId || '',
        trainerId: booking.trainerId || '',
        equipmentId: booking.equipmentId || '',
        price: booking.price,
        currency: booking.currency || 'INR',
      }
    : {
        type: 'class' as const,
        customerId: '',
        status: 'scheduled' as const,
        startTime: new Date(),
        endTime: new Date(new Date().setHours(new Date().getHours() + 1)),
        notes: '',
        classId: '',
        trainerId: '',
        equipmentId: '',
        price: 0,
        currency: 'INR',
      };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const bookingType = form.watch('type');
  const selectedCustomerId = form.watch('customerId');
  const selectedCustomer = customers.find(c => c._id === selectedCustomerId);

  const handleSubmit = async (values: FormData) => {
    try {
      // Convert dates to ISO strings for the API
      const apiData: ApiData = {
        ...values,
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString(),
        price: values.price,
        currency: values.currency,
      };

      // Clear type-specific fields that aren't needed
      if (apiData.type !== 'class') {
        apiData.classId = undefined;
      }
      if (apiData.type !== 'personal_training') {
        apiData.trainerId = undefined;
      }
      if (apiData.type !== 'equipment') {
        apiData.equipmentId = undefined;
      }

      // Validate required fields based on booking type
      if (apiData.type === 'class' && !apiData.classId) {
        toast.error('Please select a class');
        return;
      }
      if (apiData.type === 'personal_training' && !apiData.trainerId) {
        toast.error('Please select a trainer');
        return;
      }
      if (apiData.type === 'equipment' && !apiData.equipmentId) {
        toast.error('Please select equipment');
        return;
      }

      console.log('Submitting booking with data:', apiData);
      const response = await onSubmit(apiData);
      
      if (response?.success) {
        toast.success(response.message || (booking ? 'Booking updated successfully' : 'Booking created successfully'));
        // Close the form
        onClose();
        // Invalidate and refetch bookings query
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        // Invalidate and refetch invoices query
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
      } else {
        toast.error(response?.message || (booking ? 'Failed to update booking' : 'Failed to create booking'));
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      const errorMessage = error instanceof Error ? error.message : (booking ? 'Failed to update booking' : 'Failed to create booking');
      toast.error(errorMessage);
    }
  };

  const getDefaultPrice = (type: string) => {
    switch (type) {
      case 'class':
        return 500; // ₹500 per class
      case 'personal_training':
        return 1000; // ₹1000 per session
      case 'equipment':
        return 200; // ₹200 per hour
      default:
        return 0;
    }
  };

  // Update price when type changes
  useEffect(() => {
    const type = form.getValues('type');
    form.setValue('price', getDefaultPrice(type));
  }, [bookingType]);

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
            <DialogDescription>Please wait while we load the form data.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {booking ? 'Edit Booking' : 'Create New Booking'}
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to {booking ? 'update' : 'create'} a booking.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booking Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select booking type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="class">Class</SelectItem>
                      <SelectItem value="personal_training">
                        Personal Training
                      </SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers && customers.length > 0 ? (
                        customers.map((customer) => (
                          <SelectItem key={customer._id} value={customer._id}>
                            {customer.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          No customers available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={field.value}
                        onChange={field.onChange}
                        showTimeSelect
                        dateFormat="MMMM d, yyyy h:mm aa"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        minDate={new Date()}
                        placeholderText="Select start date and time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={field.value}
                        onChange={field.onChange}
                        showTimeSelect
                        dateFormat="MMMM d, yyyy h:mm aa"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        minDate={form.getValues('startTime')}
                        placeholderText="Select end date and time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {bookingType === 'class' && (
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="class1">Class 1</SelectItem>
                        <SelectItem value="class2">Class 2</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {bookingType === 'personal_training' && (
              <FormField
                control={form.control}
                name="trainerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trainer</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a trainer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="trainer1">Trainer 1</SelectItem>
                        <SelectItem value="trainer2">Trainer 2</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {bookingType === 'equipment' && (
              <FormField
                control={form.control}
                name="equipmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipment</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select equipment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="treadmill">Treadmill</SelectItem>
                        <SelectItem value="elliptical">Elliptical Machine</SelectItem>
                        <SelectItem value="weights">Weight Set</SelectItem>
                        <SelectItem value="yoga_mat">Yoga Mat</SelectItem>
                        <SelectItem value="exercise_ball">Exercise Ball</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <Input 
                      {...field} 
                      value={field.value || ''} 
                      placeholder="Add any additional notes (optional)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      value={field.value}
                      min={0}
                      step={0.01}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {booking ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingForm; 