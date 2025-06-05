import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import WorkoutPlanForm from '@/components/workout-plans/WorkoutPlanForm';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/config';
import { Loader2 } from 'lucide-react';

const EditWorkoutPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const response = await axios.get(`${API_URL}/workout-plans/${id}`, {
          withCredentials: true,
        });
        setInitialData(response.data.plan);
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

  const handleSubmit = async (data: any) => {
    try {
      await axios.put(`${API_URL}/workout-plans/${id}`, data, {
        withCredentials: true,
      });
      toast.success('Workout plan updated successfully');
      navigate('/dashboard/gym/workout-plans');
    } catch (error) {
      console.error('Error updating workout plan:', error);
      toast.error('Failed to update workout plan');
      throw error;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Edit Workout Plan</h1>
        <WorkoutPlanForm onSubmit={handleSubmit} initialData={initialData} />
      </div>
    </DashboardLayout>
  );
};

export default EditWorkoutPlanPage; 