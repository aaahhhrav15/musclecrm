import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import NotificationService, { Notification } from '@/services/NotificationService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from 'react-router-dom';

const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch notifications with real-time updates
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: NotificationService.getNotifications,
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
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

  // Handle new notifications
  useEffect(() => {
    if (data?.notifications) {
      const unreadCount = data.notifications.filter(n => !n.read).length;
      if (unreadCount > 0) {
        // Show toast for new notifications
        const latestNotification = data.notifications[0];
        if (!latestNotification.read) {
          toast.info(latestNotification.message, {
            description: format(new Date(latestNotification.createdAt), 'MMM d, h:mm a'),
            action: {
              label: 'View',
              onClick: () => handleNotificationClick(latestNotification)
            }
          });
        }
      }
    }
  }, [data?.notifications]);

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
    setOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotificationMutation.mutateAsync(notificationId);
  };

  const handleViewAllNotifications = () => {
    navigate('/dashboard/notifications');
    setOpen(false);
  };

  const unreadCount = data?.notifications.filter(n => !n.read).length || 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2">
          <h4 className="font-medium">Notifications</h4>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                Mark all as read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewAllNotifications}
              className="text-xs"
            >
              View all
            </Button>
          </div>
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : data?.notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            data?.notifications.map((notification: Notification) => (
              <DropdownMenuItem
                key={notification._id}
                className={`p-4 cursor-pointer ${!notification.read ? 'bg-muted/50' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-start justify-between">
                    <span className="font-medium">{notification.title}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => handleDeleteNotification(e, notification._id)}
                    >
                      ×
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell; 