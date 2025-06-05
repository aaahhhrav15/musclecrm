import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, Filter, Plus, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/config';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import BookingCalendar from '@/components/bookings/BookingCalendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatISO } from 'date-fns';

interface ClassSchedule {
  _id: string;
  name: string;
  description: string;
  instructor: {
    _id: string;
    name: string;
  };
  startTime: string;
  endTime: string;
  capacity: number;
  enrolledCount: number;
  status: 'scheduled' | 'cancelled' | 'completed';
  price: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

const formatPrice = (price: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  } catch (error) {
    // Fallback formatting if currency code is invalid
    return `${currency} ${price}`;
  }
};

const ClassSchedulePage: React.FC = () => {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [filters, setFilters] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
    status: 'all'
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [trainers, setTrainers] = useState<{ _id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    instructor: '',
    startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endTime: format(new Date(new Date().setHours(new Date().getHours() + 1)), "yyyy-MM-dd'T'HH:mm"),
    capacity: 10,
    price: 0,
    currency: 'INR',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch class schedules
  const { data: schedules, isLoading, refetch } = useQuery({
    queryKey: ['classSchedules', filters],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/gym/class-schedules`, {
        params: filters,
        withCredentials: true
      });
      return response.data;
    }
  });

  // Fetch calendar data
  const { data: calendarData } = useQuery({
    queryKey: ['classCalendar', filters.startDate, filters.endDate],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/gym/class-schedules/calendar`, {
        params: {
          startDate: filters.startDate,
          endDate: filters.endDate
        },
        withCredentials: true
      });
      return response.data;
    },
    enabled: view === 'calendar'
  });

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      instructor: '',
      startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      endTime: format(new Date(new Date().setHours(new Date().getHours() + 1)), "yyyy-MM-dd'T'HH:mm"),
      capacity: 10,
      price: 0,
      currency: 'INR',
    });
  };

  // Fetch trainers for instructor dropdown
  React.useEffect(() => {
    if (showAddModal || showEditModal) {
      axios.get(`${API_URL}/trainers`, { withCredentials: true })
        .then(res => setTrainers(res.data.trainers || res.data))
        .catch(() => setTrainers([]));
    }
  }, [showAddModal, showEditModal]);

  const handleStatusChange = async (scheduleId: string, newStatus: 'scheduled' | 'cancelled' | 'completed') => {
    try {
      await axios.patch(
        `${API_URL}/gym/class-schedules/${scheduleId}`,
        { status: newStatus },
        { withCredentials: true }
      );
      toast.success('Class status updated successfully');
      refetch();
    } catch (error) {
      console.error('Error updating class status:', error);
      toast.error('Failed to update class status');
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const scheduleData = {
        ...form,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        capacity: Number(form.capacity),
        price: Number(form.price),
      };

      const response = await axios.post(
        `${API_URL}/gym/class-schedules`,
        scheduleData,
        { withCredentials: true }
      );

      if (response.data) {
        toast.success('Class created successfully');
        setShowAddModal(false);
        resetForm();
        refetch();
      }
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error('Failed to create class');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClass) return;
    
    setIsDeleting(true);
    try {
      await axios.delete(`${API_URL}/gym/class-schedules/${selectedClass._id}`, {
        withCredentials: true
      });
      toast.success('Class deleted successfully');
      setShowDeleteModal(false);
      refetch();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Failed to delete class');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    setIsUpdating(true);
    try {
      const scheduleData = {
        ...form,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        capacity: Number(form.capacity),
        price: Number(form.price),
      };

      await axios.patch(
        `${API_URL}/gym/class-schedules/${selectedClass._id}`,
        scheduleData,
        { withCredentials: true }
      );

      toast.success('Class updated successfully');
      setShowEditModal(false);
      refetch();
    } catch (error) {
      console.error('Error updating class:', error);
      toast.error('Failed to update class');
    } finally {
      setIsUpdating(false);
    }
  };

  // Update form when selected class changes
  React.useEffect(() => {
    if (selectedClass) {
      setForm({
        name: selectedClass.name,
        description: selectedClass.description,
        instructor: selectedClass.instructor._id,
        startTime: format(new Date(selectedClass.startTime), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(new Date(selectedClass.endTime), "yyyy-MM-dd'T'HH:mm"),
        capacity: selectedClass.capacity,
        price: selectedClass.price,
        currency: selectedClass.currency,
      });
    }
  }, [selectedClass]);

  const formatCalendarEvents = (schedules: ClassSchedule[]) => {
    if (!schedules) return [];
    
    return schedules.map(schedule => {
      // Ensure all required fields exist and have valid values
      const event = {
        id: schedule._id || '',
        title: schedule.name || 'Unnamed Class',
        start: new Date(schedule.startTime),
        end: new Date(schedule.endTime),
        instructor: schedule.instructor?.name || 'No Instructor',
        capacity: schedule.capacity || 0,
        enrolled: schedule.enrolledCount || 0,
        price: schedule.price ? formatPrice(schedule.price, schedule.currency) : 'Free',
        status: schedule.status || 'scheduled'
      };

      // Only include fields that have valid values
      return Object.fromEntries(
        Object.entries(event).filter(([_, value]) => value !== undefined && value !== null)
      );
    });
  };

  const handleEventClick = (event: any) => {
    const schedule = schedules?.find(s => s._id === event.id);
    if (schedule) {
      setSelectedClass(schedule);
      setShowViewModal(true);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Class Schedule</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => {/* TODO: Implement filter modal */}}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Class
            </Button>
          </div>
        </div>

        <Tabs value={view} onValueChange={(value) => setView(value as 'list' | 'calendar')}>
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Class Schedules</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Enrolled</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules?.map((schedule: ClassSchedule) => (
                      <TableRow key={schedule._id}>
                        <TableCell>{schedule.name}</TableCell>
                        <TableCell>{schedule.instructor.name}</TableCell>
                        <TableCell>
                          {format(new Date(schedule.startTime), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell>{schedule.capacity}</TableCell>
                        <TableCell>{schedule.enrolledCount}</TableCell>
                        <TableCell>
                          {formatPrice(schedule.price, schedule.currency)}
                        </TableCell>
                        <TableCell>
                          <Select
                            defaultValue={schedule.status}
                            onValueChange={(value) => handleStatusChange(schedule._id, value as 'scheduled' | 'cancelled' | 'completed')}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue>
                                <Badge
                                  variant={
                                    schedule.status === 'completed'
                                      ? 'default'
                                      : schedule.status === 'cancelled'
                                      ? 'destructive'
                                      : 'outline'
                                  }
                                >
                                  {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedClass(schedule);
                                setShowViewModal(true);
                              }}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedClass(schedule);
                                setShowEditModal(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedClass(schedule);
                                setShowDeleteModal(true);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <BookingCalendar
                  bookings={calendarData?.schedules ? formatCalendarEvents(calendarData.schedules) : []}
                  onEventClick={handleEventClick}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showAddModal} onOpenChange={(open) => {
          setShowAddModal(open);
          if (!open) resetForm();
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Class</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddClass} className="space-y-4">
              <div className="space-y-2">
                <Label>Class Name</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Instructor</Label>
                <Select
                  value={form.instructor}
                  onValueChange={(value) => setForm(f => ({ ...f, instructor: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainers.map(t => (
                      <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <div className="space-y-2 flex-1">
                  <Label>Start Time</Label>
                  <Input type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required />
                </div>
                <div className="space-y-2 flex-1">
                  <Label>End Time</Label>
                  <Input type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="space-y-2 flex-1">
                  <Label>Capacity</Label>
                  <Input type="number" min={1} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} required />
                </div>
                <div className="space-y-2 flex-1">
                  <Label>Price</Label>
                  <Input type="number" min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
                </div>
                <div className="space-y-2 flex-1">
                  <Label>Currency</Label>
                  <Select
                    value={form.currency}
                    onValueChange={(value) => setForm(f => ({ ...f, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="AED">AED (د.إ)</SelectItem>
                      <SelectItem value="SGD">SGD (S$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Class'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Class</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Are you sure you want to delete this class? This action cannot be undone.</p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Modal */}
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Class Details</DialogTitle>
            </DialogHeader>
            {selectedClass && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Class Name</Label>
                    <p className="text-sm mt-1">{selectedClass.name}</p>
                  </div>
                  <div>
                    <Label>Instructor</Label>
                    <p className="text-sm mt-1">{selectedClass.instructor.name}</p>
                  </div>
                  <div>
                    <Label>Start Time</Label>
                    <p className="text-sm mt-1">
                      {format(new Date(selectedClass.startTime), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <p className="text-sm mt-1">
                      {format(new Date(selectedClass.endTime), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div>
                    <Label>Capacity</Label>
                    <p className="text-sm mt-1">{selectedClass.capacity}</p>
                  </div>
                  <div>
                    <Label>Enrolled</Label>
                    <p className="text-sm mt-1">{selectedClass.enrolledCount}</p>
                  </div>
                  <div>
                    <Label>Price</Label>
                    <p className="text-sm mt-1">
                      {formatPrice(selectedClass.price, selectedClass.currency)}
                    </p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <p className="text-sm mt-1">
                      <Badge
                        variant={
                          selectedClass.status === 'completed'
                            ? 'default'
                            : selectedClass.status === 'cancelled'
                            ? 'destructive'
                            : 'outline'
                        }
                      >
                        {selectedClass.status.charAt(0).toUpperCase() + selectedClass.status.slice(1)}
                      </Badge>
                    </p>
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedClass.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Created At</Label>
                    <p className="text-sm mt-1">
                      {format(new Date(selectedClass.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div>
                    <Label>Last Updated</Label>
                    <p className="text-sm mt-1">
                      {format(new Date(selectedClass.updatedAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={showEditModal} onOpenChange={(open) => {
          setShowEditModal(open);
          if (!open) {
            setSelectedClass(null);
            resetForm();
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Class</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label>Class Name</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Instructor</Label>
                <Select
                  value={form.instructor}
                  onValueChange={(value) => setForm(f => ({ ...f, instructor: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainers.map(t => (
                      <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <div className="space-y-2 flex-1">
                  <Label>Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="space-y-2 flex-1">
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.capacity}
                    onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <Label>Currency</Label>
                  <Select
                    value={form.currency}
                    onValueChange={(value) => setForm(f => ({ ...f, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="AED">AED (د.إ)</SelectItem>
                      <SelectItem value="SGD">SGD (S$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update Class'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ClassSchedulePage; 