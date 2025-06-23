import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addMonths } from 'date-fns';
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
import { CustomerService, Customer } from '@/services/CustomerService';
import transactionService from '@/services/transactionService';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

const formSchema = z.object({
  membershipType: z.enum(['none', 'basic', 'premium', 'vip']),
  membershipFees: z.number().min(0, 'Membership fees must be a positive number'),
  membershipDuration: z.number().min(1, 'Membership duration must be at least 1 month'),
  membershipStartDate: z.date(),
  transactionDate: z.date(),
  paymentMode: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'other']),
});

interface RenewMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onMembershipRenewed?: (updatedCustomer: Customer) => void;
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
      membershipType: customer.membershipType || 'none',
      membershipFees: customer.membershipFees || 0,
      membershipDuration: customer.membershipDuration || 1,
      membershipStartDate: new Date(),
      transactionDate: new Date(),
      paymentMode: 'cash' as const,
    }
  });

  // Add effect to calculate end date when start date or duration changes
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'membershipStartDate' || name === 'membershipDuration') {
        const startDate = form.getValues('membershipStartDate');
        const duration = form.getValues('membershipDuration');
        
        if (startDate && duration > 0) {
          const endDate = addMonths(startDate, duration);
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
    const duration = form.getValues('membershipDuration');
    
    if (startDate && duration > 0) {
      let newStartDate: Date;
      let newEndDate: Date;
      let willExtend: boolean;
      
      if (currentEndDate > today) {
        // Current membership is still active, extend from current end date
        newStartDate = currentEndDate;
        newEndDate = addMonths(currentEndDate, duration);
        willExtend = true;
      } else {
        // Current membership has expired, use the selected start date
        newStartDate = startDate;
        newEndDate = addMonths(startDate, duration);
        willExtend = false;
      }
      
      setRenewalPreview({
        willExtend,
        newStartDate,
        newEndDate,
        currentEndDate
      });
    }
  }, [customer, form.watch('membershipStartDate'), form.watch('membershipDuration')]);

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
      
      if (currentEndDate > today) {
        // Current membership is still active, extend from current end date
        newStartDate = currentEndDate;
        newEndDate = addMonths(currentEndDate, values.membershipDuration);
      } else {
        // Current membership has expired, use the selected start date
        newStartDate = values.membershipStartDate;
        newEndDate = addMonths(values.membershipStartDate, values.membershipDuration);
      }
      
      const updateData = {
        membershipType: values.membershipType,
        membershipFees: values.membershipFees,
        membershipDuration: values.membershipDuration,
        membershipStartDate: newStartDate,
        membershipEndDate: newEndDate,
        transactionDate: values.transactionDate,
        paymentMode: values.paymentMode,
      };

      console.log('Renewal data being sent:', updateData);
      console.log('Current customer data:', {
        membershipType: customer.membershipType,
        membershipFees: customer.membershipFees,
        membershipDuration: customer.membershipDuration,
        currentEndDate: currentEndDate,
        isExpired: currentEndDate <= today
      });
      
      // Update customer membership
      const response = await CustomerService.updateCustomer(customer.id, updateData);

      // Create transaction record
      await transactionService.createTransaction({
        userId: customer.id,
        gymId: user?.gymId,
        transactionType: 'MEMBERSHIP_RENEWAL',
        transactionDate: values.transactionDate,
        amount: values.membershipFees,
        membershipType: values.membershipType,
        paymentMode: values.paymentMode,
        description: `${values.membershipType.toUpperCase()} membership renewal for ${values.membershipDuration} months (${format(newStartDate, 'dd/MM/yyyy')} to ${format(newEndDate, 'dd/MM/yyyy')})`,
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
          onMembershipRenewed(response);
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
      <DialogContent className="sm:max-w-[600px]">
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
                        min="1" 
                        step="1" 
                        placeholder="Enter duration in months" 
                        {...field}
                        value={field.value || 1}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 1 : parseInt(e.target.value);
                          field.onChange(isNaN(value) ? 1 : value);
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
                              format(field.value, "PPP")
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
                          disabled={(date) =>
                            date < new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {membershipEndDate && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Membership End Date</p>
                  <p className="font-medium">{format(membershipEndDate, "PPP")}</p>
                </div>
              )}
              
              {/* Renewal Preview */}
              {renewalPreview.newStartDate && renewalPreview.newEndDate && (
                <div className="col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Renewal Preview</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-blue-800">
                      <span className="font-medium">Current End Date:</span> {renewalPreview.currentEndDate ? format(renewalPreview.currentEndDate, "PPP") : 'N/A'}
                    </p>
                    <p className="text-blue-800">
                      <span className="font-medium">New Start Date:</span> {format(renewalPreview.newStartDate, "PPP")}
                    </p>
                    <p className="text-blue-800">
                      <span className="font-medium">New End Date:</span> {format(renewalPreview.newEndDate, "PPP")}
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
                              format(field.value, "PPP")
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