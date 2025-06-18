import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, User, Building, CreditCard, Shield, Bell, Edit2, Download, Eye, Upload, X } from 'lucide-react';
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
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import axiosInstance from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const { user, updateUserProfile } = useAuth();
  const [gymInfo, setGymInfo] = useState<GymInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

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

  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    // If the URL is already absolute, return it as is
    if (url.startsWith('http')) return url;
    // Otherwise, prepend the API URL
    const filename = url.split('/').pop();
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/uploads/logos/${filename}`;
  };

  useEffect(() => {
    fetchGymInfo();
  }, []);

  const fetchGymInfo = async () => {
    try {
      const response = await axiosInstance.get('/gym/info');
      if (response.data.success) {
        const gymData = response.data.gym;
        setGymInfo(gymData);
        setLogoPreview(getImageUrl(gymData.logo));
        // Set form default values
        personalForm.reset({
          name: gymData.name,
          contactInfo: {
            email: gymData.contactInfo.email,
            phone: gymData.contactInfo.phone
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
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
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

      if (response.data.success) {
        const newLogoUrl = response.data.logoUrl;
        setLogoPreview(getImageUrl(newLogoUrl));
        setGymInfo(prev => prev ? { ...prev, logo: newLogoUrl } : null);
        toast({
          title: "Success",
          description: "Logo updated successfully",
        });
      }
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const response = await axiosInstance.delete('/gym/logo');
      if (response.data.success) {
        setLogoPreview(null);
        setGymInfo(prev => prev ? { ...prev, logo: null } : null);
        toast({
          title: "Success",
          description: "Logo removed successfully",
        });
      }
    } catch (error) {
      console.error('Error removing logo:', error);
      toast({
        title: "Error",
        description: "Failed to remove logo",
        variant: "destructive",
      });
    }
    setShowDeleteDialog(false);
  };

  const handleSaveGymInfo = async (data: GymFormData) => {
    try {
      const response = await axiosInstance.put('/gym/info', {
        name: data.name,
        contactInfo: {
          email: data.contactInfo.email,
          phone: data.contactInfo.phone
        },
        address: {
          street: data.address.street,
          city: data.address.city,
          state: data.address.state,
          zipCode: data.address.zipCode,
          country: data.address.country
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
    } catch (error) {
      console.error('Error updating gym info:', error);
      toast({
        title: "Error",
        description: "Failed to update gym information",
        variant: "destructive",
      });
    }
  };

  const generatePDF = async (preview: boolean = false) => {
    try {
      // Show loading state
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your PDF...",
      });

      // Make request to backend
      const response = await axiosInstance.get('/gym/generate-pdf', {
        responseType: 'blob' // Important: This tells axios to expect binary data
      });

      // Create a blob URL from the response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      if (preview) {
        // Open PDF in new window
        window.open(url, '_blank');
      } else {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = 'gym-profile.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Clean up the blob URL
      window.URL.revokeObjectURL(url);

      // Show success message
      toast({
        title: "Success",
        description: preview ? "PDF preview opened in new window" : "PDF downloaded successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Gym Information</CardTitle>
              <CardDescription>
                View and update your gym details.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generatePDF(true)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generatePDF(false)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : gymInfo ? (
              <>
                <div ref={pdfRef} className="hidden">
                  <div className="p-8">
                    <div className="text-center mb-8">
                      {logoPreview && (
                        <div className="flex justify-center mb-4">
                          <img
                            src={logoPreview}
                            alt="Gym Logo"
                            className="w-32 h-32 object-contain"
                          />
                        </div>
                      )}
                      <h1 className="text-2xl font-bold mb-2">{gymInfo.name}</h1>
                      <p className="text-gray-600">Gym Code: {gymInfo.gymCode}</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-lg font-semibold mb-2">Contact Information</h2>
                        <p>Email: {gymInfo.contactInfo.email}</p>
                        <p>Phone: {gymInfo.contactInfo.phone}</p>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold mb-2">Address</h2>
                        {gymInfo.address ? (
                          <>
                            <p>Street: {gymInfo.address.street}</p>
                            <p>City: {gymInfo.address.city}</p>
                            <p>State: {gymInfo.address.state}</p>
                            <p>Zip Code: {gymInfo.address.zipCode}</p>
                            <p>Country: {gymInfo.address.country}</p>
                          </>
                        ) : (
                          <p className="text-gray-500">No address information available</p>
                        )}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold mb-2">Timestamps</h2>
                        <p>Created: {new Date(gymInfo.createdAt).toLocaleString()}</p>
                        <p>Last Updated: {new Date(gymInfo.updatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center mb-6">
                  <div className="relative w-32 h-32 mb-4">
                    {logoPreview ? (
                      <>
                        <img
                          src={getImageUrl(logoPreview)}
                          alt="Gym Logo"
                          className="w-full h-full object-contain rounded-lg border-2 border-border"
                          onError={(e) => {
                            console.error('Error loading image:', e);
                            setLogoPreview(null);
                            toast({
                              title: "Error",
                              description: "Failed to load logo image. Please try uploading again.",
                              variant: "destructive",
                            });
                          }}
                        />
                        {!isEditing && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0"
                            onClick={() => setShowDeleteDialog(true)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/10">
                        <Upload className="w-8 h-8 text-muted-foreground" />
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
                        onChange={handleLogoChange}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingLogo}
                      >
                        {isUploadingLogo ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            {logoPreview ? 'Change Logo' : 'Upload Logo'}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <form onSubmit={personalForm.handleSubmit(handleSaveGymInfo)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Gym Name</Label>
                      <Input 
                        id="name" 
                        disabled={!isEditing}
                        {...personalForm.register('name')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gymCode">Gym Code</Label>
                      <Input 
                        id="gymCode" 
                        defaultValue={gymInfo?.gymCode}
                        disabled={true}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      disabled={!isEditing}
                      {...personalForm.register('contactInfo.email')}
                    />
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      disabled={!isEditing}
                      {...personalForm.register('contactInfo.phone')}
                    />
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="street">Street Address</Label>
                    <Input 
                      id="street" 
                      disabled={!isEditing}
                      {...personalForm.register('address.street')}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input 
                        id="city" 
                        disabled={!isEditing}
                        {...personalForm.register('address.city')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input 
                        id="state" 
                        disabled={!isEditing}
                        {...personalForm.register('address.state')}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Zip Code</Label>
                      <Input 
                        id="zipCode" 
                        disabled={!isEditing}
                        {...personalForm.register('address.zipCode')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input 
                        id="country" 
                        disabled={!isEditing}
                        {...personalForm.register('address.country')}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label>Created At</Label>
                      <Input 
                        value={gymInfo ? new Date(gymInfo.createdAt).toLocaleString() : ''}
                        disabled={true}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Updated</Label>
                      <Input 
                        value={gymInfo ? new Date(gymInfo.updatedAt).toLocaleString() : ''}
                        disabled={true}
                      />
                    </div>
                  </div>
                  {isEditing && (
                    <div className="flex gap-2 pt-4">
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          // Reset form to current gym info
                          if (gymInfo) {
                            personalForm.reset({
                              name: gymInfo.name,
                              contactInfo: {
                                email: gymInfo.contactInfo.email,
                                phone: gymInfo.contactInfo.phone
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
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </form>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No gym information available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Logo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the gym logo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveLogo}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default SettingsPage;
