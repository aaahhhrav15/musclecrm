import * as React from 'react';
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
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
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
  paymentMode: z.enum(['Cash', 'Credit Card', 'Debit Card', 'Online', 'UPI'], {
    required_error: 'Please select a payment mode',
  }),
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
  paymentMode: z.enum(['Cash', 'Credit Card', 'Debit Card', 'Online', 'UPI']),
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
  price: number;
  currency?: string;
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
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [trainers, setTrainers] = React.useState<Trainer[]>([]);
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [equipment, setEquipment] = React.useState<Equipment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [openCustomerPopover, setOpenCustomerPopover] = React.useState(false);
  const [customerDropdownOpen, setCustomerDropdownOpen] = React.useState(false);
  const [customerSearch, setCustomerSearch] = React.useState('');
  const customerDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const filteredCustomers = React.useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const search = customerSearch.toLowerCase();
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(search) ||
      customer.email.toLowerCase().includes(search)
    );
  }, [customers, customerSearch]);

  React.useEffect(() => {
    if (!customerDropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target as Node)
      ) {
        setCustomerDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [customerDropdownOpen]);

  const [trainerDropdownOpen, setTrainerDropdownOpen] = React.useState(false);
  const [trainerSearch, setTrainerSearch] = React.useState('');
  const trainerDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const filteredTrainers = React.useMemo(() => {
    if (!trainerSearch.trim()) return trainers;
    const search = trainerSearch.toLowerCase();
    return trainers.filter(trainer =>
      trainer.name.toLowerCase().includes(search) ||
      trainer.email.toLowerCase().includes(search)
    );
  }, [trainers, trainerSearch]);

  React.useEffect(() => {
    if (!trainerDropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        trainerDropdownRef.current &&
        !trainerDropdownRef.current.contains(event.target as Node)
      ) {
        setTrainerDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [trainerDropdownOpen]);

  const [classDropdownOpen, setClassDropdownOpen] = React.useState(false);
  const [classSearch, setClassSearch] = React.useState('');
  const classDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const filteredClasses = React.useMemo(() => {
    if (!classSearch.trim()) return classes;
    const search = classSearch.toLowerCase();
    return classes.filter(cls =>
      cls.name.toLowerCase().includes(search)
    );
  }, [classes, classSearch]);

  React.useEffect(() => {
    if (!classDropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        classDropdownRef.current &&
        !classDropdownRef.current.contains(event.target as Node)
      ) {
        setClassDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [classDropdownOpen]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [customersResponse, trainersResponse, classesResponse] = await Promise.all([
          axios.get(`${API_URL}/customers`, { params: { limit: 10000 }, withCredentials: true }),
          axios.get(`${API_URL}/gym/staff`, { 
            params: { position: 'Personal Trainer' },
            withCredentials: true 
          }),
          axios.get(`${API_URL}/gym/class-schedules`, { withCredentials: true })
        ]);

        console.log('Classes Response:', classesResponse.data); // Debug log

        // Ensure we have arrays even if the response is empty
        setCustomers(Array.isArray(customersResponse.data.customers) ? customersResponse.data.customers : []);
        setTrainers(Array.isArray(trainersResponse.data.data) ? trainersResponse.data.data : 
                   Array.isArray(trainersResponse.data) ? trainersResponse.data : []);
        
        // Handle class schedules response
        if (classesResponse.data.success && Array.isArray(classesResponse.data.classSchedules)) {
          setClasses(classesResponse.data.classSchedules);
        } else if (Array.isArray(classesResponse.data)) {
          setClasses(classesResponse.data);
        } else {
          console.error('Unexpected class schedules response format:', classesResponse.data);
          setClasses([]);
        }
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
        paymentMode: booking.paymentMode || ('Cash' as const),
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
        paymentMode: 'Cash' as const,
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

  // Add effect to handle class selection
  React.useEffect(() => {
    if (selectedClass) {
      // Set the start and end time from the class schedule
      const startTime = new Date(selectedClass.startTime);
      const endTime = new Date(selectedClass.endTime);
      
      form.setValue('startTime', startTime);
      form.setValue('endTime', endTime);
      
      // Set the price from the class
      if (selectedClass.price) {
        form.setValue('price', selectedClass.price);
        if (selectedClass.currency) {
          form.setValue('currency', selectedClass.currency);
        }
      }
    }
  }, [selectedClass, form]);

  const handleSubmit = async (values: FormData) => {
    try {
      // Convert dates to ISO strings for the API
      const apiData: ApiData = {
        ...values,
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString(),
        price: values.price,
        currency: values.currency,
        paymentMode: values.paymentMode,
      };

      // Add service names based on type
      if (apiData.type === 'class') {
        const selectedClass = classes.find(c => c._id === values.classId);
        if (selectedClass) {
          // For new class bookings or when changing class
          apiData.classId = selectedClass._id;
          apiData.className = selectedClass.name;
          apiData.price = selectedClass.price;
          apiData.currency = selectedClass.currency || 'INR';
        } else if (booking) {
          // For editing existing class bookings without changing class
          apiData.classId = typeof booking.classId === 'string' ? booking.classId : booking.classId?._id || '';
          apiData.className = booking.className || '';
        }
      } else if (apiData.type === 'personal_training') {
        const selectedTrainer = trainers.find(t => t._id === values.trainerId);
        apiData.trainerId = values.trainerId;
        apiData.trainerName = selectedTrainer?.name || (booking?.trainerName || '');
      } else if (apiData.type === 'equipment') {
        const selectedEquipment = equipment.find(e => e._id === values.equipmentId);
        apiData.equipmentId = values.equipmentId;
        apiData.equipmentName = selectedEquipment?.name || (booking?.equipmentName || '');
      }

      // Log the data being sent
      console.log('Submitting booking with data:', apiData);

      const result = await onSubmit(apiData);
      if (result && result.success) {
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        queryClient.invalidateQueries({ queryKey: ['calendar'] });
        onClose();
      }
      // Let the parent component handle success/error messages
    } catch (error) {
      console.error('Error submitting booking:', error);
      // Let the parent component handle error messages
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  <div className="space-y-2" ref={customerDropdownRef}>
                    {selectedCustomer ? (
                      <div className="flex items-center justify-between p-3 border rounded-md bg-green-50">
                        <div>
                          <p className="font-medium">{selectedCustomer.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            form.setValue('customerId', '');
                            setCustomerSearch('');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search customers by name or email..."
                            value={customerSearch}
                            onChange={e => setCustomerSearch(e.target.value)}
                            onFocus={() => setCustomerDropdownOpen(true)}
                            className="pl-10"
                          />
                        </div>
                        {customerDropdownOpen && (
                          <div className="relative border rounded-md bg-background shadow-lg max-h-80 overflow-hidden z-20">
                            <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                              {filteredCustomers.length > 0 ? (
                                <>
                                  <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-3 py-2 text-xs text-muted-foreground border-b">
                                    {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} found
                                  </div>
                                  {filteredCustomers.map((customer, index) => (
                                    <div
                                      key={customer._id}
                                      className={`p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}
                                      onClick={() => {
                                        form.setValue('customerId', customer._id);
                                        setCustomerDropdownOpen(false);
                                        setCustomerSearch('');
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium truncate">{customer.name}</p>
                                          <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </>
                              ) : (
                                <div className="p-6 text-center text-muted-foreground">
                                  <p className="font-medium">No customers found</p>
                                  <p className="text-sm">Try adjusting your search: "{customerSearch}"</p>
                                </div>
                              )}
                            </div>
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
                            {`${cls.name} - ${formatCurrency(cls.price, cls.currency || 'INR')}`}
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
                        readOnly={bookingType === 'class' && selectedClass !== undefined}
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
                        readOnly={bookingType === 'class' && selectedClass !== undefined}
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

            {/* Price and Currency */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
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
                          readOnly={bookingType === 'class' && selectedClass !== undefined}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          value={field.value || 'INR'}
                          readOnly={bookingType === 'class' && selectedClass !== undefined}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="paymentMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Mode</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a payment mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Credit Card">Credit Card</SelectItem>
                          <SelectItem value="Debit Card">Debit Card</SelectItem>
                          <SelectItem value="Online">Online</SelectItem>
                          <SelectItem value="UPI">UPI</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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