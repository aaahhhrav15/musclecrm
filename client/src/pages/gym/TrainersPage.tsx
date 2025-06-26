import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/lib/constants';
import { 
  Plus, 
  Loader2, 
  Search,
  Users,
  Award,
  Activity,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Phone,
  Mail,
  Star,
  Calendar
} from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specializationFilter, setSpecializationFilter] = useState('all');
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
      // Only show error toast if not already on the trainers page
      if (window.location.pathname !== '/dashboard/gym/trainers') {
        toast({
          title: 'Error',
          description: 'No gym associated with your account',
          variant: 'destructive',
        });
        navigate('/dashboard');
      }
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

  // Filter trainers
  const filteredTrainers = trainers.filter(trainer => {
    const matchesSearch = trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trainer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trainer.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trainer.status === statusFilter;
    const matchesSpecialization = specializationFilter === 'all' || 
                                  trainer.specialization.toLowerCase().includes(specializationFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesSpecialization;
  });

  // Calculate metrics
  const metrics = {
    totalTrainers: trainers.length,
    activeTrainers: trainers.filter(t => t.status === 'active').length,
    averageExperience: trainers.length > 0 ? 
      Math.round(trainers.reduce((sum, t) => sum + t.experience, 0) / trainers.length) : 0,
    totalClients: trainers.reduce((sum, t) => sum + (t.clients || 0), 0)
  };

  // Get unique specializations
  const specializations = [...new Set(trainers.map(t => t.specialization))];

  const getStatusBadgeVariant = (status: string) => {
    return status === 'active' ? 'default' : 'secondary';
  };

  const getExperienceLevel = (years: number) => {
    if (years >= 10) return { label: 'Expert', color: 'text-purple-600' };
    if (years >= 5) return { label: 'Senior', color: 'text-blue-600' };
    if (years >= 2) return { label: 'Mid-level', color: 'text-green-600' };
    return { label: 'Junior', color: 'text-orange-600' };
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-[500px] w-full" />
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
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Personal Trainers
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your gym's professional training staff and their specializations.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/dashboard/gym/trainers/new')}
              size="lg"
              className="shadow-lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add New Trainer
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Trainers</CardTitle>
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">{metrics.totalTrainers}</div>
                <p className="text-xs text-muted-foreground">Training professionals</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Trainers</CardTitle>
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">{metrics.activeTrainers}</div>
                <p className="text-xs text-muted-foreground">Currently available</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Experience</CardTitle>
                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Award className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">{metrics.averageExperience}</div>
                <p className="text-xs text-muted-foreground">Years of experience</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">{metrics.totalClients}</div>
                <p className="text-xs text-muted-foreground">Being trained</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trainers by name, email, or specialization..."
              className="pl-10 h-11 shadow-sm border-muted-foreground/20 focus:ring-2 focus:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-11">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
              <SelectTrigger className="w-[160px] h-11">
                <SelectValue placeholder="All Specializations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specializations</SelectItem>
                {specializations.map(spec => (
                  <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchQuery || statusFilter !== 'all' || specializationFilter !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setSpecializationFilter('all');
                }}
                className="h-11"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Trainers Table */}
        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Trainers Management
              </CardTitle>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {filteredTrainers.length} trainers
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredTrainers.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Users className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Trainers Found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || statusFilter !== 'all' || specializationFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'Get started by adding your first personal trainer.'}
                </p>
                {!searchQuery && statusFilter === 'all' && specializationFilter === 'all' && (
                  <Button onClick={() => navigate('/dashboard/gym/trainers/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Trainer
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-muted/50">
                      <TableHead className="font-semibold">Trainer Details</TableHead>
                      <TableHead className="font-semibold">Contact Info</TableHead>
                      <TableHead className="font-semibold">Specialization</TableHead>
                      <TableHead className="font-semibold">Experience</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrainers.map((trainer, index) => {
                      const experienceLevel = getExperienceLevel(trainer.experience);
                      
                      return (
                        <motion.tr
                          key={trainer._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-semibold">
                                  {trainer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-foreground">{trainer.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {trainer.clients ? `${trainer.clients} clients` : 'No clients yet'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span>{trainer.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{trainer.phone}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-amber-500" />
                              <span className="font-medium">{trainer.specialization}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{trainer.experience} years</div>
                              <div className={`text-xs font-medium ${experienceLevel.color}`}>
                                {experienceLevel.label}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(trainer.status)}>
                              {trainer.status.charAt(0).toUpperCase() + trainer.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => navigate(`/dashboard/gym/trainers/${trainer._id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/dashboard/gym/trainers/${trainer._id}/edit`)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Trainer
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => handleDelete(trainer._id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Trainer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default TrainersPage;