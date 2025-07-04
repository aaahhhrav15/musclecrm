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
import { InvoiceService, Invoice } from '@/services/InvoiceService';
import axios from 'axios';
import { Search, X } from 'lucide-react';

interface Customer {
  _id: string;
  name: string;
}

interface EditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSuccess: () => void;
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

export function EditInvoiceModal({ isOpen, onClose, invoice, onSuccess }: EditInvoiceModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChargeType, setSelectedChargeType] = useState('');
  const [items, setItems] = useState([
    { description: '', quantity: 1, unitPrice: 0, amount: 0 }
  ]);

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

  const form = useForm({
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

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(`${API_URL}/customers`, {
          params: { limit: 10000 },
          withCredentials: true
        });
        
        const data = response.data;
        // Handle the API response structure
        const customersArray = data.customers || data || [];
        
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
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  // Update form values when invoice changes
  useEffect(() => {
    if (invoice && customers.length > 0) {
      // Extract charge type from description
      const chargeType = invoice.items[0]?.description?.toLowerCase().includes('class') ? 'class_booking' :
        invoice.items[0]?.description?.toLowerCase().includes('personal') ? 'personal_training' :
        invoice.items[0]?.description?.toLowerCase().includes('membership') ? 'membership' : 'other';

      // Get customer ID - handle both string and object cases
      const customerId = typeof invoice.customerId === 'string'
        ? invoice.customerId
        : invoice.customerId?._id || '';

      form.reset({
        customerId: customerId,
        chargeType: chargeType,
        quantity: invoice.items[0]?.quantity || 1,
        unitPrice: invoice.items[0]?.unitPrice || 0,
        amount: invoice.amount || 0,
        description: invoice.items[0]?.description || '',
        dueDate: invoice.dueDate ? format(new Date(invoice.dueDate), 'yyyy-MM-dd') : format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      });
      setSelectedChargeType(chargeType);
    }
  }, [invoice, customers, form]);

  // Calculate amount when quantity or unit price changes
  useEffect(() => {
    const quantity = form.getValues('quantity');
    const unitPrice = form.getValues('unitPrice');
    const amount = quantity * unitPrice;
    form.setValue('amount', amount);
  }, [form.watch('quantity'), form.watch('unitPrice')]);

  // When invoice changes, set items from invoice.items
  useEffect(() => {
    if (invoice && Array.isArray(invoice.items)) {
      setItems(invoice.items.map(item => ({
        description: item.description || '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        amount: item.amount || 0
      })));
    }
  }, [invoice]);

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
    if (!invoice) return;
    setLoading(true);
    try {
      await InvoiceService.updateInvoice(invoice._id, {
        items: items,
        amount: totalAmount,
        dueDate: data.dueDate,
        notes: data.description,
        currency: invoice.currency
      });
      toast.success('Invoice updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to update invoice');
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find(c => c._id === form.watch('customerId'));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
          <DialogDescription>
            Update the invoice details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                        onFocus={() => setCustomerDropdownOpen(true)}
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
          <div className="flex justify-end mt-4">
            <div className="font-bold text-lg">Total: {totalAmount.toFixed(2)}</div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="mr-2">Saving...</span>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
 
 