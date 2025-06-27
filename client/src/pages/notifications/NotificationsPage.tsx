import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import NotificationService, { Notification } from '@/services/NotificationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useGym } from '@/context/GymContext';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, Clock, Trash2, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';

const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { gym } = useGym();
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [selectedNotification, setSelectedNotification] = React.useState<Notification | null>(null);
  const [form, setForm] = React.useState({ title: '', message: '', expiresAt: '' });
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState(false);

  // Fetch notifications
  const { data, isLoading, refetch } = useQuery<{ notifications: Notification[] }>({
    queryKey: gym ? ['gym-notifications', gym._id] : ['notifications'],
    queryFn: gym ? () => NotificationService.getGymNotifications(gym._id) : NotificationService.getNotifications
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: NotificationService.deleteNotification,
    onSuccess: () => {
      // Invalidate both regular and gym notifications queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (gym) {
        queryClient.invalidateQueries({ queryKey: ['gym-notifications', gym._id] });
      }
      toast.success('Notification deleted');
    }
  });

  // Update notification mutation
  const updateNotificationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title: string; message: string; expiresAt?: string } }) =>
      NotificationService.updateNotification(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (gym) {
        queryClient.invalidateQueries({ queryKey: ['gym-notifications', gym._id] });
      }
      toast.success('Notification updated');
      setEditDialogOpen(false);
      setSelectedNotification(null);
    }
  });

  const handleNotificationClick = async (notification: Notification) => {
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

  const handleDeleteNotification = async (notificationId: string) => {
    await deleteNotificationMutation.mutateAsync(notificationId);
  };

  const handleEditClick = (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    setSelectedNotification(notification);
    
    // Format the expiry date for datetime-local input (YYYY-MM-DDTHH:mm)
    let formattedExpiryDate = '';
    if (notification.expiresAt) {
      const date = new Date(notification.expiresAt);
      formattedExpiryDate = date.toISOString().slice(0, 16);
    }

    setForm({
      title: notification.title,
      message: notification.message,
      expiresAt: formattedExpiryDate
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNotification) return;
    setEditing(true);
    try {
      await updateNotificationMutation.mutateAsync({
        id: selectedNotification._id,
        data: {
          title: form.title,
          message: form.message,
          expiresAt: form.expiresAt ? new Date(form.expiresAt) : undefined
        }
      });
    } finally {
      setEditing(false);
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await NotificationService.createGymNotification({
        gymId: gym ? gym._id : undefined,
        title: form.title,
        message: form.message,
        type: 'broadcast',
        expiresAt: form.expiresAt ? new Date(form.expiresAt) : undefined,
        broadcast: true
      });
      toast.success('Notification sent successfully');
      setForm({ title: '', message: '', expiresAt: '' });
      setCreateDialogOpen(false);
      refetch();
    } catch (err) {
      toast.error('Failed to send notification');
    } finally {
      setCreating(false);
    }
  };

  // Group notifications by date
  const groupedNotifications = React.useMemo(() => {
    if (!data?.notifications) return {};
    return data.notifications.reduce((groups: Record<string, Notification[]>, notification) => {
      const date = format(new Date(notification.createdAt), 'MMM d, yyyy');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
      return groups;
    }, {});
  }, [data?.notifications]);

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground mt-2">Manage and send notifications to users</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Bell className="h-4 w-4 mr-2" />
                Send Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Send Notification</DialogTitle>
                <DialogDescription>Create and send a notification to users</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateNotification} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Title</label>
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Message</label>
                    <textarea
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Expiry (optional)</label>
                    <input
                      type="datetime-local"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={form.expiresAt}
                      onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Sending...' : 'Send Notification'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>View and manage your notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
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
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                Object.entries(groupedNotifications).map(([date, notifications]) => (
                  <div key={date} className="mb-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">{date}</h3>
                    <div className="space-y-4">
                      {notifications.map((notification: Notification) => (
                        <div
                          key={notification._id}
                          className="flex items-start space-x-4 p-4 rounded-lg border transition-colors hover:bg-muted/50 border-border"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h4 className="font-medium">{notification.title}</h4>
                                <p className="text-sm text-muted-foreground">{notification.message}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => handleEditClick(e, notification)}
                                >
                                  <Pencil className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNotification(notification._id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {format(new Date(notification.createdAt), 'h:mm a')}
                              </div>
                              {notification.expiresAt && (
                                <div className="flex items-center text-red-500">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Expires: {notification.expiresAt ? new Date(notification.expiresAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Notification</DialogTitle>
              <DialogDescription>Update the notification details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Title</label>
                  <input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Message</label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Expiry (optional)</label>
                  <input
                    type="datetime-local"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={form.expiresAt}
                    onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={editing}>
                  {editing ? 'Updating...' : 'Update Notification'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
