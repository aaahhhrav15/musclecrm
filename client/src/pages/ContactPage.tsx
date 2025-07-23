import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { Mail, Phone, MapPin, MessageSquare, Clock, ArrowRight } from 'lucide-react';

// Form validation schema
const contactFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters.' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const ContactPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
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
        title: "Message sent successfully!",
        description: "We've received your message and will respond within 24 hours.",
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
        {/* Hero section with extra spacing */}
        <section className="relative pt-24 pb-16 md:pt-36 md:pb-24 bg-gradient-to-br from-primary to-primary/90 overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl mb-6 text-white">
                Contact MuscleCRM
              </h1>
              <p className="text-xl text-primary-foreground/90 mb-8">
                We're here to help with any questions about MuscleCRM. 
                Get in touch with our team and we'll respond as soon as possible.
              </p>
              <div className="flex items-center justify-center gap-2 text-primary-foreground/80">
                <Clock className="h-5 w-5" />
                <span>Average response time: Under 2 hours</span>
              </div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-[1000px] h-[1000px] rounded-full bg-white/5 -right-[300px] -top-[300px]"></div>
            <div className="absolute w-[800px] h-[800px] rounded-full bg-white/5 -left-[200px] -bottom-[300px]"></div>
          </div>
        </section>
        
        {/* Contact info and form section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Contact information */}
              <div>
                <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
                <p className="text-muted-foreground mb-8 text-lg">
                  Have questions about MuscleCRM or need assistance with your account? 
                  Our team is ready to help you implement the perfect solution for your fitness business.
                </p>
                
                <div className="space-y-8">
                  <div className="flex items-start group">
                    <div className="mr-4 mt-1 p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Email Support</h3>
                      <p className="text-muted-foreground mb-1">support@musclecrm.com</p>
                      <p className="text-sm text-muted-foreground">For general inquiries and support</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start group">
                    <div className="mr-4 mt-1 p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Phone Support</h3>
                      <p className="text-muted-foreground mb-1">+91 9798893573</p>
                      <p className="text-sm text-muted-foreground">Monday - Friday: 9:00 AM - 6:00 PM IST</p>
                      <p className="text-sm text-muted-foreground">Saturday: 10:00 AM - 4:00 PM IST</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start group">
                    <div className="mr-4 mt-1 p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Office Location</h3>
                      <p className="text-muted-foreground mb-1">A-203 Rizvi Palace</p>
                      <p className="text-muted-foreground mb-1">Hill Road, Bandra West</p>
                      <p className="text-muted-foreground mb-2">Mumbai-400050, Maharashtra, India</p>
                      <p className="text-sm text-muted-foreground">Visiting hours by appointment only</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Contact form */}
              <div>
                <Card className="shadow-2xl border-0 bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950 rounded-3xl p-1">
                  <CardHeader className="rounded-t-3xl bg-gradient-to-r from-blue-600 to-purple-600 p-5 text-white">
                    <CardTitle className="text-2xl font-bold mb-1">Send us a message</CardTitle>
                    <CardDescription className="text-base text-white/90">
                      Fill out the form below and we'll get back to you as soon as possible.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">Full Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your full name" className="h-10 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white/90 dark:bg-slate-900/80 text-base" {...field} />
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
                              <FormLabel className="text-base font-semibold">Email Address *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your email address" className="h-10 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white/90 dark:bg-slate-900/80 text-base" {...field} />
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
                              <FormLabel className="text-base font-semibold">Subject *</FormLabel>
                              <FormControl>
                                <Input placeholder="What is this regarding?" className="h-10 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white/90 dark:bg-slate-900/80 text-base" {...field} />
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
                              <FormLabel className="text-base font-semibold">Message *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Tell us how we can help you..." 
                                  className="min-h-[100px] resize-none rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white/90 dark:bg-slate-900/80 text-base" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full h-10 text-base rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <MessageSquare className="mr-2 h-4 w-4 animate-spin" />
                              Sending Message...
                            </>
                          ) : (
                            <>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ section - enhanced UI */}
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
                <p className="text-lg text-muted-foreground">
                  Common questions about MuscleCRM and our services
                </p>
              </div>
              <div className="grid gap-8 md:grid-cols-2">
                {/* FAQ 1 */}
                <div className="relative group bg-white dark:bg-slate-900 rounded-2xl p-7 shadow-lg border border-blue-100 dark:border-slate-800 hover:shadow-2xl transition-all duration-200">
                  <div className="absolute -top-5 -left-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full w-10 h-10 flex items-center justify-center shadow-md">
                    <span className="text-white text-xl font-bold">1</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-2 mt-2 text-blue-700 dark:text-blue-300">How do I get started with MuscleCRM?</h3>
                  <p className="text-base text-slate-600 dark:text-slate-300">
                    Getting started is easy! Simply sign up for an account, and follow our simple setup guide. Our onboarding team will help you every step of the way to get your gym management system up and running.
                  </p>
                </div>
                {/* FAQ 2 */}
                <div className="relative group bg-white dark:bg-slate-900 rounded-2xl p-7 shadow-lg border border-blue-100 dark:border-slate-800 hover:shadow-2xl transition-all duration-200">
                  <div className="absolute -top-5 -left-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full w-10 h-10 flex items-center justify-center shadow-md">
                    <span className="text-white text-xl font-bold">2</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-2 mt-2 text-blue-700 dark:text-blue-300">Is there a free trial available?</h3>
                  <p className="text-base text-slate-600 dark:text-slate-300">
                    Yes, we offer a 7-day free trial for all new users. No credit card required to get started. You can explore all features during the trial period.
                  </p>
                </div>
                {/* FAQ 3 */}
                <div className="relative group bg-white dark:bg-slate-900 rounded-2xl p-7 shadow-lg border border-blue-100 dark:border-slate-800 hover:shadow-2xl transition-all duration-200">
                  <div className="absolute -top-5 -left-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full w-10 h-10 flex items-center justify-center shadow-md">
                    <span className="text-white text-xl font-bold">3</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-2 mt-2 text-blue-700 dark:text-blue-300">What payment methods do you accept?</h3>
                  <p className="text-base text-slate-600 dark:text-slate-300">
                    We accept all major credit cards, debit cards, net banking, UPI, and digital wallets. All payments are processed securely through our encrypted payment gateway.
                  </p>
                </div>
                {/* FAQ 4 */}
                <div className="relative group bg-white dark:bg-slate-900 rounded-2xl p-7 shadow-lg border border-blue-100 dark:border-slate-800 hover:shadow-2xl transition-all duration-200">
                  <div className="absolute -top-5 -left-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full w-10 h-10 flex items-center justify-center shadow-md">
                    <span className="text-white text-xl font-bold">4</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-2 mt-2 text-blue-700 dark:text-blue-300">Do you offer customizationg?</h3>
                  <p className="text-base text-slate-600 dark:text-slate-300">
                    No, MuscleCRM does not offer customizations. We provide a robust set of features designed to meet the needs of most fitness businesses out of the box.
                  </p>
                </div>
                {/* FAQ 5 */}
                <div className="relative group bg-white dark:bg-slate-900 rounded-2xl p-7 shadow-lg border border-blue-100 dark:border-slate-800 hover:shadow-2xl transition-all duration-200">
                  <div className="absolute -top-5 -left-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full w-10 h-10 flex items-center justify-center shadow-md">
                    <span className="text-white text-xl font-bold">5</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-2 mt-2 text-blue-700 dark:text-blue-300">Is my data secure with MuscleCRM?</h3>
                  <p className="text-base text-slate-600 dark:text-slate-300">
                    Absolutely! We use industry-standard encryption and security measures to protect your data. All information is stored securely and backed up regularly.
                  </p>
                </div>
                {/* FAQ 6 */}
                <div className="relative group bg-white dark:bg-slate-900 rounded-2xl p-7 shadow-lg border border-blue-100 dark:border-slate-800 hover:shadow-2xl transition-all duration-200">
                  <div className="absolute -top-5 -left-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full w-10 h-10 flex items-center justify-center shadow-md">
                    <span className="text-white text-xl font-bold">6</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-2 mt-2 text-blue-700 dark:text-blue-300">Do you provide training for my staff?</h3>
                  <p className="text-base text-slate-600 dark:text-slate-300">
                    Yes, we provide comprehensive training sessions for your team to ensure they can use MuscleCRM effectively.
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