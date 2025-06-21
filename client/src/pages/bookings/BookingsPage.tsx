import * as React from "react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Download,
  CalendarCheck,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Eye,
  Pencil,
  Trash2,
  Dumbbell,
  GraduationCap,
  Wrench,
  Search
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import BookingService, {
  Booking,
  BookingFilters,
  CreateBookingData,
  UpdateBookingData,
} from "@/services/BookingService";
import BookingForm from "@/components/bookings/BookingForm";
import FilterModal from "@/components/bookings/FilterModal";
import { toast } from "sonner";
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
import { formatCurrency } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import * as Papa from 'papaparse';

const BookingsPage: React.FC = () => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<BookingFilters>({
    page: 1,
    limit: 10,
  });

  const navigate = useNavigate();

  // Fetch bookings
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["bookings", filters],
    queryFn: () => BookingService.getBookings(filters),
  });

  // Fetch calendar data
  const { data: calendarData } = useQuery({
    queryKey: ["calendar", filters.startDate, filters.endDate, filters.type],
    queryFn: () =>
      BookingService.getCalendarData(
        filters.startDate || format(new Date(), "yyyy-MM-dd"),
        filters.endDate ||
          format(
            new Date(new Date().setMonth(new Date().getMonth() + 1)),
            "yyyy-MM-dd"
          ),
        filters.type
      ),
  });

  // Calculate booking insights
  const bookingInsights = React.useMemo(() => {
    if (!data?.bookings) return {
      totalBookings: 0,
      scheduledBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      totalRevenue: 0,
      todayBookings: 0,
      classBookings: 0,
      personalTrainingBookings: 0,
      equipmentBookings: 0
    };

    const bookings = data.bookings;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    return {
      totalBookings: bookings.length,
      scheduledBookings: bookings.filter(b => b.status === 'scheduled').length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled' || b.status === 'no_show').length,
      totalRevenue: bookings.reduce((sum, b) => sum + (b.price || 0), 0),
      todayBookings: bookings.filter(b => 
        new Date(b.startTime).toISOString().split('T')[0] === todayStr
      ).length,
      classBookings: bookings.filter(b => b.type === 'class').length,
      personalTrainingBookings: bookings.filter(b => b.type === 'personal_training').length,
      equipmentBookings: bookings.filter(b => b.type === 'equipment').length
    };
  }, [data?.bookings]);

  // Filter bookings based on search query
  const filteredBookings = data?.bookings.filter(booking => {
    const query = searchQuery.toLowerCase();
    const customerName = typeof booking.customerId === 'object' 
      ? booking.customerId?.name?.toLowerCase() || '' 
      : '';
    const serviceName = (
      booking.className || 
      booking.trainerName || 
      booking.equipmentName || 
      ''
    ).toLowerCase();
    
    return (
      customerName.includes(query) ||
      booking.type.toLowerCase().includes(query) ||
      serviceName.includes(query)
    );
  }) || [];

  const handleFilterChange = (newFilters: BookingFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
    setShowFilterModal(false);
  };

  const handleCreateBooking = async (
    bookingData: CreateBookingData
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      console.log("Creating booking with data:", bookingData);
      const response = await BookingService.createBooking(bookingData);
      console.log("Booking creation response:", response);

      if (response.success) {
        setShowBookingForm(false);
        await refetch(); // Wait for the refetch to complete
        toast.success(response.message || "Booking created successfully");
        return { success: true, message: response.message };
      } else {
        toast.error(response.message || "Failed to create booking");
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create booking";
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleUpdateBooking = async (
    bookingData: UpdateBookingData
  ): Promise<{ success: boolean; message?: string }> => {
    if (!selectedBooking?._id) {
      const message = "No booking selected for update";
      toast.error(message);
      return { success: false, message };
    }

    try {
      const response = await BookingService.updateBooking(
        selectedBooking._id,
        bookingData
      );
      setSelectedBooking(null);
      setShowBookingForm(false);
      refetch();
      toast.success("Booking updated successfully");
      return { success: true, message: "Booking updated successfully" };
    } catch (error) {
      console.error("Error updating booking:", error);
      const message = "Failed to update booking";
      toast.error(message);
      return { success: false, message };
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!bookingId) {
      toast.error("Invalid booking selected for deletion");
      return;
    }
    const booking = data?.bookings.find((b) => b._id === bookingId);
    if (!booking) {
      toast.error("Booking not found");
      return;
    }
    setBookingToDelete(booking);
    setShowDeleteDialog(true);
  };

  const confirmDeleteBooking = async () => {
    if (!bookingToDelete?._id) {
      toast.error("Invalid booking selected for deletion");
      return;
    }

    try {
      await BookingService.deleteBooking(bookingToDelete._id);
      refetch();
      toast.success("Booking deleted successfully");
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Failed to delete booking");
    } finally {
      setShowDeleteDialog(false);
      setBookingToDelete(null);
    }
  };

  const handleStatusChange = async (
    bookingId: string,
    newStatus: "scheduled" | "completed" | "cancelled" | "no_show"
  ) => {
    try {
      await BookingService.updateBooking(bookingId, { status: newStatus });
      toast.success("Booking status updated successfully");
      refetch();
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error("Failed to update booking status");
    }
  };

  const handleExport = () => {
    if (!filteredBookings || filteredBookings.length === 0) {
      toast("No data to export.");
      return;
    }

    const dataToExport = filteredBookings.map(booking => {
      const customer = typeof booking.customerId === 'object' 
        ? booking.customerId 
        : null;

      return {
        "Customer Name": customer?.name || 'N/A',
        "Customer Email": customer?.email || 'N/A',
        "Booking Type": booking.type.replace('_', ' '),
        "Service": booking.className || booking.trainerName || booking.equipmentName || 'N/A',
        "Date": format(new Date(booking.startTime), 'yyyy-MM-dd'),
        "Time": format(new Date(booking.startTime), 'HH:mm'),
        "Price": booking.price || 0,
        "Currency": booking.currency || 'USD',
        "Status": booking.status,
        "Duration": booking.duration || 'N/A',
        "Notes": booking.notes || ''
      };
    });

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `bookings-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Booking data exported successfully!");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-[500px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-8"
      >
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-4 border-b">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Booking Management
            </h1>
            <p className="text-muted-foreground text-lg">
              Schedule and manage gym bookings, classes, and training sessions.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowBookingForm(true)} size="lg" className="shadow-sm">
              <Plus className="mr-2 h-5 w-5" /> New Booking
            </Button>
            <Button variant="outline" size="lg" className="shadow-sm" onClick={handleExport}>
              <Download className="mr-2 h-5 w-5" /> Export Data
            </Button>
          </div>
        </div>

        {/* Insights Dashboard */}
        <div className="grid grid-cols-1 xl:grid-cols-6 gap-6">
          {/* Left Column - Main Metrics */}
          <div className="xl:col-span-4 space-y-6">
            {/* Primary Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <CalendarCheck className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{bookingInsights.totalBookings}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      All bookings
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{formatCurrency(bookingInsights.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">From bookings</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{bookingInsights.scheduledBookings}</div>
                    <p className="text-xs text-muted-foreground">Upcoming sessions</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Today's Bookings</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{bookingInsights.todayBookings}</div>
                    <p className="text-xs text-muted-foreground">Today's schedule</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Search Bar */}
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer name, service, or booking type..."
                  className="pl-10 h-11 shadow-sm border-muted-foreground/20 focus:ring-2 focus:ring-primary/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Booking Types & Status Breakdown */}
          <div className="xl:col-span-2 space-y-6">
            {/* Booking Types */}
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Booking Types
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-600/5">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Classes</span>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {bookingInsights.classBookings}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-green-600/5">
                    <div className="flex items-center space-x-2">
                      <Dumbbell className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Personal Training</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {bookingInsights.personalTrainingBookings}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-purple-600/5">
                    <div className="flex items-center space-x-2">
                      <Wrench className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">Equipment</span>
                    </div>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      {bookingInsights.equipmentBookings}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>


          </div>
        </div>

        {/* Table Section */}
        <div className="mt-8">
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">Booking Directory</CardTitle>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {filteredBookings?.length || 0} bookings
                  </Badge>
                  <Button variant="outline" onClick={() => setShowFilterModal(true)}>
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-muted/50">
                      <TableHead className="font-semibold">Customer</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Service Provided</TableHead>
                      <TableHead className="font-semibold">Date & Time</TableHead>
                      <TableHead className="font-semibold">Price</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking, index) => (
                      <motion.tr
                        key={booking._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {typeof booking.customerId === "string"
                            ? "Loading..."
                            : booking.customerId?.name || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {booking.type.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {booking.type === "class" && booking.className
                            ? booking.className
                            : booking.type === "personal_training" &&
                              booking.trainerName
                            ? booking.trainerName
                            : booking.type === "equipment" &&
                              booking.equipmentName
                            ? booking.equipmentName
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(
                            new Date(booking.startTime),
                            "MMM d, yyyy h:mm a"
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(booking.price, booking.currency)}
                        </TableCell>
                        <TableCell>
                          <Select
                            defaultValue={booking.status}
                            onValueChange={(value) =>
                              handleStatusChange(
                                booking._id,
                                value as
                                  | "scheduled"
                                  | "completed"
                                  | "cancelled"
                                  | "no_show"
                              )
                            }
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue>
                                <Badge
                                  variant={
                                    booking.status === "completed"
                                      ? "default"
                                      : booking.status === "cancelled"
                                      ? "destructive"
                                      : booking.status === "no_show"
                                      ? "secondary"
                                      : "outline"
                                  }
                                >
                                  {booking.status.charAt(0).toUpperCase() +
                                    booking.status.slice(1).replace("_", " ")}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">
                                Scheduled
                              </SelectItem>
                              <SelectItem value="completed">
                                Completed
                              </SelectItem>
                              <SelectItem value="cancelled">
                                Cancelled
                              </SelectItem>
                              <SelectItem value="no_show">No Show</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/dashboard/bookings/${booking._id}`)
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setShowBookingForm(true);
                                }}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Booking
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDeleteBooking(booking._id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Booking
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                    {(!filteredBookings || filteredBookings.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          <div className="flex flex-col items-center space-y-2">
                            <CalendarCheck className="h-12 w-12 text-muted-foreground/50" />
                            <div className="text-lg font-medium">No bookings found</div>
                            <p className="text-sm">Try adjusting your search or filter criteria</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Modals */}
      <FilterModal
        open={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {(showBookingForm || selectedBooking) && (
        <BookingForm
          open={true}
          onClose={() => {
            setShowBookingForm(false);
            setSelectedBooking(null);
          }}
          booking={selectedBooking}
          onSubmit={
            selectedBooking ? handleUpdateBooking : handleCreateBooking
          }
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              booking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBooking}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default BookingsPage;