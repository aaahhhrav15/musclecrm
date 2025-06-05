import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { toast } from 'sonner';
import { Trash2, Plus } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/config';

interface AssignedPlan {
  _id: string;
  memberId: string;
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
  } | null;
  createdAt: string;
  updatedAt: string;
}

const AssignedWorkoutPlansPage: React.FC = () => {
  const [assignedPlans, setAssignedPlans] = useState<AssignedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    fetchAssignedPlans();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assigned plan?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/workout-plans/assigned/${id}`, {
        withCredentials: true
      });

      toast.success('Assigned plan deleted successfully');
      fetchAssignedPlans(); // Refresh the list
    } catch (err) {
      console.error('Error deleting assigned plan:', err);
      toast.error('Failed to delete assigned plan');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-600';
      case 'completed':
        return 'text-blue-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2">Loading assigned workout plans...</p>
          </div>
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
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Assigned Workout Plans</h1>
          <Button
            onClick={() => navigate('/dashboard/gym/workout-plans/assign')}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Assign Plan
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Assigned On</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedPlans.map((plan) => (
                  <TableRow key={plan._id}>
                    <TableCell>{plan.memberName}</TableCell>
                    <TableCell>
                      {plan.plan ? (
                        <Button
                          variant="link"
                          onClick={() => navigate(`/dashboard/gym/workout-plans/${plan.plan._id}`)}
                        >
                          {plan.plan.name}
                        </Button>
                      ) : (
                        <span className="text-gray-500 italic">Plan deleted</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(plan.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={`font-medium ${getStatusColor(plan.status)}`}>
                        {plan.status}
                      </span>
                    </TableCell>
                    <TableCell>{plan.notes || '-'}</TableCell>
                    <TableCell>{new Date(plan.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(plan._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

export default AssignedWorkoutPlansPage; 