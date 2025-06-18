import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Eye, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import axiosInstance from '@/lib/axios';
import GeminiNutritionForm from '@/components/nutrition/GeminiNutritionForm';

interface Customer {
  _id: string;
  name: string;
}

interface FoodItem {
  food_name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Meal {
  meal_type: string;
  time: string;
  calories: number;
  items: FoodItem[];
}

interface NutritionPlan {
  _id: string;
  user_id: string;
  plan_name: string;
  total_calories: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
  createdAt: string;
  meals: Meal[];
}

const NutritionPlansPage: React.FC = () => {
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGeminiDialogOpen, setIsGeminiDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<NutritionPlan | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<NutritionPlan | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    plan_name: '',
    total_calories: '',
    protein_target: '',
    carbs_target: '',
    fat_target: '',
    meals: [
      {
        meal_type: 'Breakfast',
        time: '07:00 AM',
        calories: 0,
        items: [
          {
            food_name: '',
            quantity: '',
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
          }
        ]
      }
    ]
  });

  useEffect(() => {
    fetchPlans();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (isDialogOpen && !editingPlan) {
      resetForm();
    }
  }, [isDialogOpen, editingPlan]);

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

  const fetchPlans = async () => {
    try {
      const response = await axiosInstance.get('/nutrition-plans');
      if (response.data.success && Array.isArray(response.data.nutritionPlans)) {
        setPlans(response.data.nutritionPlans);
      } else {
        console.error('Unexpected API response format:', response.data);
        setPlans([]);
        toast.error('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Error fetching nutrition plans:', error);
      toast.error('Failed to fetch nutrition plans');
      setPlans([]);
    }
  };

  const getUserName = (userId: string) => {
    const customer = customers.find(c => c._id === userId);
    return customer ? customer.name : 'Unknown User';
  };

  const filteredPlans = plans.filter(plan => {
    const userName = getUserName(plan.user_id).toLowerCase();
    return userName.includes(searchQuery.toLowerCase());
  });

  const handleCreatePlan = async () => {
    try {
      const dataToSend = {
        ...formData,
        total_calories: Number(formData.total_calories),
        protein_target: Number(formData.protein_target),
        carbs_target: Number(formData.carbs_target),
        fat_target: Number(formData.fat_target),
        meals: formData.meals.map(meal => ({
          ...meal,
          calories: Number(meal.calories),
          items: meal.items.map(item => ({
            ...item,
            calories: Number(item.calories),
            protein: Number(item.protein),
            carbs: Number(item.carbs),
            fat: Number(item.fat)
          }))
        }))
      };
      
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
      plan_name: plan.plan_name,
      total_calories: plan.total_calories.toString(),
      protein_target: plan.protein_target.toString(),
      carbs_target: plan.carbs_target.toString(),
      fat_target: plan.fat_target.toString(),
      meals: plan.meals.map(meal => ({
        meal_type: meal.meal_type,
        time: meal.time,
        calories: meal.calories,
        items: meal.items.map(item => ({
          food_name: item.food_name,
          quantity: item.quantity,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat
        }))
      }))
    });
    setIsDialogOpen(true);
  };

  const handleMealChange = (mealIndex: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      meals: prev.meals.map((meal, i) => 
        i === mealIndex 
          ? { ...meal, [field]: value }
          : meal
      )
    }));
  };

  const handleAddMeal = () => {
    setFormData(prev => ({
      ...prev,
      meals: [
        ...prev.meals,
        {
          meal_type: '',
          time: '',
          calories: 0,
          items: [
            {
              food_name: '',
              quantity: '',
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0
            }
          ]
        }
      ]
    }));
  };

  const handleRemoveMeal = (mealIndex: number) => {
    setFormData(prev => ({
      ...prev,
      meals: prev.meals.filter((_, i) => i !== mealIndex)
    }));
  };

  const handleAddFoodItem = (mealIndex: number) => {
    setFormData(prev => ({
      ...prev,
      meals: prev.meals.map((meal, i) => 
        i === mealIndex 
          ? {
              ...meal,
              items: [
                ...meal.items,
                {
                  food_name: '',
                  quantity: '',
                  calories: 0,
                  protein: 0,
                  carbs: 0,
                  fat: 0
                }
              ]
            }
          : meal
      )
    }));
  };

  const handleRemoveFoodItem = (mealIndex: number, itemIndex: number) => {
    setFormData(prev => ({
      ...prev,
      meals: prev.meals.map((meal, i) => 
        i === mealIndex 
          ? {
              ...meal,
              items: meal.items.filter((_, j) => j !== itemIndex)
            }
          : meal
      )
    }));
  };

  const handleFoodItemChange = (mealIndex: number, itemIndex: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      meals: prev.meals.map((meal, i) => 
        i === mealIndex 
          ? {
              ...meal,
              items: meal.items.map((item, j) => 
                j === itemIndex 
                  ? { ...item, [field]: value }
                  : item
              )
            }
          : meal
      )
    }));
  };

  const resetForm = () => {
    setFormData({
      plan_name: '',
      total_calories: '',
      protein_target: '',
      carbs_target: '',
      fat_target: '',
      meals: [
        {
          meal_type: 'Breakfast',
          time: '07:00 AM',
          calories: 0,
          items: [
            {
              food_name: '',
              quantity: '',
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0
            }
          ]
        }
      ]
    });
    setEditingPlan(null);
  };

  const handleGeminiPlanGenerated = (plan: NutritionPlan) => {
    setPlans([plan, ...plans]);
    setIsGeminiDialogOpen(false);
  };

  const handleViewPlan = (plan: NutritionPlan) => {
    setSelectedPlan(plan);
    setIsViewDialogOpen(true);
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
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Nutrition Plans</h1>
              <p className="text-gray-500 mt-1">
                Manage your nutrition plans
              </p>
            </div>
            <div className="flex gap-4">
              <Dialog open={isGeminiDialogOpen} onOpenChange={setIsGeminiDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-green-500 hover:bg-green-600 text-white">
                    <Plus className="mr-2 h-4 w-4" /> AI Generate Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Generate Nutrition Plan with AI</DialogTitle>
                    <DialogDescription>
                      Fill in the details below to generate a personalized nutrition plan using AI.
                    </DialogDescription>
                  </DialogHeader>
                  <GeminiNutritionForm onPlanGenerated={handleGeminiPlanGenerated} />
                </DialogContent>
              </Dialog>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Create Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingPlan ? 'Edit Nutrition Plan' : 'Create Nutrition Plan'}</DialogTitle>
                    <DialogDescription>
                      {editingPlan ? 'Update the nutrition plan details below.' : 'Fill in the details to create a new nutrition plan.'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan} className="space-y-6">
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Plan Name</label>
                        <Input
                          value={formData.plan_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, plan_name: e.target.value }))}
                          placeholder="Enter plan name"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Total Calories</label>
                          <Input
                            type="number"
                            value={formData.total_calories}
                            onChange={(e) => setFormData(prev => ({ ...prev, total_calories: e.target.value }))}
                            placeholder="Enter total calories"
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Protein Target (g)</label>
                          <Input
                            type="number"
                            value={formData.protein_target}
                            onChange={(e) => setFormData(prev => ({ ...prev, protein_target: e.target.value }))}
                            placeholder="Enter protein target"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Carbs Target (g)</label>
                          <Input
                            type="number"
                            value={formData.carbs_target}
                            onChange={(e) => setFormData(prev => ({ ...prev, carbs_target: e.target.value }))}
                            placeholder="Enter carbs target"
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Fat Target (g)</label>
                          <Input
                            type="number"
                            value={formData.fat_target}
                            onChange={(e) => setFormData(prev => ({ ...prev, fat_target: e.target.value }))}
                            placeholder="Enter fat target"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">Meals</h3>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddMeal}
                          >
                            <Plus className="h-4 w-4 mr-2" /> Add Meal
                          </Button>
                        </div>
                        {formData.meals.map((meal, mealIndex) => (
                          <div key={mealIndex} className="border rounded-lg p-4 space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="text-md font-medium">Meal {mealIndex + 1}</h4>
                              {mealIndex > 0 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveMeal(mealIndex)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <label className="text-sm font-medium">Meal Type</label>
                                <Input
                                  value={meal.meal_type}
                                  onChange={(e) => handleMealChange(mealIndex, 'meal_type', e.target.value)}
                                  placeholder="e.g., Breakfast, Lunch"
                                  required
                                />
                              </div>
                              <div className="grid gap-2">
                                <label className="text-sm font-medium">Time</label>
                                <Input
                                  value={meal.time}
                                  onChange={(e) => handleMealChange(mealIndex, 'time', e.target.value)}
                                  placeholder="e.g., 07:00 AM"
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid gap-2">
                              <label className="text-sm font-medium">Total Calories</label>
                              <Input
                                type="number"
                                value={meal.calories}
                                onChange={(e) => handleMealChange(mealIndex, 'calories', e.target.value)}
                                placeholder="Enter meal calories"
                                required
                              />
                            </div>

                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h5 className="text-sm font-medium">Food Items</h5>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAddFoodItem(mealIndex)}
                                >
                                  <Plus className="h-4 w-4 mr-2" /> Add Food Item
                                </Button>
                              </div>
                              {meal.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="border rounded p-3 space-y-3">
                                  <div className="flex justify-between items-center">
                                    <h6 className="text-sm font-medium">Food Item {itemIndex + 1}</h6>
                                    {itemIndex > 0 && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRemoveFoodItem(mealIndex, itemIndex)}
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                      <label className="text-sm font-medium">Food Name</label>
                                      <Input
                                        value={item.food_name}
                                        onChange={(e) => handleFoodItemChange(mealIndex, itemIndex, 'food_name', e.target.value)}
                                        placeholder="Enter food name"
                                        required
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <label className="text-sm font-medium">Quantity</label>
                                      <Input
                                        value={item.quantity}
                                        onChange={(e) => handleFoodItemChange(mealIndex, itemIndex, 'quantity', e.target.value)}
                                        placeholder="Enter quantity"
                                        required
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                      <label className="text-sm font-medium">Calories</label>
                                      <Input
                                        type="number"
                                        value={item.calories}
                                        onChange={(e) => handleFoodItemChange(mealIndex, itemIndex, 'calories', e.target.value)}
                                        placeholder="Enter calories"
                                        required
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <label className="text-sm font-medium">Protein (g)</label>
                                      <Input
                                        type="number"
                                        value={item.protein}
                                        onChange={(e) => handleFoodItemChange(mealIndex, itemIndex, 'protein', e.target.value)}
                                        placeholder="Enter protein"
                                        required
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                      <label className="text-sm font-medium">Carbs (g)</label>
                                      <Input
                                        type="number"
                                        value={item.carbs}
                                        onChange={(e) => handleFoodItemChange(mealIndex, itemIndex, 'carbs', e.target.value)}
                                        placeholder="Enter carbs"
                                        required
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <label className="text-sm font-medium">Fat (g)</label>
                                      <Input
                                        type="number"
                                        value={item.fat}
                                        onChange={(e) => handleFoodItemChange(mealIndex, itemIndex, 'fat', e.target.value)}
                                        placeholder="Enter fat"
                                        required
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingPlan ? 'Update Plan' : 'Create Plan'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by user name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <Card key={plan._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{plan.plan_name}</CardTitle>
                    <CardDescription className="mt-1">
                      {getUserName(plan.user_id)}
                    </CardDescription>
                    <CardDescription className="text-xs text-gray-400">
                      Created on {new Date(plan.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewPlan(plan)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(plan)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePlan(plan._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Total Calories:</span>
                      <span className="ml-2 text-gray-900">{plan.total_calories} kcal</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Protein:</span>
                      <span className="ml-2 text-gray-900">{plan.protein_target}g</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {plan.meals.length} meals planned
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View Plan Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedPlan?.plan_name}</DialogTitle>
              <DialogDescription>
                {selectedPlan && (
                  <>
                    <div>User: {getUserName(selectedPlan.user_id)}</div>
                    <div>Created on {new Date(selectedPlan.createdAt).toLocaleDateString()}</div>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            {selectedPlan && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-500">Total Calories</div>
                    <div className="text-lg font-semibold">{selectedPlan.total_calories} kcal</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Protein Target</div>
                    <div className="text-lg font-semibold">{selectedPlan.protein_target}g</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Carbs Target</div>
                    <div className="text-lg font-semibold">{selectedPlan.carbs_target}g</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Fat Target</div>
                    <div className="text-lg font-semibold">{selectedPlan.fat_target}g</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedPlan.meals.map((meal, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-lg">{meal.meal_type}</h3>
                        <span className="text-sm text-gray-500">{meal.time}</span>
                      </div>
                      <div className="text-sm text-gray-500 mb-3">
                        {meal.calories} calories
                      </div>
                      <div className="space-y-2">
                        {meal.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-gray-900">{item.food_name}</div>
                              <div className="text-sm text-gray-500">
                                {item.quantity} • {item.calories} kcal
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
};

export default NutritionPlansPage; 