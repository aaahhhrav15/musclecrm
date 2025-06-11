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
  className: z.string().optional(),
  trainerName: z.string().optional(),
  equipmentName: z.string().optional(),
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
  startTime: string;
  endTime: string;
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
    const fetchData = async () => {
      try {
        setLoading(true);
        const [customersResponse, trainersResponse, classesResponse] = await Promise.all([
          axios.get(`${API_URL}/customers`, { withCredentials: true }),
          axios.get(`${API_URL}/gym/staff`, { 
            params: { position: 'Personal Trainer' },
            withCredentials: true 
          }),
          axios.get(`${API_URL}/gym/class-schedules`, { withCredentials: true })
        ]);

        // Ensure we have arrays even if the response is empty
        setCustomers(Array.isArray(customersResponse.data.customers) ? customersResponse.data.customers : []);
        setTrainers(Array.isArray(trainersResponse.data.data) ? trainersResponse.data.data : 
                   Array.isArray(trainersResponse.data) ? trainersResponse.data : []);
        setClasses(Array.isArray(classesResponse.data) ? classesResponse.data : []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load form data');
        setCustomers([]);
        setTrainers([]);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchData();
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
        classId: typeof booking.classId === 'string' ? booking.classId : booking.classId?._id || '',
        trainerId: typeof booking.trainerId === 'string' ? booking.trainerId : booking.trainerId?._id || '',
        equipmentId: typeof booking.equipmentId === 'string' ? booking.equipmentId : booking.equipmentId?._id || '',
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
  const selectedClassId = form.watch('classId');
  const selectedClass = Array.isArray(classes) ? classes.find((cls) => cls._id === selectedClassId) : undefined;

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

      // Add service names based on type
      if (apiData.type === 'class' && selectedClass) {
        apiData.classId = values.classId;
        apiData.className = selectedClass.name;
      } else if (apiData.type === 'personal_training') {
        const selectedTrainer = trainers.find(t => t._id === values.trainerId);
        apiData.trainerId = values.trainerId;
        apiData.trainerName = selectedTrainer?.name || '';
      } else if (apiData.type === 'equipment') {
        const selectedEquipment = equipment.find(e => e._id === values.equipmentId);
        apiData.equipmentId = values.equipmentId;
        apiData.equipmentName = selectedEquipment?.name || '';
      }

      const result = await onSubmit(apiData);
      if (result.success) {
        toast.success('Booking saved successfully');
        queryClient.invalidateQueries(['bookings']);
        onClose();
      } else {
        toast.error(result.message || 'Failed to save booking');
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast.error('Failed to save booking');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{booking ? 'Edit Booking' : 'New Booking'}</DialogTitle>
          <DialogDescription>
            {booking ? 'Update the booking details below.' : 'Fill in the booking details below.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Booking Type */}
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
                      <SelectItem value="personal_training">Personal Training</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Customer Selection */}
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

            {/* Class Selection (only shown for class bookings) */}
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
                        {classes.map((cls) => (
                          <SelectItem key={cls._id} value={cls._id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Trainer Selection (only shown for personal training bookings) */}
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
                        {trainers.map((trainer) => (
                          <SelectItem key={trainer._id} value={trainer._id}>
                            {trainer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Equipment Selection (only shown for equipment bookings) */}
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
                        {equipment.map((item) => (
                          <SelectItem key={item._id} value={item._id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Date and Time Selection */}
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
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
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
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status Selection */}
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

            {/* Price */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      step="0.01"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        field.onChange(value);
                      }}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : booking ? 'Update Booking' : 'Create Booking'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingForm; 