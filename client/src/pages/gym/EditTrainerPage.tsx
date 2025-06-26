import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/config';
import { 
  ArrowLeft, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Award, 
  Target,
  FileText,
  Save,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';

const trainerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  specialization: z.string().min(2, 'Specialization is required'),
  experience: z.string().transform((val) => parseInt(val, 10)),
  status: z.enum(['active', 'inactive']),
  bio: z.string().optional(),
});

type TrainerFormData = z.infer<typeof trainerSchema>;

const EditTrainerPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trainerName, setTrainerName] = useState('');
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<TrainerFormData>({
    resolver: zodResolver(trainerSchema),
  });

  const status = watch('status');
  const watchedName = watch('name');

  useEffect(() => {
    if (!user?.gymId) {
      toast.error('No gym associated with your account');
      navigate('/dashboard/gym/trainers');
      return;
    }
    fetchTrainer();
  }, [id, user?.gymId]);

  const fetchTrainer = async () => {
    try {
      const response = await axios.get(`${API_URL}/trainers/${id}`, {
        withCredentials: true,
      });
      
      // Verify that the trainer belongs to the current gym
      if (response.data.trainer.gymId !== user?.gymId) {
        toast.error('You do not have access to this trainer');
        navigate('/dashboard/gym/trainers');
        return;
      }
      
      const trainer = response.data.trainer;
      setTrainerName(trainer.name);
      
      // Set form values
      setValue('name', trainer.name);
      setValue('email', trainer.email);
      setValue('phone', trainer.phone);
      setValue('dateOfBirth', trainer.dateOfBirth ? new Date(trainer.dateOfBirth).toISOString().split('T')[0] : '');
      setValue('specialization', trainer.specialization);
      setValue('experience', trainer.experience.toString());
      setValue('status', trainer.status);
      setValue('bio', trainer.bio || '');
    } catch (error) {
      console.error('Error fetching trainer:', error);
      toast.error('Failed to load trainer details');
      navigate('/dashboard/gym/trainers');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: TrainerFormData) => {
    try {
      const response = await axios.put(`${API_URL}/trainers/${id}`, data, {
        withCredentials: true,
      });
      
      if (response.data.success) {
        toast.success('Trainer updated successfully');
        navigate('/dashboard/gym/trainers');
      } else {
        toast.error(response.data.message || 'Failed to update trainer');
      }
    } catch (error: any) {
      console.error('Error updating trainer:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to update trainer';
      toast.error(errorMessage);
    }
  };

  const getExperienceLevel = (years: number) => {
    if (years >= 10) return { label: 'Expert', color: 'bg-purple-100 text-purple-800' };
    if (years >= 5) return { label: 'Senior', color: 'bg-blue-100 text-blue-800' };
    if (years >= 2) return { label: 'Mid-level', color: 'bg-green-100 text-green-800' };
    return { label: 'Junior', color: 'bg-orange-100 text-orange-800' };
  };

  const currentExperience = watch('experience');
  const experienceLevel = currentExperience ? getExperienceLevel(parseInt(currentExperience.toString())) : null;

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
                Edit Trainer
              </h1>
              <p className="text-muted-foreground text-lg">
                Update {trainerName || 'trainer'}'s profile and information
              </p>
            </div>
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center gap-3">
            {isDirty && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-sm">
                <AlertCircle className="h-4 w-4" />
                Unsaved changes
              </div>
            )}
            {status && (
              <Badge variant={status === 'active' ? 'default' : 'secondary'} className="text-sm">
                {status === 'active' ? 'Active Trainer' : 'Inactive'}
              </Badge>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Personal Information Section */}
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-xl font-semibold flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Enter trainer's full name"
                    className="h-11"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date of Birth
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth')}
                    className="h-11"
                  />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.dateOfBirth.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information Section */}
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-xl font-semibold flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="trainer@example.com"
                    className="h-11"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="Enter phone number"
                    className="h-11"
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information Section */}
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-xl font-semibold flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="specialization" className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Specialization
                  </Label>
                  <Input
                    id="specialization"
                    {...register('specialization')}
                    placeholder="e.g., Weight Training, Yoga"
                    className="h-11"
                  />
                  {errors.specialization && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.specialization.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="experience" className="text-sm font-medium flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Experience (Years)
                  </Label>
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    max="50"
                    {...register('experience')}
                    placeholder="Years of experience"
                    className="h-11"
                  />
                  {experienceLevel && (
                    <Badge className={`text-xs ${experienceLevel.color}`}>
                      {experienceLevel.label} Level
                    </Badge>
                  )}
                  {errors.experience && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.experience.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="status" className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Employment Status
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(value) => setValue('status', value as 'active' | 'inactive')}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          Active
                        </div>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                          Inactive
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.status.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio Section */}
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-xl font-semibold flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Professional Bio
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Label htmlFor="bio" className="text-sm font-medium">
                  Tell us about the trainer's background, expertise, and achievements
                </Label>
                <Textarea
                  id="bio"
                  {...register('bio')}
                  placeholder="Enter a detailed bio highlighting the trainer's qualifications, experience, and specialties..."
                  rows={6}
                  className="resize-none"
                />
                {errors.bio && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.bio.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard/gym/trainers')}
              className="min-w-[120px]"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px] shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </DashboardLayout>
  );
};

export default EditTrainerPage;