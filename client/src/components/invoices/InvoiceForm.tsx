import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { API_URL } from '@/lib/constants';
import { useQueryClient } from '@tanstack/react-query';

interface Customer {
  _id: string;
  name: string;
}

interface Booking {
  _id: string;
  customerId: string | { _id: string };
  type: string;
  startTime: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface InvoiceFormData {
  customerId: string;
  chargeType: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  description?: string;
  dueDate?: string;
  tax: number;
}

interface InvoiceSubmitData {
  customerId: string;
  items: InvoiceItem[];
  amount: number;
  dueDate: Date;
  notes?: string;
  status: string;
  currency: string;
}

const formSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  chargeType: z.string().min(1, 'Charge type is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.coerce.number().min(0, 'Unit price must be a positive number'),
  amount: z.coerce.number().min(0, 'Amount must be a positive number'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  tax: z.coerce.number().min(0, 'Tax must be a positive number').default(0)
});

interface InvoiceFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: InvoiceSubmitData) => Promise<void>;
}

export default function InvoiceForm({ open, onClose, onSubmit }: InvoiceFormProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedChargeType, setSelectedChargeType] = useState<string>('');

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${API_URL}/customers`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) throw new Error('Failed to fetch customers');
        const data = await response.json();
        const customersArray = Array.isArray(data) ? data : 
          (data.customers && Array.isArray(data.customers) ? data.customers : []);
        
        const validCustomers = customersArray.filter(customer => 
          customer && typeof customer === 'object' && 
          customer._id && typeof customer._id === 'string' &&
          customer.name && typeof customer.name === 'string'
        );
        
        console.log('Fetched customers:', validCustomers);
        setCustomers(validCustomers);
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast.error('Failed to load customers');
        setCustomers([]);
      }
    };
    fetchCustomers();
  }, []);

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(`${API_URL}/bookings`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) throw new Error('Failed to fetch bookings');
        const data = await response.json();
        setBookings(data || []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast.error('Failed to load bookings');
        setBookings([]);
      }
    };
    fetchBookings();
  }, []);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: '',
      chargeType: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      description: '',
      dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      tax: 0
    }
  });

  // Calculate amount when quantity or unit price changes
  useEffect(() => {
    const quantity = form.getValues('quantity');
    const unitPrice = form.getValues('unitPrice');
    const amount = quantity * unitPrice;
    form.setValue('amount', amount);
  }, [form.watch('quantity'), form.watch('unitPrice')]);

  const handleSubmit = async (data: InvoiceFormData) => {
    console.log('Form submitted with data:', data);
    setLoading(true);
    try {
      const items: InvoiceItem[] = [{
        description: data.description || `${data.chargeType} charge`,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        amount: data.amount
      }];

      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const total = subtotal + (data.tax || 0);

      const invoiceData: InvoiceSubmitData = {
        customerId: data.customerId,
        items: items,
        amount: total,
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: data.description,
        status: 'pending',
        currency: 'INR'
      };

      console.log('Submitting invoice data:', invoiceData);
      await onSubmit(invoiceData);
      console.log('Invoice submitted successfully');
      toast.success('Invoice created successfully');
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to create invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderReferenceOptions = () => {
    const customerId = form.getValues('customerId');
    if (!customerId) return null;

    let filteredBookings: Booking[] = [];
    
    switch (selectedChargeType) {
      case 'class_booking':
      case 'personal_training':
        if (Array.isArray(bookings)) {
          filteredBookings = bookings.filter(b => {
            const bookingCustomerId = typeof b.customerId === 'object' ? b.customerId._id : b.customerId;
            const matches = bookingCustomerId === customerId && b.type === selectedChargeType;
            return matches;
          });
        }

        if (!filteredBookings.length) {
          return (
            <>
              <SelectItem value="new" disabled>
                No bookings found
              </SelectItem>
              <SelectItem value="manual">
                Create new booking
              </SelectItem>
            </>
          );
        }

        return (
          <>
            {filteredBookings.map(booking => (
              <SelectItem key={booking._id} value={booking._id}>
                {`${booking.type} - ${format(new Date(booking.startTime), 'MMM d, yyyy')}`}
              </SelectItem>
            ))}
            <SelectItem value="manual">
              Create new booking
            </SelectItem>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new invoice.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer</Label>
              <Select
                value={form.watch('customerId')}
                onValueChange={(value) => {
                  form.setValue('customerId', value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(customers) && customers.length > 0 ? (
                    customers.map((customer) => (
                      <SelectItem key={customer._id} value={customer._id}>
                        {customer.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-customers" disabled>
                      No customers available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.customerId && (
                <p className="text-sm text-red-500">{form.formState.errors.customerId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="chargeType">Charge Type</Label>
              <Select
                value={form.watch('chargeType')}
                onValueChange={(value) => {
                  form.setValue('chargeType', value);
                  setSelectedChargeType(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select charge type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class_booking">Class Booking</SelectItem>
                  <SelectItem value="personal_training">Personal Training</SelectItem>
                  <SelectItem value="membership">Membership</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.chargeType && (
                <p className="text-sm text-red-500">{form.formState.errors.chargeType.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                type="number"
                id="quantity"
                min="1"
                {...form.register('quantity')}
                placeholder="Enter quantity"
              />
              {form.formState.errors.quantity && (
                <p className="text-sm text-red-500">{form.formState.errors.quantity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price</Label>
              <Input
                type="number"
                id="unitPrice"
                min="0"
                step="0.01"
                {...form.register('unitPrice')}
                placeholder="Enter unit price"
              />
              {form.formState.errors.unitPrice && (
                <p className="text-sm text-red-500">{form.formState.errors.unitPrice.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Total Amount</Label>
              <Input
                type="number"
                readOnly
                {...form.register('amount')}
                placeholder="Calculated amount"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Enter description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                type="date"
                id="dueDate"
                {...form.register('dueDate')}
              />
              {form.formState.errors.dueDate && (
                <p className="text-sm text-red-500">{form.formState.errors.dueDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax">Tax (%)</Label>
              <Input
                type="number"
                id="tax"
                step="0.01"
                min="0"
                {...form.register('tax', {
                  setValueAs: (value) => value === '' ? 0 : Number(value)
                })}
                placeholder="Enter tax percentage"
              />
              {form.formState.errors.tax && (
                <p className="text-sm text-red-500">{form.formState.errors.tax.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="mr-2">Creating...</span>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </>
              ) : (
                'Create Invoice'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 