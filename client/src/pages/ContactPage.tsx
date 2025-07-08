
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { Mail, Phone, MapPin, MessageSquare } from 'lucide-react';

// Form validation schema
const contactFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters.' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const ContactPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Simulated form submission - would connect to API in production
      console.log('Form data submitted:', data);
      
      // Show success message
      toast({
        title: "Message sent",
        description: "We've received your message and will respond shortly.",
      });
      
      // Reset form
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: "There was a problem sending your message. Please try again.",
      });
      console.error('Contact form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        {/* Hero section */}
        <section className="bg-primary/5 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl mb-6">Contact MuscleCRM</h1>
              <p className="text-xl text-muted-foreground mb-8">
                We're here to help with any questions about our platform. 
                Get in touch with our team and we'll respond as soon as possible.
              </p>
            </div>
          </div>
        </section>
        
        {/* Contact info and form section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Contact information */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
                <p className="text-muted-foreground mb-8">
                  Have questions about MuscleCRM or need assistance with your account? 
                  Our team is ready to help you implement the perfect solution for your business.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="mr-4 mt-1">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Email</h3>
                      <p className="text-muted-foreground">info@musclecrm.com</p>
                      <p className="text-muted-foreground">support@musclecrm.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mr-4 mt-1">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Phone</h3>
                      <p className="text-muted-foreground">+1 (555) 123-4567</p>
                      <p className="text-muted-foreground">Mon-Fri: 9am - 6pm EST</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mr-4 mt-1">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Office</h3>
                      <p className="text-muted-foreground">123 Business Avenue</p>
                      <p className="text-muted-foreground">Suite 200</p>
                      <p className="text-muted-foreground">New York, NY 10001</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mr-4 mt-1">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Live Chat</h3>
                      <p className="text-muted-foreground">
                        Available on our website during business hours.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Contact form */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Send us a message</CardTitle>
                    <CardDescription>
                      Fill out the form below and we'll get back to you as soon as possible.
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
                                <Input placeholder="Your name" {...field} />
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
                                <Input placeholder="Your email address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject</FormLabel>
                              <FormControl>
                                <Input placeholder="Message subject" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Message</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="How can we help you?" 
                                  className="min-h-[120px]" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                          {isSubmitting ? "Sending..." : "Send Message"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ section */}
        <section className="bg-muted py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
              
              <div className="space-y-6">
                <div className="bg-background rounded-lg p-6 shadow-sm">
                  <h3 className="text-xl font-medium mb-3">How do I get started with MuscleCRM?</h3>
                  <p className="text-muted-foreground">
                    Getting started is easy! Simply sign up for an account, choose your industry, and follow our simple setup guide. Our onboarding team will help you every step of the way.
                  </p>
                </div>
                
                <div className="bg-background rounded-lg p-6 shadow-sm">
                  <h3 className="text-xl font-medium mb-3">Is there a free trial available?</h3>
                  <p className="text-muted-foreground">
                    Yes, we offer a 14-day free trial for all new users. No credit card required to get started. You can explore all features during the trial period.
                  </p>
                </div>
                
                <div className="bg-background rounded-lg p-6 shadow-sm">
                  <h3 className="text-xl font-medium mb-3">Can I switch between different industry modules?</h3>
                  <p className="text-muted-foreground">
                    Absolutely! MuscleCRM is designed to be adaptable. You can switch between industry modules or use multiple modules simultaneously depending on your subscription plan.
                  </p>
                </div>
                
                <div className="bg-background rounded-lg p-6 shadow-sm">
                  <h3 className="text-xl font-medium mb-3">Do you offer customization for specific business needs?</h3>
                  <p className="text-muted-foreground">
                    Yes, we offer customization options for businesses with specific requirements. Contact our sales team to discuss your unique needs and how we can tailor MuscleCRM for you.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default ContactPage;
