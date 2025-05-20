
import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Calendar, MapPin, Camera } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: user?.name || 'John Doe',
      email: user?.email || 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main Street, New York, NY 10001',
      bio: 'Fitness enthusiast and gym owner with over 10 years of experience in the fitness industry.',
      birthday: '1985-06-15',
    }
  });

  const onSubmit = (data: any) => {
    console.log(data);
    // Here you would update the user profile
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6 max-w-3xl mx-auto"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information and account details.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-8 items-start mb-6">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>
                    {user?.name?.charAt(0) || 'JD'}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" className="gap-2">
                  <Camera className="h-4 w-4" /> Change Photo
                </Button>
              </div>
              <div className="space-y-4 flex-1">
                <div>
                  <h2 className="text-xl font-semibold">{user?.name || 'John Doe'}</h2>
                  <p className="text-muted-foreground">{user?.email || 'john.doe@example.com'}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Member since Jan 2025</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>New York, NY</span>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="name" 
                      className="pl-10" 
                      {...register('name')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      className="pl-10" 
                      {...register('email')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="phone" 
                      type="tel" 
                      className="pl-10" 
                      {...register('phone')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthday">Birthday</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="birthday" 
                      type="date" 
                      className="pl-10" 
                      {...register('birthday')}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="address" 
                    className="pl-10" 
                    {...register('address')}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  rows={4} 
                  {...register('bio')}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline">Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default ProfilePage;
