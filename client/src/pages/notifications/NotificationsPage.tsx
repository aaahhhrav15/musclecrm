import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import NotificationService, { Notification } from '@/services/NotificationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';

const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch notifications
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: NotificationService.getNotifications
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: NotificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: NotificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    }
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: NotificationService.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted');
    }
  });

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsReadMutation.mutateAsync(notification._id);
    }
    
    // Handle navigation based on notification type
    switch (notification.type) {
      case 'booking_created':
      case 'booking_updated':
      case 'booking_cancelled':
        navigate(`/dashboard/bookings/${notification.data.bookingId}`);
        break;
      case 'customer_created':
        navigate(`/dashboard/customers/${notification.data.customerId}`);
        break;
      case 'invoice_created':
      case 'invoice_paid':
        navigate(`/dashboard/invoices/${notification.data.invoiceId}`);
        break;
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();
  };

  const handleDeleteNotification = async (notificationId: string) => {
    await deleteNotificationMutation.mutateAsync(notificationId);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {data?.notifications.some((n: Notification) => !n.read) && (
            <Button onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>

            <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-4 p-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                  </div>
                ))}
                    </div>
              ) : data?.notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No notifications
                      </div>
              ) : (
                <div className="space-y-4">
                  {data?.notifications.map((notification: Notification) => (
                    <div 
                      key={notification._id}
                      className={`flex items-start space-x-4 p-4 rounded-lg cursor-pointer transition-colors ${
                        !notification.read ? 'bg-muted/50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium">{notification.title}</h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification._id);
                            }}
                          >
                            ×
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <span className="text-xs text-muted-foreground mt-2 block">
                          {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
                </CardContent>
              </Card>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
