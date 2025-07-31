import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addMonths, addDays, isValid } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
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
import { CustomerService, Customer, CustomerApiUpdateData } from '@/services/CustomerService';
import transactionService from '@/services/transactionService';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

const formSchema = z.object({
  membershipType: z.enum(['none', 'basic', 'premium', 'vip']),
  membershipFees: z.number().min(0, 'Membership fees must be a positive number'),
  membershipDuration: z.number().min(0, 'Membership duration must be at least 0 months'),
  membershipDays: z.number().min(0, 'Membership days must be at least 0').default(0),
  membershipStartDate: z.date(),
  transactionDate: z.date(),
  paymentMode: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'other']),
  notes: z.string().optional(),
});

interface RenewMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onMembershipRenewed?: (updatedCustomer: Customer) => void;
}

// Helper to safely format dates
function safeFormatDate(date: Date | null | undefined, fmt: string = 'PPP') {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return 'N/A';
  return format(date, fmt);
}

// Helper to convert Date objects to ISO strings for API calls
function convertDatesToISO(data: {
  membershipType: 'none' | 'basic' | 'premium' | 'vip';
  membershipFees: number;
  membershipDuration: number;
  membershipDays: number;
  membershipStartDate: Date;
  membershipEndDate: Date;
  transactionDate: Date;
  paymentMode: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';
  notes: string;
  isRenewal?: boolean; // Add isRenewal to the type definition
}): CustomerApiUpdateData {
  return {
    membershipType: data.membershipType,
    membershipFees: data.membershipFees,
    membershipDuration: data.membershipDuration,
    membershipDays: data.membershipDays,
    membershipStartDate: data.membershipStartDate.toISOString(),
    membershipEndDate: data.membershipEndDate.toISOString(),
    transactionDate: data.transactionDate.toISOString(),
    paymentMode: data.paymentMode,
    notes: data.notes,
    isRenewal: data.isRenewal || false, // Ensure isRenewal is included in the returned object
  };
}

