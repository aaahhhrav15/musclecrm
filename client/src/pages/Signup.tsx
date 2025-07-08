import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import { useIndustry } from '../context/IndustryContext';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { Loader2, Upload } from 'lucide-react';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';

const formSchema = z.object({
  gymName: z.string().min(2, { message: 'Gym name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number' }),
  logo: z.any().optional(),
  address: z.object({
    street: z.string().min(1, { message: 'Street address is required' }),
    city: z.string().min(1, { message: 'City is required' }),
    state: z.string().min(1, { message: 'State is required' }),
    zipCode: z.string().min(1, { message: 'Zip code is required' }),
    country: z.string().min(1, { message: 'Country is required' })
  })
});

type FormValues = z.infer<typeof formSchema>;

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { setSelectedIndustry } = useIndustry();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gymName: '',
      email: '',
      password: '',
      phone: '',
      logo: null,
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('logo', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: FormValues) => {
    console.log('=== FORM SUBMISSION STARTED ===');
    console.log('Form submitted with values:', values);
    setIsLoading(true);
    try {
      console.log('Calling signup function...');
      // Call signup with all fields as an object
      const response = await signup({
        name: values.gymName,
        email: values.email,
        password: values.password,
        industry: 'gym', // Hardcoded since we only support gym
        gymName: values.gymName,
        phone: values.phone,
        address: {
          street: values.address.street,
          city: values.address.city,
          state: values.address.state,
          zipCode: values.address.zipCode,
          country: values.address.country,
        },
        logo: values.logo || undefined,
      });
      console.log('Signup successful:', response);
      setSelectedIndustry('gym');
      toast({
        title: 'Account created',
        description: `Welcome to MuscleCRM! Your gym number is: ${response.gym?.gymCode}`,
      });
      navigate('/setup');
    } catch (error: unknown) {
      console.error('Signup error:', error);
      // Try to extract error message if possible
      let errorMessage = 'There was a problem creating your account.';
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as { response?: { data?: { message?: string } } };
        errorMessage = err.response?.data?.message || errorMessage;
      }
      toast({
        title: 'Signup failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">Register Your Gym</h1>
            <p className="mt-2 text-muted-foreground">
              Create your MuscleCRM account to manage your gym
            </p>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="gymName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gym Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Gym Name" {...field} />
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
                          <Input placeholder="gym@example.com" {...field} />
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
                          <Input placeholder="+1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address.street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter street address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter city" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter state" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address.zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter zip code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address.country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="logo"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>Gym Logo (Optional)</FormLabel>
                        <FormControl>
                          <div className="flex flex-col items-center gap-4">
                            {logoPreview ? (
                              <div className="relative w-32 h-32">
                                <img
                                  src={logoPreview}
                                  alt="Logo preview"
                                  className="w-full h-full object-cover rounded-full border-2 border-border"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0"
                                  onClick={() => {
                                    setLogoPreview(null);
                                    form.setValue('logo', null);
                                  }}
                                >
                                  ×
                                </Button>
                              </div>
                            ) : (
                              <div className="w-32 h-32 border-2 border-dashed rounded-full flex items-center justify-center bg-muted/10">
                                <Upload className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoChange}
                              className="hidden"
                              id="logo-upload"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('logo-upload')?.click()}
                            >
                              Upload Logo
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          You can add or change your logo later from the settings
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </Form>
              
              <div className="mt-6 text-center text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Signup;
