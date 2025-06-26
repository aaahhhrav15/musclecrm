import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Loader2,
  User,
  Calendar,
  Mail,
  Phone,
  Award,
  Clock,
  Users,
  Edit,
  Star,
  MapPin,
  Target,
  TrendingUp,
  CheckCircle,
  Activity
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/lib/constants';

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

  const getExperienceLevel = (years: number) => {
    if (years >= 10) return { label: 'Expert', color: 'bg-purple-100 text-purple-800', icon: '🏆' };
    if (years >= 5) return { label: 'Senior', color: 'bg-blue-100 text-blue-800', icon: '🥇' };
    if (years >= 2) return { label: 'Mid-level', color: 'bg-green-100 text-green-800', icon: '🥈' };
    return { label: 'Junior', color: 'bg-orange-100 text-orange-800', icon: '🥉' };
  };

  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading trainer details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!trainer) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <User className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Trainer Not Found</h2>
          <p className="text-muted-foreground mb-6">The trainer you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/dashboard/gym/trainers')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Trainers
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const experienceLevel = getExperienceLevel(trainer.experience);
  const age = getAge(trainer.dateOfBirth);

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
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/gym/trainers')}
              className="shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Trainers
            </Button>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Trainer Profile
              </h1>
              <p className="text-muted-foreground text-lg">
                Detailed information about {trainer.name}
              </p>
            </div>
          </div>
          
          <Button onClick={() => navigate(`/dashboard/gym/trainers/${id}/edit`)} size="lg" className="shadow-lg">
            <Edit className="mr-2 h-5 w-5" />
            Edit Trainer
          </Button>
        </div>

        {/* Profile Overview Card */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <div className={`h-32 bg-gradient-to-r ${
            trainer.status === 'active' 
              ? 'from-blue-500 to-purple-600' 
              : 'from-gray-400 to-gray-600'
          }`} />
          <CardContent className="p-0">
            <div className="px-6 pb-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16">
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg bg-white">
                  <AvatarFallback className="text-3xl font-bold text-primary bg-primary/10">
                    {trainer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-4 mt-4 md:mt-0">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">{trainer.name}</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <Badge className={`${experienceLevel.color} text-sm`}>
                        {experienceLevel.icon} {experienceLevel.label} Level
                      </Badge>
                      <Badge variant={trainer.status === 'active' ? 'default' : 'secondary'} className="text-sm">
                        {trainer.status === 'active' ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Specialization</p>
                        <p className="font-semibold">{trainer.specialization}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Award className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Experience</p>
                        <p className="font-semibold">{trainer.experience} years</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Clients</p>
                        <p className="font-semibold">{trainer.clients || 0} active</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{trainer.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{trainer.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">{age} years old</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Stats */}
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-lg font-semibold flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Professional Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Experience Level</span>
                  <Badge className={experienceLevel.color}>
                    {experienceLevel.label}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Years Active</span>
                  <span className="font-semibold">{trainer.experience} years</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Current Clients</span>
                  <span className="font-semibold">{trainer.clients || 0}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Employment Status</span>
                  <Badge variant={trainer.status === 'active' ? 'default' : 'secondary'}>
                    {trainer.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Joined Gym</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(trainer.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(trainer.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Date of Birth</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(trainer.dateOfBirth).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bio Section */}
        {trainer.bio && (
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-lg font-semibold flex items-center">
                <User className="h-5 w-5 mr-2" />
                Professional Bio
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {trainer.bio}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default ViewTrainerPage;