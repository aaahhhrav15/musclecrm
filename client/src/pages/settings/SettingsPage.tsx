import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
}

// **OPTIMIZATION: Memoized components for better performance**
const LoadingState = React.memo(() => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
    <Skeleton className="h-32 w-full" />
  </div>
));

const LogoUploadSection = React.memo(({ 
  logoPreview, 
  isUploadingLogo, 
  isEditing, 
  onLogoChange, 
  onRemoveLogo, 
  fileInputRef 
}: {
  logoPreview: string | null;
  isUploadingLogo: boolean;
  isEditing: boolean;
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}) => (
  <Card className="relative overflow-hidden border-0 shadow-lg">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/5" />
    <CardHeader className="text-center pb-4">
      <CardTitle className="flex items-center justify-center gap-2">
        <ImageIcon className="h-5 w-5" />
        Gym Logo
      </CardTitle>
      <CardDescription>
        Upload your gym's logo to personalize your documents and QR codes
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32 mb-4">
          {logoPreview ? (
            <div className="relative group">
              <img
                src={logoPreview}
                alt="Gym Logo"
                className="w-full h-full object-contain rounded-lg border-2 border-border shadow-md"
              />
              {!isEditing && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={onRemoveLogo}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ) : (
            <div className="w-full h-full rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/30">
              <div className="text-center">
                <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No logo uploaded</p>
              </div>
            </div>
          )}
        </div>
        
        {!isEditing && (
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={onLogoChange}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingLogo}
              className="shadow-sm"
            >
              {isUploadingLogo ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {logoPreview ? 'Change Logo' : 'Upload Logo'}
            </Button>
          </div>
        )}
        
        <div className="mt-3 text-center">
          <p className="text-xs text-muted-foreground">
            Maximum file size: 5MB
          </p>
          <p className="text-xs text-muted-foreground">
            Supported formats: JPEG, PNG, GIF, WebP
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
));

const QuickActionsCard = React.memo(({ 
  onPreviewPDF, 
  onDownloadPDF, 
  isGeneratingPDF 
}: {
  onPreviewPDF: () => void;
  onDownloadPDF: () => void;
  isGeneratingPDF: boolean;
}) => (
  <Card className="relative overflow-hidden border-0 shadow-lg">
    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-600/5" />
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
      <Button
        variant="outline"
        className="w-full shadow-sm"
        onClick={onPreviewPDF}
        disabled={isGeneratingPDF}
      >
        {isGeneratingPDF ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Eye className="h-4 w-4 mr-2" />
        )}
        Preview QR Code
      </Button>
      <Button
        variant="outline"
        className="w-full shadow-sm"
        onClick={onDownloadPDF}
        disabled={isGeneratingPDF}
      >
        {isGeneratingPDF ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        Download PDF
      </Button>
    </CardContent>
  </Card>
));

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [gymInfo, setGymInfo] = useState<GymInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      }
    }
  });

  // **OPTIMIZATION: Memoized fetch function**
  const fetchGymInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get('/gym/info');
      if (response.data.success) {
        const gymData = response.data.gym;
        setGymInfo(gymData);
        setLogoPreview(gymData.logo);
        
        // Reset form with fetched data
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
          }
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

  useEffect(() => {
    fetchGymInfo();
  }, [fetchGymInfo]);

  // **OPTIMIZATION: Debounced logo change handler**
  const handleLogoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        description: "Image size should be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploadingLogo(true);
      const formData = new FormData();
      formData.append('logo', file);

      const response = await axiosInstance.put('/gym/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.logo) {
        setLogoPreview(response.data.logo);
        setGymInfo(prev => {
          if (!prev) return null;
          return { ...prev, logo: response.data.logo };
        });
        toast({
          title: "Success",
          description: "Logo updated successfully",
        });
      }
    } catch (error: unknown) {
      const err = error as AxiosError;
      console.error('Error uploading logo:', err);
      toast({
        title: "Error",
        description: (err.response?.data as { message?: string })?.message || "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
      // Clear the input value to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [toast]);

  const handleRemoveLogo = useCallback(async () => {
    try {
      await axiosInstance.delete('/gym/logo');
      setLogoPreview(null);
      setGymInfo(prev => {
        if (!prev) return null;
        return { ...prev, logo: null };
      });
      toast({
        title: "Success",
        description: "Logo removed successfully",
      });
    } catch (error: unknown) {
      const err = error as AxiosError;
      console.error('Error removing logo:', err);
      toast({
        title: "Error",
        description: "Failed to remove logo",
        variant: "destructive",
      });
    }
    setShowDeleteDialog(false);
  }, [toast]);

  const handleSaveGymInfo = useCallback(async (data: GymFormData) => {
    try {
      setIsSaving(true);
      const response = await axiosInstance.put('/gym/info', {
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
        }
      });

      if (response.data.success) {
        setGymInfo(response.data.gym);
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Gym information updated successfully",
        });
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
  }, [toast]);

  const generatePDF = useCallback(async (preview: boolean = false) => {
    try {
      setIsGeneratingPDF(true);
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your PDF...",
      });

      const response = await axiosInstance.get('/gym/generate-pdf', {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      if (preview) {
        window.open(url, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = `${gymInfo?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'gym'}_qr_code.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      window.URL.revokeObjectURL(url);

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

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
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
        }
      });
    }
  }, [gymInfo, personalForm]);

  // **OPTIMIZATION: Memoized computed values**
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

  const hasUnsavedChanges = useMemo(() => {
    if (!gymInfo || !personalForm.formState.isDirty) return false;
    return isEditing && personalForm.formState.isDirty;
  }, [gymInfo, personalForm.formState.isDirty, isEditing]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <LoadingState />
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
                          disabled={isSaving || !personalForm.formState.isDirty}
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
            <LogoUploadSection
              logoPreview={logoPreview}
              isUploadingLogo={isUploadingLogo}
              isEditing={isEditing}
              onLogoChange={handleLogoChange}
              onRemoveLogo={() => setShowDeleteDialog(true)}
              fileInputRef={fileInputRef}
            />
            
            <QuickActionsCard
              onPreviewPDF={() => generatePDF(true)}
              onDownloadPDF={() => generatePDF(false)}
              isGeneratingPDF={isGeneratingPDF}
            />
            
            {/* Status Card */}
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-600/5" />
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
                  <span className="text-sm text-muted-foreground">QR Code</span>
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    <QrCode className="h-3 w-3 mr-1" />
                    Ready
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-600/5" />
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
                <Button variant="outline" size="sm" className="w-full shadow-sm">
                  <FileText className="h-4 w-4 mr-2" />
                  View Documentation
                </Button>
              </CardContent>
            </Card>
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