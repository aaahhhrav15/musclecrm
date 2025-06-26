import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2,
  XCircle,
  Search,
  MoreHorizontal,
  Clock
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
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
  gymId: string;
}

const MembershipPlansPage: React.FC = () => {
  useRequireAuth();
  const { selectedIndustry, setSelectedIndustry } = useIndustry();
  
  useEffect(() => {
    if (selectedIndustry !== 'gym') {
      setSelectedIndustry('gym');
    }
  }, [selectedIndustry, setSelectedIndustry]);

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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
        setPlans([]);
        toast({
          title: "Error",
          description: "Invalid data format received from server",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load membership plans",
        variant: "destructive",
      });
      setPlans([]);
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

  // Filter plans
  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && plan.isActive) ||
                         (statusFilter === 'inactive' && !plan.isActive);
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
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
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-4 border-b">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Membership Plans
            </h1>
            <p className="text-muted-foreground text-lg">
              Create and manage flexible membership packages for your gym members.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg" onClick={resetForm}>
                <Plus className="mr-2 h-5 w-5" />
                Create New Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {editingPlan ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  {editingPlan ? 'Edit Membership Plan' : 'Create Membership Plan'}
                </DialogTitle>
                <DialogDescription>
                  {editingPlan 
                    ? 'Update the details of your membership plan.'
                    : 'Create a new membership plan for your gym members.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-3">
                  <label htmlFor="name" className="text-sm font-medium">Plan Name</label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Premium Membership"
                    className="h-11"
                  />
                </div>
                <div className="grid gap-3">
                  <label htmlFor="description" className="text-sm font-medium">Description</label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the plan benefits..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <label htmlFor="price" className="text-sm font-medium">Price (₹)</label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                      className="h-11"
                    />
                  </div>
                  <div className="grid gap-3">
                    <label htmlFor="duration" className="text-sm font-medium">Duration (months)</label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="12"
                      className="h-11"
                    />
                  </div>
                </div>
                <div className="grid gap-3">
                  <label className="text-sm font-medium">Plan Features</label>
                  <div className="space-y-3">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => handleFeatureChange(index, e.target.value)}
                          placeholder={`Feature ${index + 1}`}
                          className="h-11"
                        />
                        {formData.features.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleRemoveFeature(index)}
                            className="h-11 w-11 flex-shrink-0"
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
                      className="w-full h-11"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Another Feature
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    Make this plan active and available for members
                  </label>
                </div>
              </div>
              <DialogFooter className="gap-3">
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={editingPlan ? handleUpdatePlan : handleCreatePlan}>
                  {editingPlan ? (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Plan
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Plan
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search plans by name or description..."
              className="pl-10 h-11 shadow-sm border-muted-foreground/20 focus:ring-2 focus:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-11">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || statusFilter !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="h-11"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        {filteredPlans.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-gray-900">
              {searchQuery || statusFilter !== 'all' ? 'No Plans Found' : 'No Membership Plans Yet'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first membership plan to get started.'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Plan
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan, index) => (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group h-full flex flex-col bg-white border-0 shadow-sm hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden">
                  {/* Colored top border */}
                  <div className={`h-1 ${
                    plan.name.toLowerCase().includes('premium') || plan.name.toLowerCase().includes('platinum') 
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500' 
                      : plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('elite')
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                  }`} />
                  
                  <CardHeader className="pb-4 relative">
                    {/* Background pattern */}
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                      <div className={`w-full h-full rounded-full ${
                        plan.name.toLowerCase().includes('premium') || plan.name.toLowerCase().includes('platinum') 
                          ? 'bg-amber-400' 
                          : plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('elite')
                          ? 'bg-purple-500'
                          : 'bg-blue-500'
                      } transform translate-x-16 -translate-y-16`} />
                    </div>
                    
                    <div className="flex items-start justify-between relative">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            plan.name.toLowerCase().includes('premium') || plan.name.toLowerCase().includes('platinum') 
                              ? 'bg-amber-50 text-amber-600' 
                              : plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('elite')
                              ? 'bg-purple-50 text-purple-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}>
                            <span className="text-lg font-bold">
                              {plan.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                              {plan.name}
                            </CardTitle>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{plan.duration} {plan.duration === 1 ? 'month' : 'months'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {plan.description}
                        </p>
                      </div>
                      
                      {/* Direct Edit/Delete Buttons */}
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(plan)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePlan(plan._id)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-grow pt-0">
                    {/* Pricing Section */}
                    <div className={`p-4 rounded-lg mb-6 ${
                      plan.name.toLowerCase().includes('premium') || plan.name.toLowerCase().includes('platinum') 
                        ? 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100' 
                        : plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('elite')
                        ? 'bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100'
                        : 'bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100'
                    }`}>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                          {formatCurrency(plan.price)}
                        </div>
                        <div className="text-sm text-gray-600 font-medium">
                          per {plan.duration} {plan.duration === 1 ? 'month' : 'months'}
                        </div>
                      </div>
                    </div>

                    {/* Status and Features */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Plan Features
                        </span>
                        <Badge 
                          variant={plan.isActive ? "default" : "secondary"} 
                          className={`text-xs ${plan.isActive ? 
                            plan.name.toLowerCase().includes('premium') || plan.name.toLowerCase().includes('platinum') 
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' 
                              : plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('elite')
                              ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            : ''
                          }`}
                        >
                          {plan.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        {plan.features.slice(0, 5).map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3 group/item">
                            <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                              plan.name.toLowerCase().includes('premium') || plan.name.toLowerCase().includes('platinum') 
                                ? 'bg-amber-400' 
                                : plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('elite')
                                ? 'bg-purple-400'
                                : 'bg-blue-400'
                            }`} />
                            <span className="text-sm text-gray-700 leading-relaxed group-hover/item:text-gray-900 transition-colors">
                              {feature}
                            </span>
                          </div>
                        ))}
                        {plan.features.length > 5 && (
                          <div className="flex items-center gap-3 pl-5">
                            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                              +{plan.features.length - 5} more features
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default MembershipPlansPage;