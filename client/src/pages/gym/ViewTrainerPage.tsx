import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Loader2,
  Dumbbell,
  User,
  Calendar,
  Mail,
  Phone,
  Briefcase,
  Clock,
  Users
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface Trainer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  specialization: string;
  experience: number;
  status: 'active' | 'inactive';
  bio: string;
  clients: number;
  gymId: string;
  createdAt: string;
  updatedAt: string;
}

const ViewTrainerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id === 'new') {
      setTrainer(null);
      setLoading(false);
      return;
    }
    const fetchTrainer = async () => {
      try {
        const response = await axios.get(`${API_URL}/trainers/${id}`, { withCredentials: true });
        setTrainer(response.data.trainer);
      } catch (error) {
        console.error('Error fetching trainer:', error);
        toast.error('Failed to fetch trainer details');
      } finally {
        setLoading(false);
      }
    };

    fetchTrainer();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!trainer) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Trainer not found</h2>
          <Button onClick={() => navigate('/dashboard/gym/trainers')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Trainers
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-500/10 text-green-500'
      : 'bg-red-500/10 text-red-500';
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard/gym/trainers')}
              className="p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Trainer Details</h1>
          </div>
          <Button onClick={() => navigate(`/dashboard/gym/trainers/${id}/edit`)}>
            Edit Trainer
          </Button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{trainer.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{trainer.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Dumbbell className="h-4 w-4" />
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {trainer.specialization}
                </span>
                <Badge className={getStatusColor(trainer.status)}>
                  {trainer.status}
                </Badge>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trainer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="mt-1">{trainer.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="mt-1">{trainer.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                    <p className="mt-1">{new Date(trainer.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Specialization</p>
                    <p className="mt-1">{trainer.specialization}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Experience</p>
                    <p className="mt-1">{trainer.experience} years</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <div className="mt-1">
                      <Badge className={getStatusColor(trainer.status)}>
                        {trainer.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Number of Clients</p>
                    <p className="mt-1">{trainer.clients}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created At</p>
                    <p className="mt-1">{new Date(trainer.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Updated</p>
                    <p className="mt-1">{new Date(trainer.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {trainer.bio && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-500">Bio</p>
                  <p className="mt-1 whitespace-pre-wrap">{trainer.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default ViewTrainerPage; 