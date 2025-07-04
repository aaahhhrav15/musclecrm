import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addMonths, isValid } from 'date-fns';
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
import transactionService from '@/services/transactionService';
import InvoiceService from '@/services/InvoiceService';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/constants';

const formSchema = z.object({
  duration: z.number().min(1, 'Duration must be at least 1 month'),
  fees: z.number().min(0, 'Fees must be a positive number'),
  startDate: z.date(),
  transactionDate: z.date(),
  paymentMode: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'other']),
});

interface Assignment {
  _id?: string;
  customerId: {
    _id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  trainerId: {
    _id: string;
    name: string;
    email?: string;
  };
  gymId: string;
  startDate: string;
  duration: number;
  endDate: string;
  fees: number;
}

interface RenewPersonalTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  onRenewed?: () => void;
}

function safeFormatDate(date: Date | null | undefined, fmt: string = 'PPP') {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return 'N/A';
  return format(date, fmt);
}

export const RenewPersonalTrainingModal: React.FC<RenewPersonalTrainingModalProps> = (props) => {
  const { isOpen, onClose, assignment, onRenewed } = props;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(isOpen);
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
      duration: assignment.duration || 1,
      fees: assignment.fees || 0,
      startDate: new Date(),
      transactionDate: new Date(),
      paymentMode: 'cash' as const,
    }
  });

  // Calculate renewal preview
  React.useEffect(() => {
    const currentEndDate = assignment.endDate 
      ? new Date(assignment.endDate)
      : addMonths(new Date(assignment.startDate), assignment.duration);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = form.getValues('startDate');
    const duration = form.getValues('duration');
    if (startDate && duration > 0) {
      let newStartDate: Date;
      let newEndDate: Date;
      let willExtend: boolean;
      if (currentEndDate > today) {
        // Current assignment is still active, extend from current end date
        newStartDate = new Date(assignment.startDate); // Show original start date
        newEndDate = addMonths(currentEndDate, duration);
        willExtend = true;
      } else {
        // Assignment has expired, use the selected start date
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
  }, [assignment, form.watch('startDate'), form.watch('duration')]);

  const handleClose = () => {
    setIsDialogOpen(false);
    form.reset();
    onClose();
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      const currentEndDate = assignment.endDate 
        ? new Date(assignment.endDate)
        : addMonths(new Date(assignment.startDate), assignment.duration);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let newStartDate: Date;
      let newEndDate: Date;
      if (currentEndDate > today) {
        // Current assignment is still active, extend from current end date
        newStartDate = new Date(assignment.startDate); // Keep original start date
        newEndDate = addMonths(currentEndDate, values.duration);
      } else {
        // Assignment has expired, use the selected start date
        newStartDate = values.startDate;
        newEndDate = addMonths(values.startDate, values.duration);
      }
      // Update assignment (API call)
      await fetch(`${API_URL}/personal-training/${assignment._id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          startDate: newStartDate,
          duration: values.duration,
          endDate: newEndDate,
          fees: values.fees,
          gymId: assignment.gymId,
          paymentMode: values.paymentMode,
          transactionDate: values.transactionDate,
        })
      });
      // Create transaction
      await transactionService.createTransaction({
        userId: assignment.customerId._id,
        gymId: assignment.gymId,
        transactionType: 'PERSONAL_TRAINING_RENEWAL',
        transactionDate: values.transactionDate,
        amount: values.fees,
        paymentMode: values.paymentMode,
        description: `Personal training renewal for ${values.duration} months (${safeFormatDate(newStartDate)} to ${safeFormatDate(newEndDate)})`,
        status: 'SUCCESS',
      });
      // Create invoice
      await InvoiceService.createInvoice({
        customerId: assignment.customerId._id,
        amount: values.fees,
        currency: 'INR',
        dueDate: format(newEndDate, 'yyyy-MM-dd'),
        items: [
          {
            description: `Personal Training Renewal (${safeFormatDate(newStartDate)} to ${safeFormatDate(newEndDate)})`,
            quantity: values.duration,
            unitPrice: values.fees / values.duration,
            amount: values.fees,
          },
        ],
        notes: 'Personal training renewal invoice',
      });
      toast({
        title: 'Success',
        description: 'Personal training renewed and invoice generated!',
      });
      await queryClient.invalidateQueries({ queryKey: ['personal-training'] });
      if (onRenewed) onRenewed();
      handleClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to renew personal training',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!assignment) return null;
  return (
    <Dialog open={isDialogOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Renew Personal Training</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration"
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
                name="fees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fees</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="Enter fees" 
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
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
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
                  </FormControl>
                  <FormMessage />
                  {renewalPreview.newStartDate && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Actual renewal will start from: <b>{format(renewalPreview.newStartDate, 'PPP')}</b>
                      {renewalPreview.willExtend && (
                        <span> (after your current assignment ends)</span>
                      )}
                    </div>
                  )}
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
                    <span className="font-medium">New Start Date:</span> {safeFormatDate(renewalPreview.newStartDate, "PPP")}
                  </p>
                  <p className="text-blue-800">
                    <span className="font-medium">New End Date:</span> {safeFormatDate(renewalPreview.newEndDate, "PPP")}
                  </p>
                  <p className="text-blue-700 font-medium">
                    {renewalPreview.willExtend 
                      ? "✅ Will extend from current assignment end date" 
                      : "⚠️ Will start from selected date (current assignment expired)"}
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Renewing..." : "Renew Personal Training"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RenewPersonalTrainingModal; 