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

interface GymInfo {
  _id: string;
  name: string;
  gymCode: string;
  logo: string | null;
  contactInfo: {
    email: string;
    phone: string;
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
}

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [gymInfo, setGymInfo] = useState<GymInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  const personalForm = useForm<GymFormData>();
  const businessForm = useForm();
  const securityForm = useForm();
  const notificationsForm = useForm();

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
        setGymInfo(response.data.gym);
        setLogoPreview(getImageUrl(response.data.gym.logo));
        // Set form default values
        personalForm.reset({
          name: response.data.gym.name,
          contactInfo: {
            email: response.data.gym.contactInfo.email,
            phone: response.data.gym.contactInfo.phone
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
        setLogoPreview(response.data.logoUrl);
        setGymInfo(prev => prev ? { ...prev, logo: response.data.logoUrl } : null);
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
  };

  const handleSaveGymInfo = async (data: GymFormData) => {
    try {
      const response = await axiosInstance.put('/gym/info', {
        name: data.name,
        contactInfo: {
          email: data.contactInfo.email,
          phone: data.contactInfo.phone
        }
      });
      if (response.data.success) {
        // Update the entire gym info including the new timestamps
        setGymInfo({
          ...response.data.gym,
          updatedAt: new Date().toISOString() // Ensure we have the latest timestamp
        });
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

  const generatePDF = async (viewOnly: boolean = false) => {
    if (!gymInfo || !pdfRef.current) return;

    try {
      const canvas = await html2canvas(pdfRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      if (viewOnly) {
        pdf.output('dataurlnewwindow');
      } else {
        pdf.save(`${gymInfo.name}-info.pdf`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and business preferences.
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <div className="flex overflow-x-auto pb-2">
            <TabsList className="h-auto p-0 bg-transparent space-x-6">
              <TabsTrigger 
                value="profile"
                className="flex items-center gap-2 pb-2 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                <User className="h-4 w-4" /> Profile
              </TabsTrigger>
              <TabsTrigger 
                value="business"
                className="flex items-center gap-2 pb-2 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                <Building className="h-4 w-4" /> Business
              </TabsTrigger>
              <TabsTrigger 
                value="billing"
                className="flex items-center gap-2 pb-2 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                <CreditCard className="h-4 w-4" /> Billing
              </TabsTrigger>
              <TabsTrigger 
                value="security"
                className="flex items-center gap-2 pb-2 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                <Shield className="h-4 w-4" /> Security
              </TabsTrigger>
              <TabsTrigger 
                value="notifications"
                className="flex items-center gap-2 pb-2 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                <Bell className="h-4 w-4" /> Notifications
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="profile" className="space-y-4 mt-6">
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
                                onClick={handleRemoveLogo}
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
          </TabsContent>
          
          <TabsContent value="business" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>
                  Update your business details and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={businessForm.handleSubmit(() => {})}>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input id="businessName" defaultValue="Acme Inc." />
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="businessAddress">Address</Label>
                    <Textarea id="businessAddress" defaultValue="123 Business St, Suite 101&#10;New York, NY 10001" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessEmail">Business Email</Label>
                      <Input id="businessEmail" type="email" defaultValue="info@acme.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessPhone">Business Phone</Label>
                      <Input id="businessPhone" type="tel" defaultValue="555-987-6543" />
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
                <CardDescription>
                  Update your payment details and billing preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-8 text-center text-muted-foreground">
                  Billing details and subscription management will be integrated here.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Update your security preferences and password.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={securityForm.handleSubmit(() => {})}>
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input id="confirmPassword" type="password" />
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button>
                      <Save className="mr-2 h-4 w-4" />
                      Update Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how you receive notifications and alerts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={notificationsForm.handleSubmit(() => {})}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Email Notifications</h4>
                        <p className="text-sm text-muted-foreground">Receive notifications via email.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">SMS Notifications</h4>
                        <p className="text-sm text-muted-foreground">Receive notifications via text message.</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Booking Alerts</h4>
                        <p className="text-sm text-muted-foreground">Get alerted when you receive new bookings.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Payment Notifications</h4>
                        <p className="text-sm text-muted-foreground">Get alerted when payments are processed.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="pt-4">
                      <Button>
                        <Save className="mr-2 h-4 w-4" />
                        Save Preferences
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default SettingsPage;
