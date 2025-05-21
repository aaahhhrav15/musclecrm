
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

// Form validation schema
const profileFormSchema = z.object({
  full_name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfilePage: React.FC = () => {
  const { user, profile, updateUserProfile } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Use the auth hook to check authentication
  const auth = useRequireAuth();
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
    },
  });
  
  // Update form values when profile data is available
  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsUpdating(true);
    try {
      await updateUserProfile({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  if (auth.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="text-lg">{profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle>{profile?.full_name || 'User'}</CardTitle>
              <CardDescription>{profile?.email || user?.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Role</h4>
                <p className="text-sm capitalize">Admin</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Industry</h4>
                <p className="text-sm capitalize">{profile?.industry || 'Not specified'}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Joined</h4>
                <p className="text-sm">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Not specified'}</p>
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
                    name="full_name"
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
