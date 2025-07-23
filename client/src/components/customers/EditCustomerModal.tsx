import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CustomerService, Customer, CustomerFormData, CustomerApiUpdateData } from '@/services/CustomerService';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

// Enhanced Date Picker Component (inline)
const EnhancedDatePicker = ({ 
  value, 
  onChange, 
  placeholder = "Pick a date", 
  disabled = false, 
  className = "",
  fromYear = 1950,
  toYear = new Date().getFullYear() + 2 
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState(value || new Date());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i);

  const handleMonthChange = (monthIndex) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(parseInt(monthIndex));
    setCurrentMonth(newDate);
  };

  const handleYearChange = (year) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(parseInt(year));
    setCurrentMonth(newDate);
  };

  const handleDateSelect = (date) => {
    onChange(date);
    setIsOpen(false);
  };

  const clearDate = () => {
    onChange(undefined);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full pl-3 text-left font-normal justify-start",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {/* Enhanced Header with Month/Year Selectors */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          <Select 
            value={currentMonth.getMonth().toString()} 
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="w-[130px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={currentMonth.getFullYear().toString()} 
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-[100px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Calendar */}
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateSelect}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          fromDate={new Date(fromYear, 0, 1)}
          toDate={new Date(toYear, 11, 31)}
          initialFocus
          className="p-0"
        />
        
        {/* Footer with selected date and clear option */}
        {value && (
          <div className="flex items-center justify-between p-3 border-t bg-muted/30">
            <div className="text-sm text-muted-foreground">
              Selected: {format(value, "MMM d, yyyy")}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDate}
              className="h-8 text-xs hover:bg-destructive/20 hover:text-destructive"
            >
              Clear
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  source: z.enum(['website', 'referral', 'walk-in', 'social_media', 'other']),
  membershipType: z.enum(['none', 'basic', 'premium', 'vip']),
  membershipFees: z.string().refine((val) => {
    if (val === '') return true; // Allow empty string
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, 'Membership fees must be a positive number'),
  membershipDuration: z.string().refine((val) => {
    if (val === '') return true; // Allow empty string
    const num = parseInt(val);
    return !isNaN(num) && num >= 0;
  }, 'Membership duration must be a positive number'),
  joinDate: z.date(),
  membershipStartDate: z.date(),
  membershipEndDate: z.date().optional(),
  transactionDate: z.date(),
  paymentMode: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'other']),
  notes: z.string().optional(),
  birthday: z.date().optional(),
});

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onCustomerUpdated?: (updatedCustomer: Customer) => void;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onCustomerUpdated,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(isOpen);

  React.useEffect(() => {
    setIsDialogOpen(isOpen);
  }, [isOpen]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      source: (customer.source as 'website' | 'referral' | 'walk-in' | 'social_media' | 'other') || 'other',
      membershipType: (customer.membershipType as 'none' | 'basic' | 'premium' | 'vip') || 'none',
      membershipFees: customer.membershipFees ? customer.membershipFees.toString() : '',
      membershipDuration: customer.membershipDuration ? customer.membershipDuration.toString() : '',
      joinDate: customer.joinDate ? (typeof customer.joinDate === 'string' ? new Date(customer.joinDate) : customer.joinDate) : new Date(),
      membershipStartDate: customer.membershipStartDate ? (typeof customer.membershipStartDate === 'string' ? new Date(customer.membershipStartDate) : customer.membershipStartDate) : new Date(),
      membershipEndDate: customer.membershipEndDate ? (typeof customer.membershipEndDate === 'string' ? new Date(customer.membershipEndDate) : customer.membershipEndDate) : undefined,
      transactionDate: customer.transactionDate ? (typeof customer.transactionDate === 'string' ? new Date(customer.transactionDate) : customer.transactionDate) : new Date(),
      paymentMode: (customer.paymentMode as 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other') || 'cash',
      notes: customer.notes || '',
      birthday: customer.birthday ? (typeof customer.birthday === 'string' ? new Date(customer.birthday) : customer.birthday) : undefined,
    }
  });

  // Add effect to calculate end date when start date or duration changes
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'membershipStartDate' || name === 'membershipDuration') {
        const startDate = form.getValues('membershipStartDate');
        const duration = form.getValues('membershipDuration');
        
        if (startDate && duration && duration !== '' && parseInt(duration) > 0) {
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + parseInt(duration));
          form.setValue('membershipEndDate', endDate);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleClose = () => {
    setIsDialogOpen(false);
    form.reset();
    onClose();
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Convert string values to numbers, defaulting to 0 if empty
      const membershipFees = values.membershipFees ? parseFloat(values.membershipFees) : 0;
      const membershipDuration = values.membershipDuration ? parseInt(values.membershipDuration) : 0;
      
      // Calculate membershipEndDate based on startDate and duration
      let calculatedEndDate = undefined;
      if (values.membershipStartDate && membershipDuration > 0) {
        const endDate = new Date(values.membershipStartDate);
        endDate.setMonth(endDate.getMonth() + membershipDuration);
        calculatedEndDate = endDate;
      }
      
      // Create data in the format expected by CustomerService
      const formattedData: Partial<CustomerApiUpdateData> = {
        name: values.name,
        email: values.email,
        phone: values.phone || '',
        address: values.address || '',
        source: values.source,
        membershipType: values.membershipType,
        membershipFees: membershipFees,
        membershipDuration: membershipDuration,
        joinDate: values.joinDate ? values.joinDate.toISOString() : undefined,
        membershipStartDate: values.membershipStartDate ? values.membershipStartDate.toISOString() : undefined,
        membershipEndDate: calculatedEndDate ? calculatedEndDate.toISOString() : undefined,
        transactionDate: values.transactionDate ? values.transactionDate.toISOString() : undefined,
        paymentMode: values.paymentMode,
        notes: values.notes || '',
        birthday: values.birthday ? values.birthday.toISOString() : undefined,
        totalSpent: membershipFees // Ensure totalSpent is included
      };

      const response = await CustomerService.updateCustomer(customer.id, formattedData);

      if (response.success && response.customer) {
        toast({
          title: "Success",
          description: "Customer updated successfully",
        });
        await queryClient.invalidateQueries({ queryKey: ['customers'] });
        if (onCustomerUpdated) {
          // Map the API response to Customer interface
          const updatedCustomer: Customer = {
            id: response.customer._id,
            name: response.customer.name,
            email: response.customer.email,
            phone: response.customer.phone,
            address: response.customer.address,
            source: response.customer.source,
            notes: response.customer.notes,
            membershipType: response.customer.membershipType,
            membershipFees: response.customer.membershipFees || 0,
            membershipDuration: response.customer.membershipDuration || 0,
            joinDate: response.customer.joinDate,
            membershipStartDate: response.customer.membershipStartDate,
            membershipEndDate: response.customer.membershipEndDate,
            transactionDate: response.customer.transactionDate,
            paymentMode: response.customer.paymentMode,
            birthday: response.customer.birthday,
            totalSpent: response.customer.totalSpent || 0,
            createdAt: response.customer.createdAt,
            updatedAt: response.customer.updatedAt
          };
          onCustomerUpdated(updatedCustomer);
        }
        handleClose();
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      let errorMessage = 'Failed to update customer';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const apiError = error as { response?: { data?: { message?: string } } };
        errorMessage = apiError.response?.data?.message || errorMessage;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col top-[5vh] translate-y-0">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
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
                      <Input placeholder="Enter email" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
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
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="walk-in">Walk-in</SelectItem>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="membershipType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Membership Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select membership type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="membershipFees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Membership Fees</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="Enter membership fees" 
                        {...field}
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="membershipDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Membership Duration (months)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="1" 
                        placeholder="Enter membership duration in months" 
                        {...field}
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Enhanced Date Pickers - Only changes are here */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="birthday"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Birthday</FormLabel>
                    <FormControl>
                      <EnhancedDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Pick birthday"
                        fromYear={1950}
                        toYear={new Date().getFullYear()}
                        className=""
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="joinDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Join Date</FormLabel>
                    <FormControl>
                      <EnhancedDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Pick join date"
                        className=""
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="membershipStartDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Membership Start Date</FormLabel>
                  <FormControl>
                    <EnhancedDatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Pick start date"
                      className=""
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="transactionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Transaction Date</FormLabel>
                    <FormControl>
                      <EnhancedDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Pick transaction date"
                        className=""
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Mode</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
          </form>
        </Form>
        
        <DialogFooter className="flex-shrink-0 pt-4 border-t bg-background">
          <Button type="submit" disabled={isSubmitting} onClick={form.handleSubmit(onSubmit)}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};