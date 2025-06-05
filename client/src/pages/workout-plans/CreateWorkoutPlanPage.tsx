import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import WorkoutPlanForm from '@/components/workout-plans/WorkoutPlanForm';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/config';

const CreateWorkoutPlanPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
    try {
      await axios.post(`${API_URL}/workout-plans`, data, {
        withCredentials: true,
      });
      toast.success('Workout plan created successfully');
      navigate('/dashboard/gym/workout-plans');
    } catch (error) {
      console.error('Error creating workout plan:', error);
      toast.error('Failed to create workout plan');
      throw error;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Create New Workout Plan</h1>
        <WorkoutPlanForm onSubmit={handleSubmit} />
      </div>
    </DashboardLayout>
  );
};

export default CreateWorkoutPlanPage; 