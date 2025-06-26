import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Download,
  MoreHorizontal,
  User,
  Activity,
  Heart,
  Scale,
  Stethoscope,
  Calendar as CalendarIcon,
  Eye,
  FileText,
  TrendingUp,
  Users,
  ClipboardList
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useIndustry } from '@/context/IndustryContext';
import axiosInstance from '@/lib/axios';

interface Member {
  _id: string;
  name: string;
  email: string;
  phone: string;
  membershipType: string;
  status: string;
  gymId: string;
  userId: string;
}

interface HealthAssessment {
  _id: string;
  memberId: string;
  memberName: string;
  date: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  heartRate?: number;
  bodyFatPercentage?: number;
  bmi?: number;
  medicalConditions: Array<{
    condition: string;
    diagnosed: boolean;
    medications: string[];
  }>;
  allergies: string[];
  activityLevel: string;
  smokingStatus: string;
  alcoholConsumption: string;
  goals: string[];
  flexibility?: string;
  strength?: string;
  endurance?: string;
  notes?: string;
  recommendations?: string[];
  status: 'pending' | 'completed' | 'reviewed';
}

const HealthAssessmentsPage: React.FC = () => {
  useRequireAuth();
  const { selectedIndustry, setSelectedIndustry } = useIndustry();
  
  // Set gym as the selected industry if not already set
  useEffect(() => {
    if (selectedIndustry !== 'gym') {
      setSelectedIndustry('gym');
    }
  }, [selectedIndustry, setSelectedIndustry]);

  const [assessments, setAssessments] = useState<HealthAssessment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<HealthAssessment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showFilters, setShowFilters] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    memberId: '',
    memberName: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    bloodPressure: {
      systolic: '',
      diastolic: ''
    },
    heartRate: '',
    bodyFatPercentage: '',
    activityLevel: '',
    smokingStatus: '',
    alcoholConsumption: '',
    goals: [] as string[],
    medicalConditions: [{
      condition: '',
      diagnosed: false,
      medications: ['']
    }],
    allergies: [''],
    flexibility: '',
    strength: '',
    endurance: '',
    notes: '',
    recommendations: [''],
    status: 'pending' as 'pending' | 'completed' | 'reviewed',
    date: ''
  });

  // Load health assessments and members
  useEffect(() => {
    fetchAssessments();
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await axiosInstance.get('/customers');
      if (response.data.success && Array.isArray(response.data.customers)) {
        setMembers(response.data.customers);
      } else {
        console.error('Unexpected API response format:', response.data);
        setMembers([]);
        toast.error('Failed to load members');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load members');
      setMembers([]);
    }
  };

  const fetchAssessments = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/gym/health-assessments');
      if (response.data.success && Array.isArray(response.data.data)) {
        setAssessments(response.data.data);
      } else {
        console.error('Unexpected API response format:', response.data);
        setAssessments([]);
        toast.error('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Error fetching health assessments:', error);
      toast.error('Failed to load health assessments');
      setAssessments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAssessment = async () => {
    try {
      // Validate required fields
      if (!formData.memberId || !formData.memberName) {
        toast.error('Please select a member');
        return;
      }

      if (!formData.age || !formData.gender || !formData.height || !formData.weight) {
        toast.error('Please fill in all required basic information fields');
        return;
      }

      if (!formData.activityLevel || !formData.smokingStatus || !formData.alcoholConsumption) {
        toast.error('Please fill in all required lifestyle fields');
        return;
      }

      // Create base assessment data with required fields
      const assessmentData: any = {
        memberId: formData.memberId,
        memberName: formData.memberName,
        age: parseInt(formData.age),
        gender: formData.gender,
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        activityLevel: formData.activityLevel,
        smokingStatus: formData.smokingStatus,
        alcoholConsumption: formData.alcoholConsumption,
        medicalConditions: formData.medicalConditions.filter(mc => mc.condition.trim() !== ''),
        allergies: formData.allergies.filter(a => a.trim() !== ''),
        recommendations: formData.recommendations.filter(r => r.trim() !== ''),
        status: formData.status,
        date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString()
      };

      // Add optional fields only if they have valid values
      if (formData.bloodPressure.systolic && formData.bloodPressure.diastolic) {
        assessmentData.bloodPressure = {
          systolic: parseInt(formData.bloodPressure.systolic),
          diastolic: parseInt(formData.bloodPressure.diastolic)
        };
      }

      if (formData.heartRate) {
        assessmentData.heartRate = parseInt(formData.heartRate);
      }

      if (formData.bodyFatPercentage) {
        assessmentData.bodyFatPercentage = parseFloat(formData.bodyFatPercentage);
      }

      if (formData.flexibility && ['poor', 'fair', 'good', 'excellent'].includes(formData.flexibility)) {
        assessmentData.flexibility = formData.flexibility;
      }

      if (formData.strength && ['poor', 'fair', 'good', 'excellent'].includes(formData.strength)) {
        assessmentData.strength = formData.strength;
      }

      if (formData.endurance && ['poor', 'fair', 'good', 'excellent'].includes(formData.endurance)) {
        assessmentData.endurance = formData.endurance;
      }

      if (formData.notes) {
        assessmentData.notes = formData.notes;
      }

      const response = await axiosInstance.post('/gym/health-assessments', assessmentData);
      
      if (response.data.success && response.data.data) {
        toast.success('Health assessment created successfully');
        setIsDialogOpen(false);
        resetForm();
        fetchAssessments();
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error creating health assessment:', error);
      toast.error('Failed to create health assessment');
    }
  };

  const handleUpdateAssessment = async () => {
    if (!editingAssessment) return;

    try {
      const assessmentData: any = {
        memberId: formData.memberId,
        memberName: formData.memberName,
        age: parseInt(formData.age),
        gender: formData.gender,
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        activityLevel: formData.activityLevel,
        smokingStatus: formData.smokingStatus,
        alcoholConsumption: formData.alcoholConsumption,
        medicalConditions: formData.medicalConditions.filter(mc => mc.condition.trim() !== ''),
        allergies: formData.allergies.filter(a => a.trim() !== ''),
        recommendations: formData.recommendations.filter(r => r.trim() !== ''),
        status: formData.status,
        date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString()
      };

      if (formData.bloodPressure.systolic && formData.bloodPressure.diastolic) {
        assessmentData.bloodPressure = {
          systolic: parseInt(formData.bloodPressure.systolic),
          diastolic: parseInt(formData.bloodPressure.diastolic)
        };
      }
      if (formData.heartRate) {
        assessmentData.heartRate = parseInt(formData.heartRate);
      }
      if (formData.bodyFatPercentage) {
        assessmentData.bodyFatPercentage = parseFloat(formData.bodyFatPercentage);
      }
      if (formData.flexibility && ['poor', 'fair', 'good', 'excellent'].includes(formData.flexibility)) {
        assessmentData.flexibility = formData.flexibility;
      }
      if (formData.strength && ['poor', 'fair', 'good', 'excellent'].includes(formData.strength)) {
        assessmentData.strength = formData.strength;
      }
      if (formData.endurance && ['poor', 'fair', 'good', 'excellent'].includes(formData.endurance)) {
        assessmentData.endurance = formData.endurance;
      }
      if (formData.notes) {
        assessmentData.notes = formData.notes;
      }

      const response = await axiosInstance.put(
        `/gym/health-assessments/${editingAssessment._id}`,
        assessmentData
      );
      
      if (response.data.success && response.data.data) {
        toast.success('Health assessment updated successfully');
        setIsDialogOpen(false);
        resetForm();
        fetchAssessments();
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error updating health assessment:', error);
      toast.error('Failed to update health assessment');
    }
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;

    try {
      const response = await axiosInstance.delete(`/gym/health-assessments/${assessmentId}`);
      
      if (response.data.success) {
        toast.success('Health assessment deleted successfully');
        fetchAssessments();
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error deleting health assessment:', error);
      toast.error('Failed to delete health assessment');
    }
  };

  const resetForm = () => {
    setFormData({
      memberId: '',
      memberName: '',
      age: '',
      gender: '',
      height: '',
      weight: '',
      bloodPressure: {
        systolic: '',
        diastolic: ''
      },
      heartRate: '',
      bodyFatPercentage: '',
      activityLevel: '',
      smokingStatus: '',
      alcoholConsumption: '',
      goals: [],
      medicalConditions: [{
        condition: '',
        diagnosed: false,
        medications: ['']
      }],
      allergies: [''],
      flexibility: '',
      strength: '',
      endurance: '',
      notes: '',
      recommendations: [''],
      status: 'pending',
      date: ''
    });
    setEditingAssessment(null);
  };

  const handleEdit = (assessment: HealthAssessment) => {
    setEditingAssessment(assessment);
    setFormData({
      memberId: assessment.memberId,
      memberName: assessment.memberName,
      age: assessment.age.toString(),
      gender: assessment.gender,
      height: assessment.height.toString(),
      weight: assessment.weight.toString(),
      bloodPressure: {
        systolic: assessment.bloodPressure?.systolic?.toString() || '',
        diastolic: assessment.bloodPressure?.diastolic?.toString() || ''
      },
      heartRate: assessment.heartRate?.toString() || '',
      bodyFatPercentage: assessment.bodyFatPercentage?.toString() || '',
      activityLevel: assessment.activityLevel,
      smokingStatus: assessment.smokingStatus,
      alcoholConsumption: assessment.alcoholConsumption,
      goals: assessment.goals,
      medicalConditions: assessment.medicalConditions.length > 0 ? assessment.medicalConditions : [{
        condition: '',
        diagnosed: false,
        medications: ['']
      }],
      allergies: assessment.allergies.length > 0 ? assessment.allergies : [''],
      flexibility: assessment.flexibility || '',
      strength: assessment.strength || '',
      endurance: assessment.endurance || '',
      notes: assessment.notes || '',
      recommendations: assessment.recommendations?.length ? assessment.recommendations : [''],
      status: assessment.status,
      date: assessment.date ? assessment.date.slice(0, 10) : ''
    });
    setIsDialogOpen(true);
  };

  const calculateBMI = (height: number, weight: number) => {
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'reviewed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <TrendingUp className="h-3 w-3" />;
      case 'reviewed':
        return <Eye className="h-3 w-3" />;
      default:
        return <ClipboardList className="h-3 w-3" />;
    }
  };

  const handleMemberSelect = (memberId: string) => {
    const selectedMember = members.find(member => member._id === memberId);
    if (selectedMember) {
      setFormData({
        ...formData,
        memberId: selectedMember._id,
        memberName: selectedMember.name
      });
    }
  };

  // Filter assessments
  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.memberName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || assessment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    if (!filteredAssessments || filteredAssessments.length === 0) {
      toast.info("No data to export.");
      return;
    }

    const dataToExport = filteredAssessments.map(assessment => ({
      "Member Name": assessment.memberName,
      "Date": new Date(assessment.date).toLocaleDateString(),
      "Age": assessment.age,
      "Gender": assessment.gender,
      "Height (cm)": assessment.height,
      "Weight (kg)": assessment.weight,
      "BMI": assessment.bmi || calculateBMI(assessment.height, assessment.weight),
      "Blood Pressure": assessment.bloodPressure ? `${assessment.bloodPressure.systolic}/${assessment.bloodPressure.diastolic}` : 'N/A',
      "Heart Rate": assessment.heartRate || 'N/A',
      "Activity Level": assessment.activityLevel,
      "Status": assessment.status,
    }));

    const csv = dataToExport.map(row => Object.values(row).join(',')).join('\n');
    const headers = Object.keys(dataToExport[0]).join(',');
    const csvContent = headers + '\n' + csv;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `health-assessments-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Data exported successfully!");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
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
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Health Assessments
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage comprehensive health assessments and track member wellness progress.
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
              size="lg" 
              className="shadow-sm"
            >
              {viewMode === 'cards' ? <FileText className="h-5 w-5 mr-2" /> : <Users className="h-5 w-5 mr-2" />}
              {viewMode === 'cards' ? 'Table View' : 'Card View'}
            </Button>
            <Button onClick={handleExport} variant="outline" size="lg" className="shadow-sm">
              <Download className="mr-2 h-5 w-5" /> Export Data
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  resetForm();
                  setIsDialogOpen(true);
                }} size="lg" className="shadow-lg">
                  <Plus className="w-5 h-5 mr-2" />
                  New Assessment
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by member name..."
              className="pl-10 h-11 shadow-sm border-muted-foreground/20 focus:ring-2 focus:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Toggle Button */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-11 shadow-sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                  !
                </Badge>
              )}
            </Button>
            
            {(searchQuery || statusFilter !== 'all') && (
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="h-11 text-muted-foreground hover:text-foreground"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Expandable Filter Controls */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Filter Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground">Filter by Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground">View Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant={viewMode === 'cards' ? 'default' : 'outline'}
                        onClick={() => setViewMode('cards')}
                        className="w-full"
                      >
                        Card View
                      </Button>
                      <Button
                        size="sm"
                        variant={viewMode === 'table' ? 'default' : 'outline'}
                        onClick={() => setViewMode('table')}
                        className="w-full"
                      >
                        Table View
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Content Area */}
        {filteredAssessments.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Stethoscope className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Health Assessments Found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first health assessment.'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Assessment
              </Button>
            )}
          </div>
        ) : viewMode === 'cards' ? (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssessments.map((assessment, index) => (
              <motion.div
                key={assessment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-semibold flex items-center">
                          <User className="h-5 w-5 mr-2 text-primary" />
                          {assessment.memberName}
                        </CardTitle>
                        <CardDescription className="flex items-center text-muted-foreground">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {new Date(assessment.date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge variant={getStatusBadgeVariant(assessment.status)} className="flex items-center gap-1">
                        {getStatusIcon(assessment.status)}
                        {assessment.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Age</p>
                          <p className="font-semibold">{assessment.age} years</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Height</p>
                          <p className="font-semibold">{assessment.height} cm</p>
                        </div>
                        {assessment.bloodPressure && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Blood Pressure</p>
                            <p className="font-semibold flex items-center">
                              <Heart className="h-4 w-4 mr-1 text-red-500" />
                              {assessment.bloodPressure.systolic}/{assessment.bloodPressure.diastolic}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Gender</p>
                          <p className="font-semibold capitalize">{assessment.gender}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Weight</p>
                          <p className="font-semibold flex items-center">
                            <Scale className="h-4 w-4 mr-1 text-blue-500" />
                            {assessment.weight} kg
                          </p>
                        </div>
                        {assessment.heartRate && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Heart Rate</p>
                            <p className="font-semibold flex items-center">
                              <Activity className="h-4 w-4 mr-1 text-green-500" />
                              {assessment.heartRate} bpm
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Activity Level</p>
                      <Badge variant="outline" className="text-xs">
                        {assessment.activityLevel.replace('_', ' ')}
                      </Badge>
                    </div>

                    {assessment.bmi && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">BMI</p>
                        <p className="font-bold text-lg">{assessment.bmi}</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-4 border-t">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted ml-auto">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleEdit(assessment)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Assessment
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDeleteAssessment(assessment._id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Assessment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Table View */
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold flex items-center">
                  <Stethoscope className="h-5 w-5 mr-2" />
                  Health Assessments Management
                </CardTitle>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {filteredAssessments.length} assessments
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-muted/50">
                      <TableHead className="font-semibold">Member</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Age/Gender</TableHead>
                      <TableHead className="font-semibold">Vitals</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssessments.map((assessment, index) => (
                      <motion.tr
                        key={assessment._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{assessment.memberName}</div>
                              <div className="text-sm text-muted-foreground">ID: {assessment.memberId.slice(-6)}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(assessment.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{assessment.age} years</div>
                            <div className="text-sm text-muted-foreground capitalize">{assessment.gender}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="font-medium">{assessment.height}cm</span> / 
                              <span className="font-medium">{assessment.weight}kg</span>
                            </div>
                            {assessment.bloodPressure && (
                              <div className="text-xs text-muted-foreground">
                                BP: {assessment.bloodPressure.systolic}/{assessment.bloodPressure.diastolic}
                              </div>
                            )}
                            {assessment.heartRate && (
                              <div className="text-xs text-muted-foreground">
                                HR: {assessment.heartRate} bpm
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(assessment.status)} className="flex items-center gap-1 w-fit">
                            {getStatusIcon(assessment.status)}
                            {assessment.status}
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
                              <DropdownMenuItem onClick={() => handleEdit(assessment)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Assessment
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDeleteAssessment(assessment._id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Assessment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog Content */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {editingAssessment ? 'Edit Health Assessment' : 'New Health Assessment'}
              </DialogTitle>
              <DialogDescription>
                {editingAssessment 
                  ? 'Update the health assessment details below.'
                  : 'Fill in the comprehensive health assessment details below.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information Section */}
              <Card className="border-0 bg-muted/30">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Member *</label>
                        <Select
                          value={formData.memberId}
                          onValueChange={handleMemberSelect}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select a member" />
                          </SelectTrigger>
                          <SelectContent>
                            {members.map((member) => (
                              <SelectItem key={member._id} value={member._id}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Age *</label>
                        <Input
                          type="number"
                          value={formData.age}
                          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                          placeholder="Enter age"
                          className="h-11"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Gender *</label>
                        <Select
                          value={formData.gender}
                          onValueChange={(value) => setFormData({ ...formData, gender: value })}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Height (cm) *</label>
                        <Input
                          type="number"
                          value={formData.height}
                          onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                          placeholder="Enter height"
                          className="h-11"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Weight (kg) *</label>
                        <Input
                          type="number"
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                          placeholder="Enter weight"
                          className="h-11"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Assessment Date</label>
                        <Input
                          type="date"
                          value={formData.date}
                          onChange={e => setFormData({ ...formData, date: e.target.value })}
                          className="h-11"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vital Signs Section */}
              <Card className="border-0 bg-muted/30">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center">
                    <Heart className="h-5 w-5 mr-2" />
                    Vital Signs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Blood Pressure</label>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            type="number"
                            value={formData.bloodPressure.systolic}
                            onChange={(e) => setFormData({
                              ...formData,
                              bloodPressure: { ...formData.bloodPressure, systolic: e.target.value }
                            })}
                            placeholder="Systolic"
                            className="h-11"
                          />
                          <Input
                            type="number"
                            value={formData.bloodPressure.diastolic}
                            onChange={(e) => setFormData({
                              ...formData,
                              bloodPressure: { ...formData.bloodPressure, diastolic: e.target.value }
                            })}
                            placeholder="Diastolic"
                            className="h-11"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Heart Rate (bpm)</label>
                        <Input
                          type="number"
                          value={formData.heartRate}
                          onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                          placeholder="Enter heart rate"
                          className="h-11"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Body Fat Percentage</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.bodyFatPercentage}
                          onChange={(e) => setFormData({ ...formData, bodyFatPercentage: e.target.value })}
                          placeholder="Enter body fat %"
                          className="h-11"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Status</label>
                        <Select
                          value={formData.status}
                          onValueChange={(value: 'pending' | 'completed' | 'reviewed') => 
                            setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="reviewed">Reviewed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lifestyle Factors Section */}
              <Card className="border-0 bg-muted/30">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Lifestyle Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Activity Level *</label>
                      <Select
                        value={formData.activityLevel}
                        onValueChange={(value) => setFormData({ ...formData, activityLevel: value })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select activity level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sedentary">Sedentary</SelectItem>
                          <SelectItem value="lightly_active">Lightly Active</SelectItem>
                          <SelectItem value="moderately_active">Moderately Active</SelectItem>
                          <SelectItem value="very_active">Very Active</SelectItem>
                          <SelectItem value="extremely_active">Extremely Active</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Smoking Status *</label>
                      <Select
                        value={formData.smokingStatus}
                        onValueChange={(value) => setFormData({ ...formData, smokingStatus: value })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select smoking status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="never">Never</SelectItem>
                          <SelectItem value="former">Former</SelectItem>
                          <SelectItem value="current">Current</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Alcohol Consumption *</label>
                      <Select
                        value={formData.alcoholConsumption}
                        onValueChange={(value) => setFormData({ ...formData, alcoholConsumption: value })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select alcohol consumption" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="occasional">Occasional</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="heavy">Heavy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes Section */}
              <Card className="border-0 bg-muted/30">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Additional Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Assessment Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Enter any additional notes or observations..."
                      className="w-full h-24 px-3 py-2 border border-muted-foreground/20 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="gap-3 pt-6">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} size="lg">
                Cancel
              </Button>
              <Button 
                onClick={editingAssessment ? handleUpdateAssessment : handleCreateAssessment}
                size="lg"
                className="min-w-[140px]"
              >
                {editingAssessment ? 'Update Assessment' : 'Create Assessment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
};

export default HealthAssessmentsPage;