export const RenewMembershipModal: React.FC<RenewMembershipModalProps> = ({
  isOpen,
  onClose,
  customer,
  onMembershipRenewed,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(isOpen);
  const [membershipEndDate, setMembershipEndDate] = React.useState<Date | null>(null);
  const [renewalPreview, setRenewalPreview] = React.useState<{
    willExtend: boolean;
    newStartDate: Date | null;
    newEndDate: Date | null;
    currentEndDate: Date | null;
  }>({
    willExtend: false,
    newStartDate: null,
    newEndDate: null,
    currentEndDate: null
  });

  React.useEffect(() => {
    setIsDialogOpen(isOpen);
  }, [isOpen]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      membershipType: (customer.membershipType as 'none' | 'basic' | 'premium' | 'vip') || 'none',
      membershipFees: customer.membershipFees || 0,
      membershipDuration: customer.membershipDuration || 1,
      membershipDays: customer.membershipDays || 0,
      membershipStartDate: new Date(),
      transactionDate: new Date(),
      paymentMode: 'cash' as const,
      notes: '',
    }
  });

  // Add effect to calculate end date when start date or duration changes
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if ([
        'membershipStartDate',
        'membershipDuration',
        'membershipDays'
      ].includes(name)) {
        const startDate = form.getValues('membershipStartDate');
        const months = form.getValues('membershipDuration') || 0;
        const days = form.getValues('membershipDays') || 0;
        if (startDate && (months > 0 || days > 0)) {
          let endDate = addMonths(new Date(startDate), months);
          endDate = addDays(endDate, days);
          endDate.setDate(endDate.getDate() - 1);
          setMembershipEndDate(endDate);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Calculate renewal preview
  React.useEffect(() => {
    const currentEndDate = customer.membershipEndDate 
      ? new Date(customer.membershipEndDate)
      : addMonths(new Date(customer.membershipStartDate), customer.membershipDuration);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = form.getValues('membershipStartDate');
    const months = form.getValues('membershipDuration') || 0;
    const days = form.getValues('membershipDays') || 0;
    if (startDate && (months > 0 || days > 0)) {
      let newStartDate: Date;
      let newEndDate: Date;
      let willExtend: boolean;
      // If current membership is active, always use the original start date
      if (currentEndDate >= today && startDate <= currentEndDate) {
        newStartDate = new Date(customer.membershipStartDate);
        const renewalFrom = new Date(currentEndDate);
        renewalFrom.setDate(renewalFrom.getDate() + 1);
        newEndDate = addMonths(renewalFrom, months);
        newEndDate = addDays(newEndDate, days);
        newEndDate.setDate(newEndDate.getDate() - 1);
        willExtend = true;
      } else {
        newStartDate = startDate;
        newEndDate = addMonths(startDate, months);
        newEndDate = addDays(newEndDate, days);
        newEndDate.setDate(newEndDate.getDate() - 1);
        willExtend = false;
      }
      setRenewalPreview({
        willExtend,
        newStartDate,
        newEndDate,
        currentEndDate
      });
    }
  }, [customer, form.watch('membershipStartDate'), form.watch('membershipDuration'), form.watch('membershipDays')]);

  const handleClose = () => {
    setIsDialogOpen(false);
    form.reset();
    onClose();
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Calculate the current membership end date
      const currentEndDate = customer.membershipEndDate 
        ? new Date(customer.membershipEndDate)
        : addMonths(new Date(customer.membershipStartDate), customer.membershipDuration);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Determine the new start date and end date
      let newStartDate: Date;
      let newEndDate: Date;
      
      const membershipDuration = values.membershipDuration || 0;
      const membershipDays = values.membershipDays || 0;
      
      // If current membership is active, always use the original start date
      if (currentEndDate >= today && values.membershipStartDate <= currentEndDate) {
        newStartDate = new Date(customer.membershipStartDate);
        const renewalFrom = new Date(currentEndDate);
        renewalFrom.setDate(renewalFrom.getDate() + 1);
        newEndDate = addMonths(renewalFrom, membershipDuration);
        newEndDate = addDays(newEndDate, membershipDays);
        newEndDate.setDate(newEndDate.getDate() - 1);
      } else {
        newStartDate = values.membershipStartDate;
        newEndDate = addMonths(values.membershipStartDate, membershipDuration);
        newEndDate = addDays(newEndDate, membershipDays);
        newEndDate.setDate(newEndDate.getDate() - 1);
      }
      
      const updateData = {
        membershipType: values.membershipType,
        membershipFees: values.membershipFees,
        membershipDuration: membershipDuration,
        membershipDays: membershipDays,
        membershipStartDate: newStartDate,
        membershipEndDate: newEndDate,
        transactionDate: values.transactionDate,
        paymentMode: values.paymentMode,
        notes: values.notes || '',
        isRenewal: true // Add this flag for backend
      };

      // Convert dates to ISO strings for API call
      const apiData = convertDatesToISO(updateData);
      apiData.isRenewal = true; // Ensure flag is present after conversion
      console.log('Renewal data being sent:', apiData);
      console.log('Current customer data:', {
        membershipType: customer.membershipType,
        membershipFees: customer.membershipFees,
        membershipDuration: customer.membershipDuration,
        currentEndDate: currentEndDate,
        isExpired: currentEndDate <= today
      });
      
      // Update customer membership
      const response = await CustomerService.updateCustomer(customer.id, apiData);

      // Create transaction record with correct date range
      let transactionDescription: string;
      
      if (currentEndDate > today) {
        // Current membership is active - show from current end date + 1 day to new end date
        const renewalStartDate = new Date(currentEndDate);
        renewalStartDate.setDate(renewalStartDate.getDate() + 1); // Add 1 day to current end date
        
        transactionDescription = values.notes 
          ? `${values.membershipType.toUpperCase()} membership renewal for ${values.membershipDuration} months (${safeFormatDate(renewalStartDate, 'PPP')} to ${safeFormatDate(newEndDate, 'PPP')}) - Notes: ${values.notes}`
          : `${values.membershipType.toUpperCase()} membership renewal for ${values.membershipDuration} months (${safeFormatDate(renewalStartDate, 'PPP')} to ${safeFormatDate(newEndDate, 'PPP')})`;
      } else {
        // Current membership has expired - show from start date to end date
        transactionDescription = values.notes 
          ? `${values.membershipType.toUpperCase()} membership renewal for ${values.membershipDuration} months (${safeFormatDate(newStartDate, 'PPP')} to ${safeFormatDate(newEndDate, 'PPP')}) - Notes: ${values.notes}`
          : `${values.membershipType.toUpperCase()} membership renewal for ${values.membershipDuration} months (${safeFormatDate(newStartDate, 'PPP')} to ${safeFormatDate(newEndDate, 'PPP')})`;
      }

      await transactionService.createTransaction({
        userId: customer.id,
        gymId: user?.gymId,
        transactionType: 'MEMBERSHIP_RENEWAL',
        transactionDate: values.transactionDate,
        amount: values.membershipFees,
        membershipType: values.membershipType,
        paymentMode: values.paymentMode,
        description: transactionDescription,
        status: 'SUCCESS'
      });

      if (response) {
        // Show success message with invoice information if created
        if (response.invoice) {
          toast({
            title: "Success",
            description: `Membership renewed successfully! Invoice ${response.invoice.invoiceNumber} has been automatically generated for renewal fees.`,
          });
        } else {
          toast({
            title: "Success",
            description: "Membership renewed successfully",
          });
        }

        await queryClient.invalidateQueries({ queryKey: ['customers'] });
        await queryClient.invalidateQueries({ queryKey: ['transactions', customer.id] });
        await queryClient.invalidateQueries({ queryKey: ['invoices'] });
        if (onMembershipRenewed) {
          if (response.customer) {
            // Map API customer to Customer type if needed
            onMembershipRenewed({
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
              personalTrainer: response.customer.personalTrainer,
              createdAt: response.customer.createdAt,
              updatedAt: response.customer.updatedAt
            });
          }
        }
        handleClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to renew membership",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto flex flex-col top-[5vh] translate-y-0">
        <DialogHeader>
          <DialogTitle>Renew Membership</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="membershipType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Membership Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                        value={field.value || 0}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          field.onChange(isNaN(value) ? 0 : value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="membershipDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (months)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="1" 
                        placeholder="Enter duration in months" 
                        {...field}
                        value={field.value || 0}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                          field.onChange(isNaN(value) ? 0 : value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="membershipDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (days)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="1" 
                        placeholder="Enter duration in days" 
                        {...field}
                        value={field.value || 0}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                          field.onChange(isNaN(value) ? 0 : value);
                        }}
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="membershipStartDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              safeFormatDate(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          // Allow all dates, including past
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Renewal Preview */}
              {renewalPreview.newStartDate && renewalPreview.newEndDate && (
                <div className="col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Renewal Preview</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-blue-800">
                      <span className="font-medium">Current End Date:</span> {safeFormatDate(renewalPreview.currentEndDate, "PPP")}
                    </p>
                    <p className="text-blue-800">
                      <span className="font-medium">Start Date:</span> {safeFormatDate(renewalPreview.newStartDate, "PPP")}
                    </p>
                    <p className="text-blue-800">
                      <span className="font-medium">New End Date:</span> {safeFormatDate(renewalPreview.newEndDate, "PPP")}
                    </p>
                    <p className="text-blue-700 font-medium">
                      {renewalPreview.willExtend 
                        ? "✅ Will extend from current membership end date" 
                        : "⚠️ Will start from selected date (current membership expired)"}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="transactionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Transaction Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              safeFormatDate(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-2">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional notes about this renewal..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Renewing..." : "Renew Membership"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}; 