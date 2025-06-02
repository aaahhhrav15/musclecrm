
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Filter } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';

// Mock data for bookings
const bookings = [
  { id: 1, customer: 'Alice Johnson', service: 'Consultation', time: '09:00 AM', duration: '30 mins', date: '2025-05-20' },
  { id: 2, customer: 'Bob Smith', service: 'Training Session', time: '10:00 AM', duration: '45 mins', date: '2025-05-20' },
  { id: 3, customer: 'Carol Davis', service: 'Massage', time: '11:30 AM', duration: '60 mins', date: '2025-05-20' },
  { id: 4, customer: 'David Wilson', service: 'Room Service', time: '02:00 PM', duration: '15 mins', date: '2025-05-20' },
  { id: 5, customer: 'Eve Brown', service: 'Event Planning', time: '03:30 PM', duration: '45 mins', date: '2025-05-20' },
];

const timeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
];

const BookingsPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState('May 20, 2025');
  
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
            <p className="text-muted-foreground">
              Manage your appointments and schedule.
            </p>
          </div>
          <Button>
            <Calendar className="mr-2 h-4 w-4" /> New Booking
          </Button>
        </div>

        <Tabs defaultValue="day" className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">{currentDate}</span>
              <Button variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
          
          <TabsContent value="day" className="mt-0">
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-[100px_1fr] gap-4">
                  <div className="space-y-6">
                    {timeSlots.map((time, index) => (
                      <div key={index} className="text-sm text-muted-foreground pt-6">
                        {time}
                      </div>
                    ))}
                  </div>
                  <div className="relative">
                    {bookings.map((booking) => {
                      // Calculate position based on time (just for demo)
                      const hour = parseInt(booking.time.split(':')[0]);
                      const isPM = booking.time.includes('PM');
                      const adjustedHour = isPM && hour !== 12 ? hour + 12 : hour;
                      const top = (adjustedHour - 9) * 60 + 'px';
                      const durationMins = parseInt(booking.duration.split(' ')[0]);
                      const height = durationMins + 'px';
                      
                      return (
                        <div 
                          key={booking.id}
                          className="absolute left-0 right-2 p-2 rounded-md bg-primary/10 border border-primary/20"
                          style={{ 
                            top, 
                            height, 
                            minHeight: '30px'
                          }}
                        >
                          <div className="text-sm font-medium">{booking.customer}</div>
                          <div className="text-xs text-muted-foreground">{booking.service} · {booking.time}</div>
                        </div>
                      );
                    })}
                    
                    {/* Time indicator lines */}
                    {timeSlots.map((_, index) => (
                      <div 
                        key={index}
                        className="absolute left-0 right-0 border-t border-border"
                        style={{ top: `${index * 60}px` }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="week">
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground py-8">
                  Week view will display a 7-day calendar with all appointments.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="month">
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground py-8">
                  Month view will display a full month calendar with all appointments.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default BookingsPage;
