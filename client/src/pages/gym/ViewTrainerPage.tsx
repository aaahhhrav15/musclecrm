import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/config';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface Trainer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  experience: number;
  status: 'active' | 'inactive';
  bio?: string;
}

const ViewTrainerPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainer();
  }, [id]);

  const fetchTrainer = async () => {
    try {
      const response = await axios.get(`${API_URL}/trainers/${id}`, {
        withCredentials: true,
      });
      setTrainer(response.data.trainer);
    } catch (error) {
      console.error('Error fetching trainer:', error);
      toast.error('Failed to load trainer details');
      navigate('/dashboard/gym/trainers');
    } finally {
      setLoading(false);
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

  if (!trainer) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <p className="text-red-600">Trainer not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/dashboard/gym/trainers')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Trainers
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
              onClick={() => navigate('/dashboard/gym/trainers')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Trainers
            </Button>
            <h1 className="text-2xl font-bold">{trainer.name}</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/gym/trainers/${trainer._id}/edit`)}
          >
            Edit Trainer
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Trainer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="mt-1">{trainer.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="mt-1">{trainer.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Specialization</p>
                <p className="mt-1">{trainer.specialization}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Experience</p>
                <p className="mt-1">{trainer.experience} years</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      trainer.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {trainer.status}
                  </span>
                </p>
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
    </DashboardLayout>
  );
};

export default ViewTrainerPage; 