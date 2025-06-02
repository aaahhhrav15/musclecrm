import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Settings, Trash } from 'lucide-react';
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

// Mock data for notifications
const notifications = [
  { 
    id: 1, 
    type: 'booking', 
    title: 'New booking',
    message: 'Alice Johnson has booked a session for tomorrow at 10:00 AM.',
    time: '10 minutes ago',
    read: false
  },
  { 
    id: 2, 
    type: 'payment', 
    title: 'Payment received',
    message: 'Payment of $150.00 has been received from Bob Smith.',
    time: '1 hour ago',
    read: false
  },
  { 
    id: 3, 
    type: 'system', 
    title: 'System update',
    message: 'FlexCRM will undergo maintenance on May 25th from 2:00 AM to 4:00 AM.',
    time: '5 hours ago',
    read: true
  },
  { 
    id: 4, 
    type: 'customer', 
    title: 'New customer',
    message: 'Carol Davis has created an account.',
    time: '1 day ago',
    read: true
  },
  { 
    id: 5, 
    type: 'booking', 
    title: 'Booking canceled',
    message: 'David Wilson has canceled their appointment for May 22nd.',
    time: '2 days ago',
    read: true
  },
];

const NotificationsPage: React.FC = () => {
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
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with system alerts and customer activities.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Check className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Card>
              <CardContent className="p-4 space-y-4">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`flex items-start p-3 rounded-lg ${
                      notification.read ? 'bg-background' : 'bg-primary/5'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      notification.type === 'booking' 
                        ? 'bg-blue-100 text-blue-700' 
                        : notification.type === 'payment' 
                        ? 'bg-green-100 text-green-700'
                        : notification.type === 'system'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <h4 className={`text-sm font-medium ${!notification.read && 'font-semibold'}`}>
                          {notification.title}
                        </h4>
                        <span className="text-xs text-muted-foreground">{notification.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="ml-2">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="unread">
            <Card>
              <CardContent className="p-4 space-y-4">
                {notifications.filter(n => !n.read).map((notification) => (
                  <div 
                    key={notification.id}
                    className="flex items-start p-3 rounded-lg bg-primary/5"
                  >
                    <div className={`p-2 rounded-full ${
                      notification.type === 'booking' 
                        ? 'bg-blue-100 text-blue-700' 
                        : notification.type === 'payment' 
                        ? 'bg-green-100 text-green-700'
                        : notification.type === 'system'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <h4 className="text-sm font-semibold">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-muted-foreground">{notification.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="ml-2">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Other tab contents would follow the same pattern */}
          {['bookings', 'payments', 'system'].map(tab => (
            <TabsContent key={tab} value={tab}>
              <Card>
                <CardContent className="p-4 space-y-4">
                  {notifications.filter(n => n.type === tab.slice(0, -1)).map((notification) => (
                    <div 
                      key={notification.id}
                      className={`flex items-start p-3 rounded-lg ${
                        notification.read ? 'bg-background' : 'bg-primary/5'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${
                        notification.type === 'booking' 
                          ? 'bg-blue-100 text-blue-700' 
                          : notification.type === 'payment' 
                          ? 'bg-green-100 text-green-700'
                          : notification.type === 'system'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        <Bell className="h-4 w-4" />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          <h4 className={`text-sm font-medium ${!notification.read && 'font-semibold'}`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-muted-foreground">{notification.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="ml-2">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
