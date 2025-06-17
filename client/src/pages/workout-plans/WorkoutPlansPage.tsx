import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/config';
import { Plus, ListChecks } from 'lucide-react';

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

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_URL}/workout-plans`, {
        withCredentials: true,
      });
      console.log('API Response:', response.data);
      
      if (response.data.success && Array.isArray(response.data.workoutPlans)) {
        setPlans(response.data.workoutPlans);
      } else {
        console.error('Unexpected API response format:', response.data);
        setPlans([]); // Set empty array as fallback
        toast.error('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Error fetching workout plans:', error);
      toast.error('Failed to fetch workout plans');
      setPlans([]); // Set empty array on error
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

  if (loading) {
    return (
      <DashboardLayout>
        <div>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Workout Plans</h1>
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/gym/workout-plans/assigned')}
            >
              <ListChecks className="h-4 w-4 mr-2" />
              View Assigned Plans
            </Button>
            <Button
              onClick={() => navigate('/dashboard/gym/workout-plans/create')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Create Workout Plan
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Workout Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead>Duration (weeks)</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan._id}>
                    <TableCell>{plan.name}</TableCell>
                    <TableCell>{plan.goal}</TableCell>
                    <TableCell>{plan.duration}</TableCell>
                    <TableCell>
                      {plan.level.charAt(0).toUpperCase() + plan.level.slice(1)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/dashboard/gym/workout-plans/${plan._id}`)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/dashboard/gym/workout-plans/${plan._id}/edit`)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(plan._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default WorkoutPlansPage; 