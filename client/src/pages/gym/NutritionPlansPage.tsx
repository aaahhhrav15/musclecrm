import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Search,
  ChefHat,
  Target,
  Clock,
  Utensils,
  Activity,
  Zap,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import axiosInstance from '@/lib/axios';
import GeminiNutritionForm from '@/components/nutrition/GeminiNutritionForm';
import { Skeleton } from '@/components/ui/skeleton';
import * as Papa from 'papaparse';

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

export interface NutritionPlan {
  _id: string;
  user_id: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  plan_name: string;
  total_calories: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
  additional_notes?: string;
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [formData, setFormData] = useState({
    user_id: '',
    plan_name: '',
    total_calories: '',
    protein_target: '',
    carbs_target: '',
    fat_target: '',
    additional_notes: '',
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
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchPlans(), fetchCustomers()]);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (isDialogOpen && !editingPlan) {
      resetForm();
    }
  }, [isDialogOpen, editingPlan]);

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

  // Helper function to safely get customer name from nutrition plan
  const getCustomerName = (plan: NutritionPlan) => {
    if (plan.user_id && typeof plan.user_id === 'object' && plan.user_id.name) {
      return plan.user_id.name;
    }
    // Fallback to looking up by ID if user_id is a string
    if (typeof plan.user_id === 'string') {
      return getUserName(plan.user_id);
    }
    return 'Unknown User';
  };

  // Helper function to safely get customer ID from nutrition plan
  const getCustomerId = (plan: NutritionPlan) => {
    if (plan.user_id && typeof plan.user_id === 'object' && plan.user_id._id) {
      return plan.user_id._id;
    }
    // Fallback to user_id if it's a string
    if (typeof plan.user_id === 'string') {
      return plan.user_id;
    }
    return '';
  };

  // Enhanced filtering and sorting
  const filteredAndSortedPlans = React.useMemo(() => {
    const filtered = plans.filter(plan => {
      const userName = getCustomerName(plan).toLowerCase();
      const planName = plan.plan_name.toLowerCase();
      const query = searchQuery.toLowerCase();
      return userName.includes(query) || planName.includes(query);
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return a.plan_name.localeCompare(b.plan_name);
        case 'calories_high':
          return b.total_calories - a.total_calories;
        case 'calories_low':
          return a.total_calories - b.total_calories;
        default:
          return 0;
      }
    });

    return filtered;
  }, [plans, searchQuery, sortBy, customers]);

  // Calculate insights
  const insights = React.useMemo(() => {
    const totalPlans = plans.length;
    const totalCalories = plans.reduce((sum, plan) => sum + plan.total_calories, 0);
    const avgCalories = totalPlans > 0 ? Math.round(totalCalories / totalPlans) : 0;
    const totalMeals = plans.reduce((sum, plan) => sum + plan.meals.length, 0);
    const recentPlans = plans.filter(plan => {
      const planDate = new Date(plan.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return planDate > weekAgo;
    }).length;

    return {
      totalPlans,
      avgCalories,
      totalMeals,
      recentPlans
    };
  }, [plans]);

  const handleCreatePlan = async () => {
    try {
      const dataToSend = {
        ...formData,
        user_id: formData.user_id,
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
        setPlans([response.data.nutritionPlan, ...plans]);
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
    setPlanToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return;

    try {
      const response = await axiosInstance.delete(`/nutrition-plans/${planToDelete}`);
      if (response.data.success) {
        setPlans(plans.filter(plan => plan._id !== planToDelete));
        toast.success('Nutrition plan deleted successfully');
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error deleting nutrition plan:', error);
      toast.error('Failed to delete nutrition plan');
    } finally {
      setIsDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const handleEdit = (plan: NutritionPlan) => {
    setEditingPlan(plan);
    setFormData({
      user_id: getCustomerId(plan),
      plan_name: plan.plan_name,
      total_calories: plan.total_calories.toString(),
      protein_target: plan.protein_target.toString(),
      carbs_target: plan.carbs_target.toString(),
      fat_target: plan.fat_target.toString(),
      additional_notes: plan.additional_notes || '',
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

  const handleExport = () => {
    if (!filteredAndSortedPlans || filteredAndSortedPlans.length === 0) {
      toast.error("No data to export.");
      return;
    }

    const dataToExport = filteredAndSortedPlans.map(plan => ({
      "Plan Name": plan.plan_name,
      "User": getCustomerName(plan),
      "Total Calories": plan.total_calories,
      "Protein Target": plan.protein_target,
      "Carbs Target": plan.carbs_target,
      "Fat Target": plan.fat_target,
      "Number of Meals": plan.meals.length,
      "Created Date": new Date(plan.createdAt).toLocaleDateString(),
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `nutrition-plans-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Nutrition plans exported successfully!");
  };

  // ... [All the meal and food item handler functions remain the same] ...
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
      user_id: '',
      plan_name: '',
      total_calories: '',
      protein_target: '',
      carbs_target: '',
      fat_target: '',
      additional_notes: '',
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

  const filteredCustomers = React.useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const search = customerSearch.toLowerCase();
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(search)
    );
  }, [customers, customerSearch]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-[500px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-8"
      >
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-4 border-b">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Nutrition Plans
            </h1>
            <p className="text-muted-foreground text-lg">
              Create and manage personalized nutrition plans for your members.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="shadow-sm" onClick={handleExport}>
              <Download className="mr-2 h-5 w-5" /> Export Data
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="shadow-sm bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
              onClick={() => setIsGeminiDialogOpen(true)}
            >
              <Zap className="mr-2 h-5 w-5" /> AI Generate Plan
            </Button>
            <Button onClick={() => setIsDialogOpen(true)} size="lg" className="shadow-sm">
              <Plus className="mr-2 h-5 w-5" /> Create Plan
            </Button>
          </div>
        </div>

        {/* Insights Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Plans</CardTitle>
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <ChefHat className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">{insights.totalPlans}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Nutrition plans created
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Calories</CardTitle>
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">{insights.avgCalories}</div>
                <p className="text-xs text-muted-foreground">kcal per plan</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Meals</CardTitle>
                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Utensils className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">{insights.totalMeals}</div>
                <p className="text-xs text-muted-foreground">Meals planned</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Recent Plans</CardTitle>
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">{insights.recentPlans}</div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by plan name or user..."
              className="pl-10 h-11 shadow-sm border-muted-foreground/20 focus:ring-2 focus:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-11">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name">Plan Name</SelectItem>
                <SelectItem value="calories_high">Highest Calories</SelectItem>
                <SelectItem value="calories_low">Lowest Calories</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || sortBy !== 'newest') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setSortBy('newest');
                }}
                className="h-11"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedPlans.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <ChefHat className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Nutrition Plans Found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery 
                  ? 'Try adjusting your search criteria.' 
                  : 'Get started by creating your first nutrition plan.'}
              </p>
              {!searchQuery && (
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setIsGeminiDialogOpen(true)} variant="outline">
                    <Zap className="h-4 w-4 mr-2" />
                    AI Generate Plan
                  </Button>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Plan
                  </Button>
                </div>
              )}
            </div>
          ) : (
            filteredAndSortedPlans.map((plan, index) => (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md group">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg font-semibold line-clamp-1">{plan.plan_name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {getCustomerName(plan)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(plan.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewPlan(plan)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleDeletePlan(plan._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Activity className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Calories</span>
                          </div>
                          <div className="text-sm font-semibold">{plan.total_calories} kcal</div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Protein</span>
                          </div>
                          <div className="text-sm font-semibold">{plan.protein_target}g</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Utensils className="h-3 w-3" />
                          <span>{plan.meals.length} meals planned</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Daily plan</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Create/Edit Plan Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {editingPlan ? 'Edit Nutrition Plan' : 'Create Nutrition Plan'}
              </DialogTitle>
              <DialogDescription>
                {editingPlan ? 'Update the nutrition plan details below.' : 'Fill in the details to create a new nutrition plan.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              editingPlan ? handleUpdatePlan() : handleCreatePlan();
            }} className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Customer</label>
                  <div className="space-y-2 relative" ref={customerDropdownRef}>
                    {formData.user_id ? (
                      <div className="flex items-center justify-between p-3 border rounded-md bg-green-50">
                        <div>
                          <p className="font-medium">{customers.find(c => c._id === formData.user_id)?.name || 'Selected Customer'}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, user_id: '' }));
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
                                        setFormData(prev => ({ ...prev, user_id: customer._id }));
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

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Plan Name</label>
                  <Input
                    value={formData.plan_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, plan_name: e.target.value }))}
                    placeholder="Enter plan name"
                    required
                    className="h-11"
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
                      className="h-11"
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
                      className="h-11"
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
                      className="h-11"
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
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Additional Notes</label>
                  <textarea
                    value={formData.additional_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
                    placeholder="Enter any additional notes, tips, or recommendations for this nutrition plan..."
                    className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
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
                    <Card key={mealIndex} className="border border-muted">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Meal {mealIndex + 1}</h4>
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
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <label className="text-sm font-medium">Meal Type</label>
                            <Input
                              value={meal.meal_type}
                              onChange={(e) => handleMealChange(mealIndex, 'meal_type', e.target.value)}
                              placeholder="e.g., Breakfast, Lunch"
                              required
                              className="h-10"
                            />
                          </div>
                          <div className="grid gap-2">
                            <label className="text-sm font-medium">Time</label>
                            <Input
                              value={meal.time}
                              onChange={(e) => handleMealChange(mealIndex, 'time', e.target.value)}
                              placeholder="e.g., 07:00 AM"
                              required
                              className="h-10"
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
                            className="h-10"
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
                            <Card key={itemIndex} className="border border-muted/50 bg-muted/30">
                              <CardContent className="pt-4 space-y-3">
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
                                      className="h-9"
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <label className="text-sm font-medium">Quantity</label>
                                    <Input
                                      value={item.quantity}
                                      onChange={(e) => handleFoodItemChange(mealIndex, itemIndex, 'quantity', e.target.value)}
                                      placeholder="Enter quantity"
                                      required
                                      className="h-9"
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
                                      className="h-9"
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
                                      className="h-9"
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
                                      className="h-9"
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
                                      className="h-9"
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Gemini AI Dialog */}
        <Dialog open={isGeminiDialogOpen} onOpenChange={setIsGeminiDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-600" />
                Generate Nutrition Plan with AI
              </DialogTitle>
              <DialogDescription>
                Fill in the details below to generate a personalized nutrition plan using AI.
              </DialogDescription>
            </DialogHeader>
            <GeminiNutritionForm onPlanGenerated={handleGeminiPlanGenerated} />
          </DialogContent>
        </Dialog>

        {/* View Plan Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                {selectedPlan?.plan_name}
              </DialogTitle>
              <DialogDescription>
                {selectedPlan && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span>User: {getCustomerName(selectedPlan)}</span>
                      <Badge variant="outline">{new Date(selectedPlan.createdAt).toLocaleDateString()}</Badge>
                    </div>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            {selectedPlan && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg border">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Total Calories</div>
                    <div className="text-2xl font-bold text-primary">{selectedPlan.total_calories}</div>
                    <div className="text-xs text-muted-foreground">kcal</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Protein Target</div>
                    <div className="text-2xl font-bold text-green-600">{selectedPlan.protein_target}</div>
                    <div className="text-xs text-muted-foreground">grams</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Carbs Target</div>
                    <div className="text-2xl font-bold text-blue-600">{selectedPlan.carbs_target}</div>
                    <div className="text-xs text-muted-foreground">grams</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Fat Target</div>
                    <div className="text-2xl font-bold text-orange-600">{selectedPlan.fat_target}</div>
                    <div className="text-xs text-muted-foreground">grams</div>
                  </div>
                </div>

                {selectedPlan.additional_notes && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Additional Notes
                    </h3>
                    <Card className="border shadow-sm">
                      <CardContent className="pt-6">
                        <div className="prose prose-sm max-w-none">
                          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {selectedPlan.additional_notes}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Utensils className="h-5 w-5" />
                    Meal Plan
                  </h3>
                  {selectedPlan.meals.map((meal, index) => (
                    <Card key={index} className="border shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Utensils className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg">{meal.meal_type}</h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{meal.time}</span>
                                <span>•</span>
                                <span>{meal.calories} calories</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {meal.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="font-medium text-foreground">{item.food_name}</div>
                                <div className="text-sm text-muted-foreground mb-2">
                                  {item.quantity} • {item.calories} kcal
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-xs">
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <span>Protein: {item.protein}g</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <span>Carbs: {item.carbs}g</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                    <span>Fat: {item.fat}g</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the nutrition plan and all its meal data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Plan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </DashboardLayout>
  );
};

export default NutritionPlansPage;