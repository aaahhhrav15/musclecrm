import React, { useState, useEffect } from 'react';
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

interface Customer {
  _id: string;
  name: string;
}

interface GeminiNutritionFormProps {
  onPlanGenerated: (plan: any) => void;
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
    allergies: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axiosInstance.get('/customers');
      if (response.data.success) {
        setCustomers(response.data.customers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    }
  };

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Customer</label>
          <Select
            value={formData.customerId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer._id} value={customer._id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <label className="text-sm font-medium">Allergies (if any)</label>
          <Textarea
            value={formData.allergies}
            onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
            placeholder="Enter any food allergies or leave empty if none"
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