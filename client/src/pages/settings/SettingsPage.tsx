
import React from 'react';
import { motion } from 'framer-motion';
import { Save, User, Building, CreditCard, Shield, Bell } from 'lucide-react';
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

const SettingsPage: React.FC = () => {
  const personalForm = useForm();
  const businessForm = useForm();
  const securityForm = useForm();
  const notificationsForm = useForm();

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
              <CardHeader>
                <CardTitle>Gym Information</CardTitle>
                <CardDescription>
                  Update your personal details and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={personalForm.handleSubmit(() => {})}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" defaultValue="John" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" defaultValue="Doe" />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="john.doe@example.com" />
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" defaultValue="555-123-4567" />
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
