import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/config';
import { Loader2, ArrowLeft } from 'lucide-react';
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!plan) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <p className="text-red-600">Workout plan not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/dashboard/gym/workout-plans')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Plans
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/gym/workout-plans')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Plans
            </Button>
            <h1 className="text-2xl font-bold">{plan.name}</h1>
          </div>
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate(`/dashboard/gym/workout-plans/${plan._id}/edit`)}
            >
              Edit Plan
            </Button>
            <Button
              onClick={() => navigate('/dashboard/gym/workout-plans/assign')}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Assign Plan
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Plan Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Goal</p>
                <p className="mt-1">{plan.goal}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Level</p>
                <p className="mt-1 capitalize">{plan.level}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Duration</p>
                <p className="mt-1">{plan.duration} weeks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {plan.weeks.map((week, weekIndex) => (
          <Card key={weekIndex} className="mb-6">
            <CardHeader>
              <CardTitle>Week {week.weekNumber}</CardTitle>
            </CardHeader>
            <CardContent>
              {week.days.map((day, dayIndex) => (
                <div key={dayIndex} className="mb-6 last:mb-0">
                  <h3 className="text-lg font-semibold mb-4">Day {day.dayNumber}</h3>
                  <div className="space-y-4">
                    {day.exercises.map((exercise, exerciseIndex) => (
                      <div
                        key={exerciseIndex}
                        className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-500">Exercise</p>
                          <p className="mt-1">{exercise.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Sets</p>
                          <p className="mt-1">{exercise.sets}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Reps</p>
                          <p className="mt-1">{exercise.reps}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Rest Time</p>
                          <p className="mt-1">{exercise.restTime} seconds</p>
                        </div>
                        {exercise.notes && (
                          <div className="col-span-4 mt-2">
                            <p className="text-sm font-medium text-gray-500">Notes</p>
                            <p className="mt-1">{exercise.notes}</p>
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
    </DashboardLayout>
  );
};

export default ViewWorkoutPlanPage; 