import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import WorkoutPlanForm from '@/components/workout-plans/WorkoutPlanForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/config';
import { 
  ArrowLeft, 
  Dumbbell, 
  Plus,
  Users,
  BookOpen,
  Award,
  Zap,
  Target,
  Activity
} from 'lucide-react';

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

  const handleGoBack = () => {
    navigate('/dashboard/gym/workout-plans');
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-8"
      >
        {/* Professional Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Plan Library
              </Button>
              <Badge variant="secondary" className="text-xs">
                <Award className="h-3 w-3 mr-1" />
                Trainer Mode
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Create Professional Workout Plan
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Design evidence-based training programs with structured periodization and client-specific adaptations.
            </p>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm font-medium">Program Designer</span>
            </div>
          </div>
        </div>

        {/* Professional Guidelines */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 h-full">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">Assessment-Based</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Factor in movement screening, strength baseline, and injury history
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 h-full">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">Periodization</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Plan mesocycles with progressive overload and deload phases
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 h-full">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">Client-Specific</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Customize for individual goals, limitations, and preferences
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 h-full">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">Evidence-Based</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Apply scientific training principles and proven methodologies
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Program Configuration
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  Professional Template
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <WorkoutPlanForm onSubmit={handleSubmit} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Professional Training Guidelines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-0 bg-gradient-to-r from-muted/30 to-muted/10">
            <CardContent className="p-8">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Professional Training Standards
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-primary">Program Structure</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Apply FITT principles (Frequency, Intensity, Time, Type)</li>
                      <li>• Include warm-up, main sets, and cool-down phases</li>
                      <li>• Plan for 4-12 week mesocycles with progression</li>
                      <li>• Incorporate deload weeks every 3-4 weeks</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-primary">Safety Protocols</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Screen for contraindications and limitations</li>
                      <li>• Provide exercise modifications and regressions</li>
                      <li>• Include proper form cues and breathing patterns</li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-primary">Progress Tracking</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Set measurable performance indicators</li>
                      <li>• Plan regular fitness assessments</li>
                      <li>• Document training load and recovery metrics</li>
                      <li>• Adjust programming based on client response</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-primary">Client Communication</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Explain the rationale behind exercise selection</li>
                      <li>• Provide clear instructions and expectations</li>
                      <li>• Schedule regular progress reviews and adjustments</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default CreateWorkoutPlanPage;