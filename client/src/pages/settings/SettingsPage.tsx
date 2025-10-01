import * as React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  User, 
  Building, 
  CreditCard, 
  Shield, 
  Bell, 
  Edit2, 
  Download, 
  Eye, 
  Upload, 
  X,
  Camera,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Settings,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ImageIcon,
  QrCode
} from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import axiosInstance from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AxiosError } from 'axios';
import { Skeleton } from '@/components/ui/skeleton';

interface GymInfo {
  _id: string;
  name: string;
  gymCode: string;
  logo: string | null;
  banner?: string | null;
  contactInfo: {
    email: string;
    phone: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  subscriptionDuration?: string;
  freeTrialCounter?: number; // Added for free trial status
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
}

interface GymFormData {
  name: string;
  contactInfo: {
    email: string;
    phone: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  logo?: File | null;
  banner?: File | null;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
}

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [gymInfo, setGymInfo] = useState<GymInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [bannerRemoved, setBannerRemoved] = useState(false);
  const [showFreeTrialDialog, setShowFreeTrialDialog] = useState(false); // Added for free trial dialog
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const personalForm = useForm<GymFormData>({
    defaultValues: {
      name: '',
      contactInfo: {
        email: '',
        phone: ''
      },
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      logo: null,
      razorpayKeyId: '',
      razorpayKeySecret: ''
    }
  });

  // Test function to verify JavaScript is working
  const testAlert = () => {
    alert('JavaScript is working! Button clicked successfully.');
    console.log('Test button clicked - JavaScript is working');
  };

  // Test backend connection
  const testBackendConnection = async () => {
    try {
      console.log('Testing backend connection...');
      const response = await axiosInstance.get('/gym/info');
      console.log('Backend response:', response.data);
      alert('Backend connection successful!');
    } catch (error) {
      console.error('Backend connection failed:', error);
      alert('Backend connection failed! Check console for details.');
    }
  };

  const fetchGymInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching gym info...');
      const response = await axiosInstance.get('/gym/info');
      console.log('Gym info response:', response.data);
      
