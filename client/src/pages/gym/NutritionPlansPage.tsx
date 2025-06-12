import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import axiosInstance from '@/lib/axios';

interface NutritionPlan {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
  isActive: boolean;
  goal: string;
  targetCalories: string;
  targetProtein: string;
  targetCarbs: string;
  targetFats: string;
}

const NutritionPlansPage: React.FC = () => {
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<NutritionPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    features: [''],
    isActive: true,
    goal: '',
    targetCalories: '',
    targetProtein: '',
    targetCarbs: '',
    targetFats: ''
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axiosInstance.get('/nutrition-plans');
      if (response.data.success && Array.isArray(response.data.nutritionPlans)) {
        setPlans(response.data.nutritionPlans);
      } else {
        console.error('Unexpected API response format:', response.data);
        setPlans([]); // Set empty array as fallback
        toast.error('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Error fetching nutrition plans:', error);
      toast.error('Failed to fetch nutrition plans');
      setPlans([]); // Set empty array on error
    }
  };

  const handleCreatePlan = async () => {
    try {
      const dataToSend = {
        ...formData,
        price: Number(formData.price),
        duration: Number(formData.duration),
        targetCalories: Number(formData.targetCalories),
        targetProtein: Number(formData.targetProtein),
        targetCarbs: Number(formData.targetCarbs),
        targetFats: Number(formData.targetFats),
        features: formData.features.filter(feature => feature.trim() !== '')
      };
      console.log('Sending data:', dataToSend);
      const response = await axiosInstance.post('/nutrition-plans', dataToSend);
      if (response.data.success && response.data.nutritionPlan) {
        setPlans([...plans, response.data.nutritionPlan]);
        setIsDialogOpen(false);
        resetForm();
        toast.success('Nutrition plan created successfully');
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error creating nutrition plan:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.details || 'Failed to create nutrition plan';
      toast.error(errorMessage);
    }
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan) return;
    try {
      const response = await axiosInstance.put(`/nutrition-plans/${editingPlan._id}`, formData);
      if (response.data.success && response.data.nutritionPlan) {
        setPlans(plans.map(plan => plan._id === editingPlan._id ? response.data.nutritionPlan : plan));
        setIsDialogOpen(false);
        resetForm();
        toast.success('Nutrition plan updated successfully');
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error updating nutrition plan:', error);
      toast.error('Failed to update nutrition plan');
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      const response = await axiosInstance.delete(`/nutrition-plans/${id}`);
      if (response.data.success) {
        setPlans(plans.filter(plan => plan._id !== id));
        toast.success('Nutrition plan deleted successfully');
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error deleting nutrition plan:', error);
      toast.error('Failed to delete nutrition plan');
    }
  };

  const handleEdit = (plan: NutritionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      duration: plan.duration.toString(),
      features: plan.features,
      isActive: plan.isActive,
      goal: plan.goal,
      targetCalories: plan.targetCalories,
      targetProtein: plan.targetProtein,
      targetCarbs: plan.targetCarbs,
      targetFats: plan.targetFats
    });
    setIsDialogOpen(true);
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
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      features: [''],
      isActive: true,
      goal: '',
      targetCalories: '',
      targetProtein: '',
      targetCarbs: '',
      targetFats: ''
    });
    setEditingPlan(null);
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
              <h1 className="text-2xl font-semibold text-gray-900">Nutrition Plans</h1>
              <p className="text-gray-500 mt-1">
                Manage your gym's nutrition plans
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
                    {editingPlan ? 'Edit Nutrition Plan' : 'Create Nutrition Plan'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPlan 
                      ? 'Update the details of your nutrition plan.'
                      : 'Create a new nutrition plan for your gym.'}
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
                    <label htmlFor="goal" className="text-sm font-medium">Goal</label>
                    <Input
                      id="goal"
                      value={formData.goal}
                      onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                      placeholder="e.g., Weight Loss, Muscle Gain"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <label htmlFor="targetCalories" className="text-sm font-medium">Target Calories</label>
                      <Input
                        id="targetCalories"
                        type="number"
                        value={formData.targetCalories}
                        onChange={(e) => setFormData(prev => ({ ...prev, targetCalories: e.target.value }))}
                        placeholder="Daily calories"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="targetProtein" className="text-sm font-medium">Target Protein (g)</label>
                      <Input
                        id="targetProtein"
                        type="number"
                        value={formData.targetProtein}
                        onChange={(e) => setFormData(prev => ({ ...prev, targetProtein: e.target.value }))}
                        placeholder="Daily protein"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <label htmlFor="targetCarbs" className="text-sm font-medium">Target Carbs (g)</label>
                      <Input
                        id="targetCarbs"
                        type="number"
                        value={formData.targetCarbs}
                        onChange={(e) => setFormData(prev => ({ ...prev, targetCarbs: e.target.value }))}
                        placeholder="Daily carbs"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="targetFats" className="text-sm font-medium">Target Fats (g)</label>
                      <Input
                        id="targetFats"
                        type="number"
                        value={formData.targetFats}
                        onChange={(e) => setFormData(prev => ({ ...prev, targetFats: e.target.value }))}
                        placeholder="Daily fats"
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
                  <p className="text-gray-500 mb-4">Create your first nutrition plan to get started</p>
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
                          <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wider">Nutrition Targets</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Goal:</span>
                              <span className="ml-2 text-gray-900">{plan.goal}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Calories:</span>
                              <span className="ml-2 text-gray-900">{plan.targetCalories} kcal</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Protein:</span>
                              <span className="ml-2 text-gray-900">{plan.targetProtein}g</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Carbs:</span>
                              <span className="ml-2 text-gray-900">{plan.targetCarbs}g</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Fats:</span>
                              <span className="ml-2 text-gray-900">{plan.targetFats}g</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wider">Meals</h4>
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

export default NutritionPlansPage; 