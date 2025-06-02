import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, Filter, Plus } from 'lucide-react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BookingService, { Booking, BookingFilters } from '@/services/BookingService';
import BookingCalendar from '@/components/bookings/BookingCalendar';
import BookingList from '@/components/bookings/BookingList';
import BookingForm from '@/components/bookings/BookingForm';
import FilterModal from '@/components/bookings/FilterModal';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Badge,
  BadgeProps,
} from "@/components/ui/badge";
import {
  MoreHorizontal,
} from "lucide-react";

const BookingsPage: React.FC = () => {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [filters, setFilters] = useState<BookingFilters>({
    page: 1,
    limit: 10
  });

  // Fetch bookings
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bookings', filters],
    queryFn: () => BookingService.getBookings(filters)
  });

  // Fetch calendar data
  const { data: calendarData } = useQuery({
    queryKey: ['calendar', filters.startDate, filters.endDate, filters.type],
    queryFn: () => BookingService.getCalendarData(
      filters.startDate || format(new Date(), 'yyyy-MM-dd'),
      filters.endDate || format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
      filters.type
    ),
    enabled: view === 'calendar'
  });

  const handleFilterChange = (newFilters: BookingFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    setShowFilterModal(false);
  };

  const handleCreateBooking = async (bookingData: any) => {
    try {
      const response = await BookingService.createBooking(bookingData);
      if (response.success) {
        setShowBookingForm(false);
        refetch();
        toast.success('Booking created successfully');
      } else {
        toast.error(response.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create booking';
      toast.error(errorMessage);
    }
  };

  const handleUpdateBooking = async (bookingData: any) => {
    if (!selectedBooking?._id) {
      toast.error('No booking selected for update');
      return;
    }

    try {
      await BookingService.updateBooking(selectedBooking._id, bookingData);
      setSelectedBooking(null);
      setShowBookingForm(false);
      refetch();
      toast.success('Booking updated successfully');
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!bookingId) {
      toast.error('Invalid booking selected for deletion');
      return;
    }
    const booking = data?.bookings.find(b => b._id === bookingId);
    if (!booking) {
      toast.error('Booking not found');
      return;
    }
    setBookingToDelete(booking);
    setShowDeleteDialog(true);
  };

  const confirmDeleteBooking = async () => {
    if (!bookingToDelete?._id) {
      toast.error('Invalid booking selected for deletion');
      return;
    }

    try {
      await BookingService.deleteBooking(bookingToDelete._id);
      refetch();
      toast.success('Booking deleted successfully');
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Failed to delete booking');
    } finally {
      setShowDeleteDialog(false);
      setBookingToDelete(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Bookings</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowFilterModal(true)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button onClick={() => setShowBookingForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Booking
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
                <CardTitle>Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.bookings.map((booking) => (
                      <TableRow key={booking._id}>
                        <TableCell className="capitalize">{booking.type.replace('_', ' ')}</TableCell>
                        <TableCell>
                          {typeof booking.customerId === 'string'
                            ? 'Loading...'
                            : booking.customerId.name}
                        </TableCell>
                        <TableCell>
                          {format(new Date(booking.startTime), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(booking.endTime), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              booking.status === 'completed'
                                ? 'success'
                                : booking.status === 'cancelled'
                                ? 'destructive'
                                : booking.status === 'no_show'
                                ? 'warning'
                                : 'default'
                            }
                          >
                            {booking.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(booking.price, booking.currency || 'INR')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedBooking(booking)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteBooking(booking._id)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                  bookings={calendarData?.bookings || []}
                  onEventClick={setSelectedBooking}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Filter Modal */}
        <FilterModal
          open={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* Booking Form Modal */}
        {(showBookingForm || selectedBooking) && (
          <BookingForm
            open={true}
            onClose={() => {
              setShowBookingForm(false);
              setSelectedBooking(null);
            }}
            booking={selectedBooking}
            onSubmit={selectedBooking ? handleUpdateBooking : handleCreateBooking}
          />
        )}

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the booking.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteBooking}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default BookingsPage;