      if (response.data.success) {
        const gymData = response.data.gym;
        setGymInfo(gymData);
        setLogoPreview(gymData.logo);
        setBannerPreview(gymData.banner || null);
        
        personalForm.reset({
          name: gymData.name || '',
          contactInfo: {
            email: gymData.contactInfo?.email || '',
            phone: gymData.contactInfo?.phone || ''
          },
          address: gymData.address || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
          },
          banner: null,
          razorpayKeyId: gymData.razorpayKeyId || '',
          razorpayKeySecret: gymData.razorpayKeySecret || ''
        });
      }
    } catch (error) {
      console.error('Error fetching gym info:', error);
      toast({
        title: "Error",
        description: "Failed to load gym information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [personalForm, toast]);

  const handleBannerChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a JPEG, PNG, GIF, or WebP image.',
        variant: 'destructive',
      });
      return;
    }

    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: 'File Too Large', description: 'Image size should be less than 8MB.', variant: 'destructive' });
      return;
    }

    // Approximate 3:1 check for UX. Server enforces true crop.
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      if (ratio < 2.7 || ratio > 3.3) {
        toast({ title: 'Aspect Ratio', description: 'Use a wide image (~3:1). We crop on upload.' });
      }
      personalForm.setValue('banner', file);
      personalForm.trigger('banner');
      const reader = new FileReader();
      reader.onloadend = () => setBannerPreview(reader.result as string);
      reader.readAsDataURL(file);
      URL.revokeObjectURL(url);
    };
    img.src = url;

    if (bannerInputRef.current) bannerInputRef.current.value = '';
  }, [personalForm, toast]);

  useEffect(() => {
    fetchGymInfo();
  }, [fetchGymInfo]);

  const handleLogoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Logo change handler called');
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.size, file.type);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, GIF, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Image size should be less than 50MB.",
        variant: "destructive",
      });
      return;
    }

    // Set the logo in the form and show preview
    personalForm.setValue('logo', file);
    setLogoRemoved(false);
    
    // Manually trigger form dirty state since setValue doesn't always trigger it
    personalForm.trigger('logo');
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      console.log('FileReader result length:', result.length);
      console.log('FileReader result preview:', result.substring(0, 100) + '...');
      setLogoPreview(result);
    };
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
    };
    reader.readAsDataURL(file);

    toast({
      title: "Logo Selected",
      description: "Logo will be saved when you click 'Save Changes'",
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [personalForm, toast]);

  const handleRemoveLogo = useCallback(async () => {
    // Clear the logo from the form
    personalForm.setValue('logo', null);
    setLogoPreview(null);
    setLogoRemoved(true);
    
    // Manually trigger form dirty state since setValue doesn't always trigger it
    personalForm.trigger('logo');
    
    toast({
      title: "Logo Removed",
      description: "Logo will be removed when you click 'Save Changes'",
    });
    
    setShowDeleteDialog(false);
  }, [personalForm, toast]);

  const handleRemoveBanner = useCallback(() => {
    personalForm.setValue('banner', null);
    setBannerPreview(null);
    setBannerRemoved(true);
    personalForm.trigger('banner');
    toast({ title: 'Banner Removed', description: "Banner will be removed when you click 'Save Changes'" });
  }, [personalForm, toast]);

  const generatePDF = useCallback(async (preview: boolean = false) => {
    try {
      console.log('Generating PDF, preview:', preview);
      setIsGeneratingPDF(true);
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your PDF...",
      });

      const response = await axiosInstance.get(`/gym/generate-pdf?t=${Date.now()}`, {
        responseType: 'blob'
      });

      console.log('PDF generated successfully');
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      if (preview) {
        const newWindow = window.open(url, '_blank');
        if (!newWindow) {
          toast({
            title: "Popup Blocked",
            description: "Please allow popups for this site to preview the PDF",
            variant: "destructive",
          });
          const link = document.createElement('a');
          link.href = url;
          link.download = `${gymInfo?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'gym'}_qr_code.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = `${gymInfo?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'gym'}_qr_code.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

      toast({
        title: "Success",
        description: preview ? "PDF preview opened in new window" : "PDF downloaded successfully",
      });
    } catch (error: unknown) {
      const err = error as AxiosError;
      console.error('Error generating PDF:', err);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [gymInfo?.name, toast]);

  const handleSaveGymInfo = useCallback(async (data: GymFormData) => {
    try {
      setIsSaving(true);
      console.log('Saving gym info:', data);
      
      // Prepare the request data
      const requestData: {
        name: string;
        contactInfo: { email: string; phone: string };
        address: { street: string; city: string; state: string; zipCode: string; country: string };
        logo?: string;
        removeLogo?: boolean;
        razorpayKeyId?: string;
        razorpayKeySecret?: string;
      } = {
        name: data.name.trim(),
        contactInfo: {
          email: data.contactInfo.email.trim(),
          phone: data.contactInfo.phone.trim()
        },
        address: {
          street: data.address.street.trim(),
          city: data.address.city.trim(),
          state: data.address.state.trim(),
          zipCode: data.address.zipCode.trim(),
          country: data.address.country.trim()
        },
        razorpayKeyId: (data.razorpayKeyId || '').trim(),
        razorpayKeySecret: (data.razorpayKeySecret || '').trim()
      };
      
      // Handle logo/banner upload using FormData
      let response;
      if (data.logo || data.banner) {
        const formData = new FormData();
        formData.append('name', requestData.name);
        formData.append('contactInfo', JSON.stringify(requestData.contactInfo));
        formData.append('address', JSON.stringify(requestData.address));
        if (data.logo) formData.append('logo', data.logo);
        if (data.banner) formData.append('banner', data.banner);
        formData.append('razorpayKeyId', requestData.razorpayKeyId || '');
        formData.append('razorpayKeySecret', requestData.razorpayKeySecret || '');
        
        if (data.logo) console.log('Uploading logo as FormData, file size:', data.logo.size);
        if (data.banner) console.log('Uploading banner as FormData, file size:', data.banner.size);
        
        response = await axiosInstance.put('/gym/info', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else if (logoRemoved || bannerRemoved) {
        // This means user explicitly removed the logo
        if (logoRemoved) requestData.removeLogo = true;
        if (bannerRemoved) (requestData as any).removeBanner = true;
        
        response = await axiosInstance.put('/gym/info', requestData, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else {
        // No logo changes
        response = await axiosInstance.put('/gym/info', requestData, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      console.log('Save response:', response.data);

      if (response.data.success) {
        setGymInfo(response.data.gym);
        setIsEditing(false);
        
        // Clear the logo/banner from form after successful save
        personalForm.setValue('logo', null);
        personalForm.setValue('banner', null);
        setBannerRemoved(false);
        
        // Clear gym cache to ensure fresh data for QR generation
        try {
          await axiosInstance.delete('/gym/cache');
          console.log('Gym cache cleared successfully');
        } catch (cacheError) {
          console.warn('Failed to clear gym cache:', cacheError);
        }
        
        toast({
          title: "Success",
          description: "Gym information updated successfully",
        });
        setLogoPreview(response.data.gym.logo || null);
        setBannerPreview(response.data.gym.banner || null);
      }
    } catch (error: unknown) {
      const err = error as AxiosError;
      console.error('Error updating gym info:', err);
      toast({
        title: "Error",
        description: "Failed to update gym information",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [personalForm, toast, logoRemoved, bannerRemoved]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setLogoRemoved(false);
    setBannerRemoved(false);
    if (gymInfo) {
      personalForm.reset({
        name: gymInfo.name || '',
        contactInfo: {
          email: gymInfo.contactInfo?.email || '',
          phone: gymInfo.contactInfo?.phone || ''
        },
        address: gymInfo.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        logo: null,
        banner: null
      });
      // Reset logo preview to original
      setLogoPreview(gymInfo.logo);
      setBannerPreview(gymInfo.banner || null);
    }
  }, [gymInfo, personalForm]);

  const formattedDates = useMemo(() => {
    if (!gymInfo) return { created: '', updated: '' };
    return {
      created: new Date(gymInfo.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      updated: new Date(gymInfo.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  }, [gymInfo]);

  const formIsDirty = personalForm.formState.isDirty;
  const currentLogo = personalForm.watch('logo');
  const currentBanner = personalForm.watch('banner');
  
  const hasUnsavedChanges = useMemo(() => {
    if (!gymInfo || !isEditing) return false;
    
    // Check if logo has been changed (either uploaded or removed)
    const logoChanged = currentLogo !== null || logoRemoved;
    const bannerChanged = currentBanner !== null || bannerRemoved;
    
    return formIsDirty || logoChanged || bannerChanged;
  }, [gymInfo, isEditing, formIsDirty, currentLogo, currentBanner, logoRemoved, bannerRemoved]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
            <Skeleton className="h-32 w-full" />
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
        className="container mx-auto py-6 space-y-8"
      >
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-4 border-b">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Gym Settings
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your gym information, branding, and system preferences.
            </p>
          </div>
          {hasUnsavedChanges && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              <AlertCircle className="h-3 w-3 mr-1" />
              Unsaved Changes
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {gymInfo ? (
              <Card className="shadow-lg border-0">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Gym Information
                    </CardTitle>
                    <CardDescription>
                      Update your gym details and contact information.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="shadow-sm"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={personalForm.handleSubmit(handleSaveGymInfo)}
                          disabled={isSaving || !hasUnsavedChanges}
                          className="shadow-sm"
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={personalForm.handleSubmit(handleSaveGymInfo)} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Settings className="h-4 w-4" />
                        <h3 className="text-lg font-semibold">Basic Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="flex items-center gap-2">
                            <Building className="h-3 w-3" />
                            Gym Name *
                          </Label>
                          <Input 
                            id="name" 
                            disabled={!isEditing}
                            className="shadow-sm"
                            placeholder="Enter gym name"
                            {...personalForm.register('name', { required: 'Gym name is required' })}
                          />
                          {personalForm.formState.errors.name && (
                            <p className="text-sm text-red-600">{personalForm.formState.errors.name.message}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="gymCode" className="flex items-center gap-2">
                            <QrCode className="h-3 w-3" />
                            Gym Code
                          </Label>
                          <div className="relative">
                            <Input 
                              id="gymCode" 
                              value={gymInfo?.gymCode || ''}
                              disabled={true}
                              className="shadow-sm bg-muted"
                            />
                            <Badge 
                              variant="secondary" 
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                            >
                              Auto-generated
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Membership & Subscription Section */}
                    <div className="space-y-4 mt-8">
                      <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="h-4 w-4" />
                        <h3 className="text-lg font-semibold">Membership & Subscription</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">Subscription Start Date</span>
                          <div className="font-medium">
                            {gymInfo.subscriptionStartDate ? new Date(gymInfo.subscriptionStartDate).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">Subscription End Date</span>
                          <div className="font-medium">
                            {gymInfo.subscriptionEndDate ? new Date(gymInfo.subscriptionEndDate).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">Subscription Duration</span>
                          <div className="font-medium">
                            {gymInfo.subscriptionDuration || 'N/A'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <div className="font-medium">
                            {gymInfo.subscriptionEndDate && new Date(gymInfo.subscriptionEndDate) >= new Date()
                              ? <span className="text-green-600">Active</span>
                              : <span className="text-red-600">Expired</span>}
                          </div>
                        </div>
                      </div>
                      {/* Free Trial Button */}
                      {typeof gymInfo.freeTrialCounter === 'undefined' || gymInfo.freeTrialCounter === 0 ? (
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            color="primary"
                            onClick={() => setShowFreeTrialDialog(true)}
                          >
                            Start Free Trial
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-4">
                          <Badge variant="secondary" className="bg-gray-200 text-gray-700">Free trial already used</Badge>
                        </div>
                      )}
                      {/* Free Trial Confirmation Dialog */}
                      <AlertDialog open={showFreeTrialDialog} onOpenChange={setShowFreeTrialDialog}>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Start Free Trial?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to start your 7-day free trial? This can only be used once per gym.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                setShowFreeTrialDialog(false);
                                try {
                                  const response = await axiosInstance.post('/gym/start-free-trial');
                                  if (response.data.success) {
                                    toast({
                                      title: 'Free Trial Started',
                                      description: 'Your free trial is now active!',
                                    });
                                    fetchGymInfo();
                                  } else {
                                    toast({
                                      title: 'Error',
                                      description: response.data.message || 'Could not start free trial',
                                      variant: 'destructive',
                                    });
                                  }
                                } catch (error: unknown) {
                                  const err = error as { response?: { data?: { message?: string } } };
                                  toast({
                                    title: 'Error',
                                    description: err?.response?.data?.message || 'Could not start free trial',
                                    variant: 'destructive',
                                  });
                                }
                              }}
                            >
                              Start Free Trial
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <Separator />

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Phone className="h-4 w-4" />
                        <h3 className="text-lg font-semibold">Contact Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            Email Address *
                          </Label>
                          <Input 
                            id="email" 
                            type="email" 
                            disabled={!isEditing}
                            className="shadow-sm"
                            placeholder="gym@example.com"
                            {...personalForm.register('contactInfo.email', { 
                              required: 'Email is required',
                              pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: 'Invalid email format'
                              }
                            })}
                          />
                          {personalForm.formState.errors.contactInfo?.email && (
                            <p className="text-sm text-red-600">{personalForm.formState.errors.contactInfo.email.message}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            Phone Number
                          </Label>
                          <Input 
                            id="phone" 
                            type="tel" 
                            disabled={!isEditing}
                            className="shadow-sm"
                            placeholder="+1 (555) 123-4567"
                            {...personalForm.register('contactInfo.phone')}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Address Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <MapPin className="h-4 w-4" />
                        <h3 className="text-lg font-semibold">Address Information</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="street">Street Address</Label>
                          <Input 
                            id="street" 
                            disabled={!isEditing}
                            className="shadow-sm"
                            placeholder="123 Main Street"
                            {...personalForm.register('address.street')}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input 
                              id="city" 
                              disabled={!isEditing}
                              className="shadow-sm"
                              placeholder="New York"
                              {...personalForm.register('address.city')}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State/Province</Label>
                            <Input 
                              id="state" 
                              disabled={!isEditing}
                              className="shadow-sm"
                              placeholder="NY"
                              {...personalForm.register('address.state')}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                            <Input 
                              id="zipCode" 
                              disabled={!isEditing}
                              className="shadow-sm"
                              placeholder="10001"
                              {...personalForm.register('address.zipCode')}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input 
                              id="country" 
                              disabled={!isEditing}
                              className="shadow-sm"
                              placeholder="United States"
                              {...personalForm.register('address.country')}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Payments - Razorpay */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="h-4 w-4" />
                        <h3 className="text-lg font-semibold">Payments - Razorpay</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="razorpayKeyId">Razorpay Key ID</Label>
                          <Input
                            id="razorpayKeyId"
                            disabled={!isEditing}
                            className="shadow-sm"
                            placeholder="rzp_test_xxxxxxxx"
                            {...personalForm.register('razorpayKeyId')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="razorpayKeySecret">Razorpay Key Secret</Label>
                          <Input
                            id="razorpayKeySecret"
                            type="password"
                            disabled={!isEditing}
                            className="shadow-sm"
                            placeholder="••••••••"
                            {...personalForm.register('razorpayKeySecret')}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">These credentials are stored securely for your gym only. Leave blank if not configured.</p>
                    </div>

                    <Separator />

                    {/* System Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Calendar className="h-4 w-4" />
                        <h3 className="text-lg font-semibold">System Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Created Date</Label>
                          <Input 
                            value={formattedDates.created}
                            disabled={true}
                            className="shadow-sm bg-muted"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Last Updated</Label>
                          <Input 
                            value={formattedDates.updated}
                            disabled={true}
                            className="shadow-sm bg-muted"
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg border-0">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold">No Gym Information Available</h3>
                      <p className="text-muted-foreground">Unable to load gym data. Please try refreshing the page.</p>
                    </div>
                    <Button onClick={fetchGymInfo} variant="outline">
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Logo and Actions */}
          <div className="xl:col-span-1 space-y-6">
            {/* Logo Upload Section */}
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/5 pointer-events-none" />
              <CardHeader className="text-center pb-4 relative z-10">
                <CardTitle className="flex items-center justify-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Gym Logo
                </CardTitle>
                <CardDescription>
                  {isEditing ? 'Upload or change your gym logo' : 'Your gym\'s current logo'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-4">
                    {logoPreview ? (
                      <div className="relative group">
                        <img
                          src={logoPreview}
                          alt="Gym Logo"
                          className="w-full h-full object-contain rounded-lg border-2 border-border shadow-md transition-transform duration-200"
                          onLoad={() => console.log('Logo loaded successfully:', logoPreview.substring(0, 100) + '...')}
                          onError={(e) => {
                            console.error('Logo failed to load:', logoPreview.substring(0, 100) + '...');
                            console.error('Error event:', e);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              console.log('Remove logo clicked');
                              handleRemoveLogo();
                            }}
                            className="absolute -top-2 -right-2 rounded-full w-6 h-6 bg-red-500 text-white cursor-pointer hover:bg-red-600 flex items-center justify-center transition-colors hover:scale-110"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div 
                        className={`w-full h-full rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/30 transition-colors duration-200 ${
                          isEditing ? 'hover:bg-muted/50 cursor-pointer' : ''
                        }`}
                        onClick={isEditing ? () => {
                          console.log('Logo placeholder clicked');
                          fileInputRef.current?.click();
                        } : undefined}
                      >
                        <div className="text-center">
                          <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {isEditing ? 'Click to upload' : 'No logo uploaded'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {isEditing && (
                    <div className="flex gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleLogoChange}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          console.log('Upload logo button clicked');
                          fileInputRef.current?.click();
                        }}
                        disabled={isUploadingLogo}
                        className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md shadow-sm bg-white hover:bg-blue-50 hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploadingLogo ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {logoPreview ? 'Change Logo' : 'Upload Logo'}
                      </button>
                    </div>
                  )}
                  
                  <div className="mt-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      Maximum file size: 50MB
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: JPEG, PNG, GIF, WebP
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Actions Card */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Generate and manage your attendance QR code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    console.log('Preview QR Code clicked');
                    generatePDF(true);
                  }}
                  disabled={isGeneratingPDF}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-blue-50 hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPDF ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  Preview QR Code
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    console.log('Download PDF clicked');
                    generatePDF(false);
                  }}
                  disabled={isGeneratingPDF}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-green-50 hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPDF ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download PDF
                </button>
              </CardContent>
            </Card>
            
            {/* Status Card */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gym Registration</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Logo Status</span>
                  <Badge 
                    variant={logoPreview ? "default" : "secondary"} 
                    className={logoPreview ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                  >
                    {logoPreview ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploaded
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Missing
                      </>
                    )}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Banner Status</span>
                  <Badge 
                    variant={bannerPreview ? "default" : "secondary"}
                    className={bannerPreview ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                  >
                    {bannerPreview ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploaded
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Missing
                      </>
                    )}
                  </Badge>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="text-sm text-muted-foreground">Banner (3:1)</div>
                  <div className="w-full aspect-[3/1] bg-muted/30 border-2 border-dashed border-muted-foreground/25 rounded-md overflow-hidden flex items-center justify-center relative">
                    {bannerPreview ? (
                      <img src={bannerPreview} alt="Gym Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-xs text-muted-foreground">No banner uploaded</div>
                    )}
                    {isEditing && (
                      <div className="absolute inset-0 flex items-end justify-end p-2 gap-2">
                        <input type="file" ref={bannerInputRef} className="hidden" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleBannerChange} />
                        <button
                          type="button"
                          onClick={() => bannerInputRef.current?.click()}
                          className="px-3 py-1 text-xs rounded-md border bg-white shadow-sm hover:bg-blue-50"
                          disabled={isUploadingBanner}
                        >
                          {isUploadingBanner ? 'Uploading...' : (bannerPreview ? 'Change Banner' : 'Upload Banner')}
                        </button>
                        {bannerPreview && (
                          <button
                            type="button"
                            onClick={handleRemoveBanner}
                            className="px-3 py-1 text-xs rounded-md border bg-red-50 text-red-700 hover:bg-red-100"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Recommended ~1800x600. We enforce 3:1 on upload.</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">QR Code</span>
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    <QrCode className="h-3 w-3 mr-1" />
                    Ready
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Help Card
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Having trouble with your gym settings? Check out our help center for guides and tutorials.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    console.log('Help button clicked');
                    window.open('https://docs.example.com/gym-settings', '_blank');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md shadow-sm bg-white hover:bg-amber-50 hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  View Documentation
                </button>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </motion.div>

      {/* Delete Logo Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Remove Logo
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the gym logo? This action cannot be undone and will affect all generated documents and QR codes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveLogo}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove Logo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsaved Changes Warning */}
      <AnimatePresence>
        {hasUnsavedChanges && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Card className="shadow-lg border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-800">Unsaved Changes</p>
                    <p className="text-xs text-orange-600">Don't forget to save your changes</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="text-orange-600 border-orange-200 hover:bg-orange-100"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={personalForm.handleSubmit(handleSaveGymInfo)}
                      disabled={isSaving}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default SettingsPage;