import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Activity,
  Heart,
  Scale,
  Stethoscope
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();

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
        toast({
          title: "Error",
          description: "Failed to load members",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive",
      });
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
        toast({
          title: "Error",
          description: "Invalid data format received from server",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching health assessments:', error);
      toast({
        title: "Error",
        description: "Failed to load health assessments",
        variant: "destructive",
      });
      setAssessments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAssessment = async () => {
    try {
      // Validate required fields
      if (!formData.memberId || !formData.memberName) {
        toast({
          title: "Error",
          description: "Please select a member",
          variant: "destructive",
        });
        return;
      }

      if (!formData.age || !formData.gender || !formData.height || !formData.weight) {
        toast({
          title: "Error",
          description: "Please fill in all required basic information fields",
          variant: "destructive",
        });
        return;
      }

      if (!formData.activityLevel || !formData.smokingStatus || !formData.alcoholConsumption) {
        toast({
          title: "Error",
          description: "Please fill in all required lifestyle fields",
          variant: "destructive",
        });
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
        toast({
          title: "Success",
          description: "Health assessment created successfully",
        });
        setIsDialogOpen(false);
        resetForm();
        fetchAssessments();
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error creating health assessment:', error);
      toast({
        title: "Error",
        description: "Failed to create health assessment",
        variant: "destructive",
      });
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
        toast({
          title: "Success",
          description: "Health assessment updated successfully",
        });
        setIsDialogOpen(false);
        resetForm();
        fetchAssessments();
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error updating health assessment:', error);
      toast({
        title: "Error",
        description: "Failed to update health assessment",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;

    try {
      const response = await axiosInstance.delete(`/gym/health-assessments/${assessmentId}`);
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Health assessment deleted successfully",
        });
        fetchAssessments();
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error deleting health assessment:', error);
      toast({
        title: "Error",
        description: "Failed to delete health assessment",
        variant: "destructive",
      });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
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

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Health Assessments</h1>
            <p className="text-gray-600 mt-2">
              Manage member health assessments and track their progress
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                New Assessment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>
                  {editingAssessment ? 'Edit Health Assessment' : 'New Health Assessment'}
                </DialogTitle>
                <DialogDescription>
                  {editingAssessment 
                    ? 'Update the health assessment details below.'
                    : 'Fill in the health assessment details below.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Member</label>
                    <Select
                      value={formData.memberId}
                      onValueChange={handleMemberSelect}
                    >
                      <SelectTrigger>
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
                    <label className="text-sm font-medium">Age</label>
                    <Input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="Enter age"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Gender</label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Height (cm)</label>
                    <Input
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      placeholder="Enter height"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Weight (kg)</label>
                    <Input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="Enter weight"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Activity Level</label>
                    <Select
                      value={formData.activityLevel}
                      onValueChange={(value) => setFormData({ ...formData, activityLevel: value })}
                    >
                      <SelectTrigger>
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
                    <label className="text-sm font-medium">Smoking Status</label>
                    <Select
                      value={formData.smokingStatus}
                      onValueChange={(value) => setFormData({ ...formData, smokingStatus: value })}
                    >
                      <SelectTrigger>
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
                    <label className="text-sm font-medium">Alcohol Consumption</label>
                    <Select
                      value={formData.alcoholConsumption}
                      onValueChange={(value) => setFormData({ ...formData, alcoholConsumption: value })}
                    >
                      <SelectTrigger>
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
                  <div>
                    <label className="text-sm font-medium">Blood Pressure</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        value={formData.bloodPressure.systolic}
                        onChange={(e) => setFormData({
                          ...formData,
                          bloodPressure: { ...formData.bloodPressure, systolic: e.target.value }
                        })}
                        placeholder="Systolic"
                      />
                      <Input
                        type="number"
                        value={formData.bloodPressure.diastolic}
                        onChange={(e) => setFormData({
                          ...formData,
                          bloodPressure: { ...formData.bloodPressure, diastolic: e.target.value }
                        })}
                        placeholder="Diastolic"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Heart Rate (bpm)</label>
                    <Input
                      type="number"
                      value={formData.heartRate}
                      onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                      placeholder="Enter heart rate"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Assessment Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    placeholder="Select assessment date"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'pending' | 'completed' | 'reviewed') => 
                      setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
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
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={editingAssessment ? handleUpdateAssessment : handleCreateAssessment}>
                  {editingAssessment ? 'Update Assessment' : 'Create Assessment'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : assessments.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No assessments found</h3>
            <p className="mt-2 text-gray-500">
              Get started by creating a new health assessment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((assessment) => (
              <motion.div
                key={assessment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{assessment.memberName}</CardTitle>
                        <CardDescription>
                          {new Date(assessment.date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(assessment.status)}>
                        {assessment.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Age</p>
                          <p className="font-medium">{assessment.age} years</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Gender</p>
                          <p className="font-medium capitalize">{assessment.gender}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Height</p>
                          <p className="font-medium">{assessment.height} cm</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Weight</p>
                          <p className="font-medium">{assessment.weight} kg</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Smoking Status</p>
                          <p className="font-medium capitalize">{assessment.smokingStatus}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Alcohol Consumption</p>
                          <p className="font-medium capitalize">{assessment.alcoholConsumption}</p>
                        </div>
                      </div>
                      {assessment.bmi && (
                        <div>
                          <p className="text-sm text-gray-500">BMI</p>
                          <p className="font-medium">{assessment.bmi}</p>
                        </div>
                      )}
                      {assessment.bloodPressure && (
                        <div>
                          <p className="text-sm text-gray-500">Blood Pressure</p>
                          <p className="font-medium">
                            {assessment.bloodPressure.systolic}/{assessment.bloodPressure.diastolic} mmHg
                          </p>
                        </div>
                      )}
                      {assessment.heartRate && (
                        <div>
                          <p className="text-sm text-gray-500">Heart Rate</p>
                          <p className="font-medium">{assessment.heartRate} bpm</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500">Activity Level</p>
                        <p className="font-medium capitalize">
                          {assessment.activityLevel.replace('_', ' ')}
                        </p>
                      </div>
                      {assessment.goals.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-500">Goals</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {assessment.goals.map((goal, index) => (
                              <Badge key={index} variant="secondary">
                                {goal.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(assessment)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteAssessment(assessment._id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HealthAssessmentsPage; 