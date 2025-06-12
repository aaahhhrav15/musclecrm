import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useIndustry } from '@/context/IndustryContext';
import axiosInstance from '@/lib/axios';

interface MembershipPlan {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in months
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const MembershipPlansPage: React.FC = () => {
  useRequireAuth();
  const { selectedIndustry, setSelectedIndustry } = useIndustry();
  
  // Set gym as the selected industry if not already set
  useEffect(() => {
    if (selectedIndustry !== 'gym') {
      setSelectedIndustry('gym');
    }
  }, [selectedIndustry, setSelectedIndustry]);

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    features: [''],
    isActive: true
  });

  // Load membership plans
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/gym/membership-plans');
      if (response.data.success && Array.isArray(response.data.data)) {
        setPlans(response.data.data);
      } else {
        console.error('Unexpected API response format:', response.data);
        setPlans([]); // Set empty array as fallback
        toast({
          title: "Error",
          description: "Invalid data format received from server",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching membership plans:', error);
      toast({
        title: "Error",
        description: "Failed to load membership plans",
        variant: "destructive",
      });
      setPlans([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    try {
      const planData = {
        ...formData,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        features: formData.features.filter(f => f.trim() !== '')
      };

      const response = await axiosInstance.post('/gym/membership-plans', planData);
      
      if (response.data.success && response.data.data) {
        toast({
          title: "Success",
          description: "Membership plan created successfully",
        });
        setIsDialogOpen(false);
        resetForm();
        fetchPlans();
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error creating membership plan:', error);
      toast({
        title: "Error",
        description: "Failed to create membership plan",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan) return;

    try {
      const planData = {
        ...formData,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        features: formData.features.filter(f => f.trim() !== '')
      };

      const response = await axiosInstance.put(
        `/gym/membership-plans/${editingPlan._id}`,
        planData
      );
      
      if (response.data.success && response.data.data) {
        toast({
          title: "Success",
          description: "Membership plan updated successfully",
        });
        setIsDialogOpen(false);
        resetForm();
        fetchPlans();
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error updating membership plan:', error);
      toast({
        title: "Error",
        description: "Failed to update membership plan",
        variant: "destructive",
      });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      const response = await axiosInstance.delete(`/gym/membership-plans/${planId}`);
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Membership plan deleted successfully",
        });
        fetchPlans();
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error deleting membership plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete membership plan",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      duration: plan.duration.toString(),
      features: plan.features,
      isActive: plan.isActive
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      features: [''],
      isActive: true
    });
    setEditingPlan(null);
  };

  const handleAddFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="container mx-auto px-4 py-8"
      >
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Membership Plans</h1>
              <p className="text-gray-500 mt-1">
                Manage your gym's membership plans
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" /> Create Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingPlan ? 'Edit Membership Plan' : 'Create Membership Plan'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPlan 
                      ? 'Update the details of your membership plan.'
                      : 'Create a new membership plan for your gym.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="name" className="text-sm font-medium">Plan Name</label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter plan name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="description" className="text-sm font-medium">Description</label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter plan description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <label htmlFor="price" className="text-sm font-medium">Price (Rs.)</label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="Enter price"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="duration" className="text-sm font-medium">Duration (months)</label>
                      <Input
                        id="duration"
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                        placeholder="Enter duration"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Features</label>
                    <div className="space-y-2">
                      {formData.features.map((feature, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={feature}
                            onChange={(e) => handleFeatureChange(index, e.target.value)}
                            placeholder={`Feature ${index + 1}`}
                          />
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleRemoveFeature(index)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddFeature}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Feature
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium">Active Plan</label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={editingPlan ? handleUpdatePlan : handleCreatePlan}>
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="flex justify-center">
          <div className="w-full max-w-6xl">
            {plans.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block p-8 rounded-lg border bg-white shadow-sm">
                  <h3 className="text-lg font-medium mb-2">No Plans Yet</h3>
                  <p className="text-gray-500 mb-4">Create your first membership plan to get started</p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Create First Plan
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {plans.map((plan) => (
                  <Card key={plan._id} className="flex flex-col bg-white hover:shadow-lg transition-all duration-300 border-gray-100">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl font-semibold text-gray-900">{plan.name}</CardTitle>
                          <CardDescription className="mt-2 text-gray-500">{plan.description}</CardDescription>
                        </div>
                        <Badge 
                          variant={plan.isActive ? "default" : "secondary"}
                          className="ml-2"
                        >
                          {plan.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="space-y-6">
                        <div className="flex items-baseline gap-2 pt-2">
                          <span className="text-3xl font-bold text-primary">Rs. {plan.price}</span>
                          <span className="text-gray-500">/ {plan.duration} months</span>
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wider">Features</h4>
                          <ul className="space-y-3">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                <span className="text-gray-600 text-sm leading-relaxed">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 pt-6 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(plan)}
                        className="hover:bg-gray-50"
                      >
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePlan(plan._id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default MembershipPlansPage; 