import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/config';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  Target,
  TrendingUp,
  Dumbbell,
  Calendar,
  Activity,
  Users
} from 'lucide-react';

interface WorkoutPlan {
  _id: string;
  name: string;
  goal: string;
  duration: number;
  level: string;
}

const WorkoutPlansPage: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterGoal, setFilterGoal] = useState<string>('all');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_URL}/workout-plans`, {
        withCredentials: true,
      });
      
      if (response.data && response.data.success && Array.isArray(response.data.workoutPlans)) {
        setPlans(response.data.workoutPlans);
      } else {
        console.error('Unexpected response structure:', response.data);
        toast.error('Invalid response format from server');
        setPlans([]);
      }
    } catch (error) {
      console.error('Error fetching workout plans:', error);
      toast.error('Failed to fetch workout plans');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this workout plan?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/workout-plans/${id}`, {
        withCredentials: true,
      });
      toast.success('Workout plan deleted successfully');
      fetchPlans();
    } catch (error) {
      console.error('Error deleting workout plan:', error);
      toast.error('Failed to delete workout plan');
    }
  };

  // Filter plans based on search and filters
  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plan.goal.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === 'all' || plan.level === filterLevel;
    const matchesGoal = filterGoal === 'all' || plan.goal === filterGoal;
    
    return matchesSearch && matchesLevel && matchesGoal;
  });

  // Get unique goals and levels for filters
  const uniqueGoals = [...new Set(plans.map(plan => plan.goal))];
  const uniqueLevels = [...new Set(plans.map(plan => plan.level))];

  const getLevelBadgeVariant = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'secondary';
      case 'intermediate': return 'default';
      case 'advanced': return 'destructive';
      default: return 'outline';
    }
  };

  const getGoalIcon = (goal: string) => {
    switch (goal.toLowerCase()) {
      case 'weight loss': return <TrendingUp className="h-4 w-4" />;
      case 'muscle gain': return <Dumbbell className="h-4 w-4" />;
      case 'strength': return <Activity className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="h-12 bg-muted animate-pulse rounded" />
          <div className="h-[400px] bg-muted animate-pulse rounded" />
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
              Workout Plans
            </h1>
            <p className="text-muted-foreground text-lg">
              Create and manage personalized workout routines for your members.
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard/gym/workout-plans/assigned')}
              size="lg" 
              className="shadow-sm"
            >
              <Users className="h-5 w-5 mr-2" />
              View Assigned Plans
            </Button>
            <Button 
              onClick={() => navigate('/dashboard/gym/workout-plans/create')}
              size="lg" 
              className="shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Plan
            </Button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workout plans by name or goal..."
              className="pl-10 h-11 shadow-sm border-muted-foreground/20 focus:ring-2 focus:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3">
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-[140px] h-11">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {uniqueLevels.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterGoal} onValueChange={setFilterGoal}>
              <SelectTrigger className="w-[140px] h-11">
                <SelectValue placeholder="All Goals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Goals</SelectItem>
                {uniqueGoals.map(goal => (
                  <SelectItem key={goal} value={goal}>{goal}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchQuery || filterLevel !== 'all' || filterGoal !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setFilterLevel('all');
                  setFilterGoal('all');
                }}
                className="h-11"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Workout Plans Table */}
        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold flex items-center">
                <Dumbbell className="h-5 w-5 mr-2" />
                Workout Plans Management
              </CardTitle>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {filteredPlans.length} plans
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredPlans.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Dumbbell className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Workout Plans Found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || filterLevel !== 'all' || filterGoal !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'Get started by creating your first workout plan.'}
                </p>
                {!searchQuery && filterLevel === 'all' && filterGoal === 'all' && (
                  <Button onClick={() => navigate('/dashboard/gym/workout-plans/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Plan
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-muted/50">
                      <TableHead className="font-semibold">Plan Details</TableHead>
                      <TableHead className="font-semibold">Goal</TableHead>
                      <TableHead className="font-semibold">Duration</TableHead>
                      <TableHead className="font-semibold">Level</TableHead>
                      <TableHead className="font-semibold w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlans.map((plan, index) => (
                      <motion.tr
                        key={plan._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">{plan.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Comprehensive workout routine
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getGoalIcon(plan.goal)}
                            <span className="font-medium">{plan.goal}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{plan.duration} weeks</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getLevelBadgeVariant(plan.level)}>
                            {plan.level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => navigate(`/dashboard/gym/workout-plans/${plan._id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/dashboard/gym/workout-plans/${plan._id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Plan
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDelete(plan._id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Plan
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default WorkoutPlansPage;