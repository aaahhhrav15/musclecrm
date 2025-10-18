import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { toast } from 'sonner';
import { 
  Trash2, 
  Plus, 
  Eye, 
  Search,
  Filter,
  MoreHorizontal,
  Users,
  Calendar,
  Target,
  Activity,
  Clock,
  User,
  CheckCircle,
  XCircle,
  PlayCircle,
  FileText
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/config';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  restTime: number;
  notes?: string;
}

interface Day {
  dayNumber: number;
  muscleGroups?: string;
  exercises: Exercise[];
}

interface Week {
  weekNumber: number;
  days: Day[];
}

interface AssignedPlan {
  _id: string;
  customerId: string;
  memberName: string;
  startDate: string;
  notes: string;
  status: string;
  plan: {
    _id: string;
    name: string;
    goal: string;
    level: string;
    duration: number;
    weeks: Week[];
  } | null;
  createdAt: string;
  updatedAt: string;
}

const AssignedWorkoutPlansPage: React.FC = () => {
  const [assignedPlans, setAssignedPlans] = React.useState<AssignedPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = React.useState<AssignedPlan | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const navigate = useNavigate();

  const fetchAssignedPlans = async () => {
    try {
      const response = await axios.get(`${API_URL}/workout-plans/assigned`, {
        withCredentials: true
      });
      setAssignedPlans(response.data.assignedPlans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to fetch assigned plans');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAssignedPlans();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to unassign this workout plan?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/workout-plans/assigned/${id}`, {
        withCredentials: true
      });

      toast.success('Workout plan unassigned successfully');
      fetchAssignedPlans();
    } catch (err) {
      console.error('Error deleting assigned plan:', err);
      toast.error('Failed to unassign workout plan');
    }
  };

  const handleViewPlan = (plan: AssignedPlan) => {
    setSelectedPlan(plan);
    setIsViewModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge variant="default" className="bg-green-500"><PlayCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-blue-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return <Badge variant="secondary">Beginner</Badge>;
      case 'intermediate':
        return <Badge variant="default">Intermediate</Badge>;
      case 'advanced':
        return <Badge variant="destructive">Advanced</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  // Filter plans
  const filteredPlans = assignedPlans.filter(plan => {
    const matchesSearch = 
      plan.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plan.plan?.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || plan.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    totalAssigned: assignedPlans.length,
    activeAssignments: assignedPlans.filter(p => p.status === 'active').length,
    completedAssignments: assignedPlans.filter(p => p.status === 'completed').length,
    uniqueMembers: new Set(assignedPlans.map(p => p.customerId)).size,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded" />
            ))}
          </div>
          <div className="h-[400px] bg-muted animate-pulse rounded" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-red-600">
            <p>Error: {error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => fetchAssignedPlans()}
            >
              Try Again
            </Button>
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
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-4 border-b">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Client Assignments
            </h1>
            <p className="text-muted-foreground text-lg">
              Monitor and manage workout plan assignments for your clients.
            </p>
          </div>
          <Button
            onClick={() => navigate('/dashboard/gym/workout-plans/assign')}
            size="lg"
            className="shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Assign New Plan
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Assignments</CardTitle>
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">{stats.totalAssigned}</div>
                <p className="text-xs text-muted-foreground">Active assignments</p>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Plans</CardTitle>
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <PlayCircle className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">{stats.activeAssignments}</div>
                <p className="text-xs text-muted-foreground">Currently in progress</p>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">{stats.completedAssignments}</div>
                <p className="text-xs text-muted-foreground">Successfully finished</p>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Clients</CardTitle>
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">{stats.uniqueMembers}</div>
                <p className="text-xs text-muted-foreground">With assigned plans</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by member name or plan name..."
              className="pl-10 h-11 shadow-sm border-muted-foreground/20 focus:ring-2 focus:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] h-11">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || filterStatus !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                }}
                className="h-11"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Assignments Table */}
        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Client Assignment Overview
              </CardTitle>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {filteredPlans.length} assignments
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredPlans.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Users className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Assignments Found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'Start by assigning workout plans to your clients.'}
                </p>
                {!searchQuery && filterStatus === 'all' && (
                  <Button onClick={() => navigate('/dashboard/gym/workout-plans/assign')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Assign First Plan
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-muted/50">
                      <TableHead className="font-semibold">Client Details</TableHead>
                      <TableHead className="font-semibold">Workout Plan</TableHead>
                      <TableHead className="font-semibold">Schedule</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Notes</TableHead>
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
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{plan.memberName}</div>
                              <div className="text-sm text-muted-foreground">
                                Assigned {new Date(plan.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {plan.plan ? (
                            <div className="space-y-1">
                              <Button
                                variant="link"
                                className="p-0 h-auto font-medium text-left"
                                onClick={() => handleViewPlan(plan)}
                              >
                                {plan.plan.name}
                              </Button>
                              <div className="flex items-center gap-2">
                                <Target className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{plan.plan.goal}</span>
                                {getLevelBadge(plan.plan.level)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Plan deleted</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{new Date(plan.startDate).toLocaleDateString()}</span>
                            </div>
                            {plan.plan && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{plan.plan.duration} weeks</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(plan.status)}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {plan.notes || (
                              <span className="text-muted-foreground italic">No notes</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleViewPlan(plan)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Plan Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDelete(plan._id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Unassign Plan
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

        {/* Enhanced View Plan Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="space-y-2">
                <DialogTitle className="text-2xl">
                  {selectedPlan?.plan?.name}
                </DialogTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{selectedPlan?.memberName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Started {selectedPlan && new Date(selectedPlan.startDate).toLocaleDateString()}</span>
                  </div>
                  {selectedPlan && getStatusBadge(selectedPlan.status)}
                </div>
              </div>
            </DialogHeader>
            {selectedPlan?.plan && (
              <div className="space-y-6">
                {/* Plan Overview */}
                <Card className="border-0 bg-muted/30">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Goal</p>
                          <p className="font-medium">{selectedPlan.plan.goal}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Level</p>
                          {getLevelBadge(selectedPlan.plan.level)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="font-medium">{selectedPlan.plan.duration} weeks</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Start Date</p>
                          <p className="font-medium">{new Date(selectedPlan.startDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Workout Schedule */}
                {selectedPlan.plan.weeks && selectedPlan.plan.weeks.length > 0 ? (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Workout Schedule</h3>
                    {selectedPlan.plan.weeks.map((week, weekIndex) => (
                      <Card key={weekIndex} className="border-0 shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Week {week.weekNumber}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {week.days.map((day, dayIndex) => (
                            <div key={dayIndex} className="border rounded-lg p-4">
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Day {day.dayNumber}
                                {day.muscleGroups && day.muscleGroups.trim() && (
                                  <span className="text-sm font-normal text-muted-foreground ml-2">
                                    - {day.muscleGroups}
                                  </span>
                                )}
                              </h4>
                              <div className="space-y-3">
                                {day.exercises.map((exercise, exerciseIndex) => (
                                  <div
                                    key={exerciseIndex}
                                    className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg"
                                  >
                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-1">Exercise</p>
                                      <p className="font-medium">{exercise.name}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-1">Sets</p>
                                      <Badge variant="outline">{exercise.sets}</Badge>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-1">Reps</p>
                                      <Badge variant="outline">{exercise.reps}</Badge>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-1">Rest</p>
                                      <Badge variant="outline">{exercise.restTime}s</Badge>
                                    </div>
                                    {exercise.notes && (
                                      <div className="md:col-span-4 mt-2 pt-2 border-t border-muted-foreground/20">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                                        <p className="text-sm">{exercise.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No workout schedule available for this plan.</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
};

export default AssignedWorkoutPlansPage;