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
import { API_URL } from '@/lib/constants';
import { Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface Trainer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  experience: number;
  status: 'active' | 'inactive';
  bio?: string;
  clients?: number;
  gymId: string;
}

const TrainersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTrainers = async () => {
    if (!user?.gymId) {
      toast({
        title: 'Error',
        description: 'Gym ID not found. Please try logging in again.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/trainers`, {
        withCredentials: true,
      });
      
      if (response.data.success) {
        // Filter trainers to ensure they belong to the current gym
        const gymTrainers = response.data.data.filter(
          (trainer: Trainer) => trainer.gymId === user.gymId
        );
        setTrainers(gymTrainers);
      } else {
        toast({
          title: 'Error',
          description: response.data.message || 'Failed to fetch trainers',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching trainers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch trainers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.gymId) {
      toast({
        title: 'Error',
        description: 'No gym associated with your account',
        variant: 'destructive',
      });
      navigate('/dashboard');
      return;
    }
    fetchTrainers();
  }, [user?.gymId]);

  const handleDelete = async (trainerId: string) => {
    if (!confirm('Are you sure you want to delete this trainer?')) return;

    try {
      const response = await axios.delete(`${API_URL}/trainers/${trainerId}`, {
        withCredentials: true,
      });

      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Trainer deleted successfully',
        });
        fetchTrainers(); // Refresh the list
      } else {
        toast({
          title: 'Error',
          description: response.data.message || 'Failed to delete trainer',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting trainer:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete trainer',
        variant: 'destructive',
      });
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Personal Trainers</h1>
          <Button
            onClick={() => navigate('/dashboard/gym/trainers/new')}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Trainer
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Trainers</CardTitle>
          </CardHeader>
          <CardContent>
            {trainers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No trainers found. Add your first trainer to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Experience (years)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainers.map((trainer) => (
                    <TableRow key={trainer._id}>
                      <TableCell>{trainer.name}</TableCell>
                      <TableCell>{trainer.email}</TableCell>
                      <TableCell>{trainer.phone}</TableCell>
                      <TableCell>{trainer.specialization}</TableCell>
                      <TableCell>{trainer.experience}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            trainer.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {trainer.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/dashboard/gym/trainers/${trainer._id}`)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/dashboard/gym/trainers/${trainer._id}/edit`)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(trainer._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TrainersPage; 