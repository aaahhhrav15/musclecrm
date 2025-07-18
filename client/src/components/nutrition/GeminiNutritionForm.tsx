import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axios';
import type { NutritionPlan } from '@/pages/gym/NutritionPlansPage';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Customer {
  _id: string;
  name: string;
}

interface GeminiNutritionFormProps {
  onPlanGenerated: (plan: NutritionPlan) => void;
}

const GeminiNutritionForm: React.FC<GeminiNutritionFormProps> = ({ onPlanGenerated }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    targetWeight: '',
    objective: '',
    dietType: '',
    medicalConditions: '', // <-- add this
    additionalDetails: ''
  });
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const customerDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axiosInstance.get('/customers', { params: { limit: 10000 } });
        if (response.data.success) {
          setCustomers(response.data.customers);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast.error('Failed to fetch customers');
      }
    };
    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axiosInstance.post('/nutrition-plans/gemini', formData);
      
      if (response.data.success) {
        onPlanGenerated(response.data.nutritionPlan);
        toast.success('Nutrition plan generated successfully');
      } else {
        throw new Error(response.data.message || 'Failed to generate nutrition plan');
      }
    } catch (error) {
      console.error('Error generating nutrition plan:', error);
      toast.error('Failed to generate nutrition plan');
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find(c => c._id === formData.customerId);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Customer</label>
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
                    setFormData(prev => ({ ...prev, customerId: '' }));
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
                    placeholder="Search customers by name..."
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
                                setFormData(prev => ({ ...prev, customerId: customer._id }));
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Age</label>
            <Input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
              placeholder="Enter age"
              required
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Gender</label>
            <Select
              value={formData.gender}
              onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Height (cm)</label>
            <Input
              type="number"
              value={formData.height}
              onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
              placeholder="Enter height"
              required
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Weight (kg)</label>
            <Input
              type="number"
              value={formData.weight}
              onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
              placeholder="Enter weight"
              required
            />
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Target Weight (kg)</label>
          <Input
            type="number"
            value={formData.targetWeight}
            onChange={(e) => setFormData(prev => ({ ...prev, targetWeight: e.target.value }))}
            placeholder="Enter target weight"
            required
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Objective</label>
          <Select
            value={formData.objective}
            onValueChange={(value) => setFormData(prev => ({ ...prev, objective: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select objective" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weight_loss">Weight Loss</SelectItem>
              <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="general_health">General Health</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Diet Type</label>
          <Select
            value={formData.dietType}
            onValueChange={(value) => setFormData(prev => ({ ...prev, dietType: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select diet type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vegetarian">Vegetarian</SelectItem>
              <SelectItem value="non_vegetarian">Non-Vegetarian</SelectItem>
              <SelectItem value="eggetarian">Eggetarian</SelectItem>
              <SelectItem value="vegan">Vegan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Medical Conditions (if any)</label>
          <Textarea
            value={formData.medicalConditions}
            onChange={(e) => setFormData(prev => ({ ...prev, medicalConditions: e.target.value }))}
            placeholder="E.g. diabetes, hypertension, thyroid, etc."
            className="h-16"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Additional Details</label>
          <Textarea
            value={formData.additionalDetails}
            onChange={(e) => setFormData(prev => ({ ...prev, additionalDetails: e.target.value }))}
            placeholder="Enter any additional requirements like calories intake, protein goals, dietary preferences, allergies, or other specific needs"
            className="h-20"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Generating Plan...' : 'Generate Nutrition Plan'}
      </Button>
    </form>
  );
};

export default GeminiNutritionForm; 