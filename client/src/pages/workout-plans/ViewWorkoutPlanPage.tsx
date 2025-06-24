import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/config';
import { 
  Loader2, 
  ArrowLeft, 
  Edit3, 
  UserPlus, 
  Target, 
  Clock, 
  Activity, 
  Calendar,
  Dumbbell,
  Timer,
  Hash,
  RotateCcw,
  FileText,
  Award,
  TrendingUp,
  Users
} from 'lucide-react';
import AssignWorkoutPlanPage from './AssignWorkoutPlanPage';

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  restTime: number;
  notes?: string;
}

interface Day {
  dayNumber: number;
  exercises: Exercise[];
}

interface Week {
  weekNumber: number;
  days: Day[];
}

interface WorkoutPlan {
  _id: string;
  name: string;
  goal: string;
  duration: number;
  level: string;
  weeks: Week[];
}

const ViewWorkoutPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      // Only fetch if we have a valid ID and it's not 'assign'
      if (!id || id === 'assign') {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/workout-plans/${id}`, {
          withCredentials: true,
        });
        console.log('View Plan API Response:', response.data); // Debug log
        if (response.data.success && response.data.workoutPlan) {
          setPlan(response.data.workoutPlan);
        } else {
          console.error('Unexpected API response format:', response.data);
          toast.error('Invalid data format received from server');
          navigate('/dashboard/gym/workout-plans');
        }
      } catch (error) {
        console.error('Error fetching workout plan:', error);
        toast.error('Failed to load workout plan');
        navigate('/dashboard/gym/workout-plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [id, navigate]);

  // If we're on the assign page, render the AssignWorkoutPlanPage component
  if (id === 'assign') {
    return <AssignWorkoutPlanPage />;
  }

  const getLevelBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><Award className="h-3 w-3 mr-1" />Beginner</Badge>;
      case 'intermediate':
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><TrendingUp className="h-3 w-3 mr-1" />Intermediate</Badge>;
      case 'advanced':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><Activity className="h-3 w-3 mr-1" />Advanced</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
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

  // Calculate plan statistics
  const planStats = plan ? {
    totalExercises: plan.weeks.reduce((total, week) => 
      total + week.days.reduce((dayTotal, day) => dayTotal + day.exercises.length, 0), 0),
    totalWorkoutDays: plan.weeks.reduce((total, week) => total + week.days.length, 0),
    averageExercisesPerDay: plan.weeks.length > 0 ? 
      Math.round(plan.weeks.reduce((total, week) => 
        total + week.days.reduce((dayTotal, day) => dayTotal + day.exercises.length, 0), 0) / 
      plan.weeks.reduce((total, week) => total + week.days.length, 0)) : 0
  } : null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading workout plan...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!plan) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center space-y-4">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
              <FileText className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Workout Plan Not Found</h3>
            <p className="text-muted-foreground">The workout plan you're looking for doesn't exist or has been removed.</p>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/gym/workout-plans')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Plan Library
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
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b">
          <div className="space-y-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard/gym/workout-plans')}
              className="hover:bg-muted -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Plan Library
            </Button>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {plan.name}
              </h1>
              <div className="flex items-center gap-3">
                {getLevelBadge(plan.level)}
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1 text-muted-foreground">
                  {getGoalIcon(plan.goal)}
                  <span className="text-sm font-medium">{plan.goal}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(`/dashboard/gym/workout-plans/${plan._id}/edit`)}
              className="shadow-sm"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Plan
            </Button>
            <Button
              onClick={() => navigate('/dashboard/gym/workout-plans/assign')}
              className="shadow-lg"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign to Client
            </Button>
          </div>
        </div>

        {/* Plan Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Duration</p>
                    <p className="text-2xl font-bold">{plan.duration}</p>
                    <p className="text-xs text-muted-foreground">weeks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Dumbbell className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Exercises</p>
                    <p className="text-2xl font-bold">{planStats?.totalExercises}</p>
                    <p className="text-xs text-muted-foreground">exercises</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Workout Days</p>
                    <p className="text-2xl font-bold">{planStats?.totalWorkoutDays}</p>
                    <p className="text-xs text-muted-foreground">total days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Per Day</p>
                    <p className="text-2xl font-bold">{planStats?.averageExercisesPerDay}</p>
                    <p className="text-xs text-muted-foreground">exercises</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Workout Schedule */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">Workout Schedule</h2>
            <Badge variant="outline" className="text-sm">
              {plan.weeks.length} weeks
            </Badge>
          </div>

          {plan.weeks.map((week, weekIndex) => (
            <motion.div
              key={weekIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + weekIndex * 0.1 }}
            >
              <Card className="shadow-lg border-0">
                <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-muted/30">
                  <CardTitle className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{week.weekNumber}</span>
                    </div>
                    Week {week.weekNumber}
                    <Badge variant="secondary" className="ml-auto">
                      {week.days.length} days
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6">
                    {week.days.map((day, dayIndex) => (
                      <div key={dayIndex} className="space-y-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-muted">
                          <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">{day.dayNumber}</span>
                          </div>
                          <h3 className="font-semibold text-lg">Day {day.dayNumber}</h3>
                          <Badge variant="outline" className="ml-auto text-xs">
                            {day.exercises.length} exercises
                          </Badge>
                        </div>
                        <div className="grid gap-4">
                          {day.exercises.map((exercise, exerciseIndex) => (
                            <div
                              key={exerciseIndex}
                              className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-muted/30 rounded-lg border"
                            >
                              <div className="md:col-span-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                                  <p className="text-xs font-medium text-muted-foreground">Exercise</p>
                                </div>
                                <p className="font-semibold text-foreground">{exercise.name}</p>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Hash className="h-4 w-4 text-muted-foreground" />
                                  <p className="text-xs font-medium text-muted-foreground">Sets</p>
                                </div>
                                <Badge variant="outline" className="font-semibold">{exercise.sets}</Badge>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                                  <p className="text-xs font-medium text-muted-foreground">Reps</p>
                                </div>
                                <Badge variant="outline" className="font-semibold">{exercise.reps}</Badge>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Timer className="h-4 w-4 text-muted-foreground" />
                                  <p className="text-xs font-medium text-muted-foreground">Rest</p>
                                </div>
                                <Badge variant="outline" className="font-semibold">{exercise.restTime}s</Badge>
                              </div>
                              {exercise.notes && (
                                <div className="md:col-span-5 pt-3 border-t border-muted-foreground/20">
                                  <div className="flex items-center gap-2 mb-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-xs font-medium text-muted-foreground">Notes</p>
                                  </div>
                                  <p className="text-sm bg-background p-3 rounded border">{exercise.notes}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions Footer */}
        <Card className="border-0 bg-gradient-to-r from-muted/30 to-muted/10">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Ready to assign this plan?</p>
                  <p className="text-sm text-muted-foreground">Connect this workout program with your clients</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/dashboard/gym/workout-plans/${plan._id}/edit`)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Plan
                </Button>
                <Button
                  onClick={() => navigate('/dashboard/gym/workout-plans/assign')}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign to Client
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default ViewWorkoutPlanPage;