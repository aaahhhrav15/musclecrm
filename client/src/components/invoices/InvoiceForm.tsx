import { useState, useEffect, useMemo, useRef } from 'react';
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
import { useGym } from '@/context/GymContext';
import axios from 'axios';
import { Search, X } from 'lucide-react';

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

type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

type InvoiceSubmitData = {
  customerId: string;
  items: InvoiceItem[];
  amount: number;
  dueDate: Date;
  notes?: string;
  currency: string;
  paymentMode: string;
};

const formSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  chargeType: z.string().min(1, 'Charge type is required'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  paymentMode: z.string().min(1, "Payment mode is required"),
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
  const [items, setItems] = useState([
    { description: '', quantity: 1, unitPrice: 0, amount: 0 }
  ]);
  const { gym } = useGym();

  // Customer dropdown states
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const customerDropdownRef = useRef<HTMLDivElement | null>(null);

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const search = customerSearch.toLowerCase();
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(search)
    );
  }, [customers, customerSearch]);

  // Close dropdown on outside click
  useEffect(() => {
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

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(`${API_URL}/customers`, {
          params: { limit: 10000 },
          withCredentials: true
        });
        
        const data = response.data;
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

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: '',
      chargeType: '',
      description: '',
      dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      paymentMode: '',
    }
  });

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = Number(updatedItems[index].quantity) || 0;
      const price = Number(updatedItems[index].unitPrice) || 0;
      updatedItems[index].amount = qty * price;
    }
    setItems(updatedItems);
  };

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      const invoiceData = {
        customerId: data.customerId,
        items: items,
        amount: totalAmount,
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: data.description,
        currency: 'INR',
        paymentMode: data.paymentMode,
      };
      await onSubmit(invoiceData);
      toast.success('Invoice created successfully');
      onClose();
    } catch (error) {
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

  const selectedCustomer = customers.find(c => c._id === form.watch('customerId'));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col top-[5vh] translate-y-0">
        {/* Gym Logo at the top */}
        {gym?.logo && (
          <div className="flex justify-center mb-2 flex-shrink-0">
            <img
              src={gym.logo}
              alt="Gym Logo"
              className="w-24 h-24 object-contain rounded-lg border"
              onLoad={() => console.log('Invoice logo loaded successfully:', gym.logo?.substring(0, 100) + '...')}
              onError={(e) => {
                console.error('Invoice logo failed to load:', gym.logo?.substring(0, 100) + '...');
                console.error('Error event:', e);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new invoice.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 overflow-y-auto flex-1 pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer</Label>
              <div className="space-y-2" ref={customerDropdownRef}>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between p-3 border rounded-md bg-green-50">
                    <div>
                      <p className="font-medium">{selectedCustomer.name}</p>
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
                  <div className="space-y-2 relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search customers by name..."
                        value={customerSearch}
                        onChange={e => setCustomerSearch(e.target.value)}
                        onFocus={() => setCustomerDropdownOpen(false)}
                        onClick={() => setCustomerDropdownOpen(true)}
                        className="pl-10"
                      />
                    </div>
                    {customerDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 border rounded-md bg-background shadow-lg max-h-80 overflow-hidden z-50">
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

          <div className="space-y-2">
            <Label htmlFor="paymentMode">Payment Mode</Label>
            <Select
              value={form.watch('paymentMode')}
              onValueChange={(value) => {
                form.setValue('paymentMode', value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.paymentMode && (
              <p className="text-sm text-red-500">{form.formState.errors.paymentMode.message}</p>
            )}
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <Label>Invoice Items</Label>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-2 items-end mb-2">
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={e => handleItemChange(idx, 'description', e.target.value)}
                />
                <Input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Unit Price"
                  value={item.unitPrice}
                  onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Amount"
                    value={item.amount}
                    readOnly
                  />
                  {items.length > 1 && (
                    <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveItem(idx)}>-</Button>
                  )}
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={handleAddItem}>+ Add Item</Button>
          </div>

          {/* Show total */}
          <div className="flex justify-center mt-4">
            <div className="font-bold text-lg">Total: {totalAmount.toFixed(2)}</div>
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
          </div>

        </form>
        
        <DialogFooter className="flex-shrink-0 pt-4 border-t bg-background">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} onClick={form.handleSubmit(handleSubmit)}>
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
      </DialogContent>
    </Dialog>
  );
} 