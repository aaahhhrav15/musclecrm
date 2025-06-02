import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Save } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useToast } from '@/hooks/use-toast';
import ProfileService, { ProfileUpdateData } from '@/services/ProfileService';

// Form validation schema
const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfilePage: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Use the auth hook to check authentication
  useRequireAuth();
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      bio: '',
    },
  });
  
  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const profileData = await ProfileService.getProfile();
        
        form.reset({
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone || '',
          bio: profileData.bio || '',
        });
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Failed to load profile',
          description: 'There was a problem loading your profile data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, [user, form, toast]);
  
  const onSubmit = async (data: ProfileFormValues) => {
    setIsUpdating(true);
    
    try {
      // First, update through the Auth context to keep authentication state in sync
      await updateUserProfile({
        name: data.name,
        email: data.email,
      });
      
      // Then use the ProfileService to update additional fields
      const profileData: ProfileUpdateData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        bio: data.bio,
      };
      
      await ProfileService.updateProfile(profileData);
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      
      toast({
        title: 'Update failed',
        description: error.response?.data?.message || 'There was a problem updating your profile.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <span className="ml-2">Loading profile...</span>
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
        className="space-y-6"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and profile information.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="text-lg">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle>{user?.name}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Role</h4>
                <p className="text-sm capitalize">{user?.role || 'Member'}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Industry</h4>
                <p className="text-sm capitalize">{user?.industry || 'Not specified'}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Joined</h4>
                <p className="text-sm">{user?.joinDate || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Edit Profile Form */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>
                Update your profile information and personal details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default ProfilePage;
