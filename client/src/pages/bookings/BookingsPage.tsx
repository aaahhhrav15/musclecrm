import * as React from "react";
import { useState, useEffect, useMemo } from "react";
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
  Search,
  ChevronLeft,
  ChevronRight
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
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState<BookingFilters>({
    page: 1,
    limit: 10000, // Fetch all bookings
  });

  const navigate = useNavigate();

  // Fetch all bookings once using React Query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const response = await BookingService.getBookings({
        page: 1,
        limit: 10000 // Large enough to get all bookings
      });
      return response.bookings || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Update allBookings when data changes
  useEffect(() => {
    if (data) {
      setAllBookings(data);
    }
  }, [data]);

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

  // Calculate metrics from all bookings
  const metrics = useMemo(() => {
    if (!allBookings.length) {
      return {
        totalBookings: 0,
        completedBookings: 0,
        upcomingBookings: 0,
        totalRevenue: 0,
        averageBookingValue: 0
      };
    }

    const completedBookings = allBookings.filter(b => b.status === 'completed').length;
    const upcomingBookings = allBookings.filter(b => b.status === 'scheduled').length;
    const totalRevenue = allBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.price || 0), 0);
    const averageBookingValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;

    return {
      totalBookings: allBookings.length,
      completedBookings,
      upcomingBookings,
      totalRevenue,
      averageBookingValue
    };
  }, [allBookings]);

  // Client-side filtering
  const filteredBookings = useMemo(() => {
    if (!allBookings.length) return [];

    return allBookings.filter(booking => {
      const matchesSearch = searchQuery === '' || 
        (typeof booking.customerId === 'object' && booking.customerId?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        booking.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (booking.className && booking.className.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (booking.trainerName && booking.trainerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (booking.equipmentName && booking.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [allBookings, searchQuery]);

  // Pagination calculations
  const totalBookings = filteredBookings.length;
  const totalPages = Math.ceil(totalBookings / rowsPerPage);
  const startItem = (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalBookings);
  
  // Get current page data
  const currentPageBookings = filteredBookings.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Generate page numbers for pagination
  const getPageNumbers = useMemo(() => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [totalPages, currentPage]);

  const handleFilterChange = (newFilters: Partial<BookingFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleCreateBooking = async (data: CreateBookingData) => {
    try {
      const response = await BookingService.createBooking(data);
      if (response.success) {
        await refetch();
        setShowBookingForm(false);
        toast.success("Booking created successfully!");
      } else {
        toast.error(response.message || "Failed to create booking");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Failed to create booking");
    }
  };

  const handleUpdateBooking = async (data: UpdateBookingData) => {
    if (!selectedBooking) return;

    try {
      const response = await BookingService.updateBooking(selectedBooking._id, data);
      if (response.success) {
        await refetch();
        setShowBookingForm(false);
        setSelectedBooking(null);
        toast.success("Booking updated successfully!");
      } else {
        toast.error(response.message || "Failed to update booking");
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking");
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      const response = await BookingService.deleteBooking(bookingId);
      if (response.success) {
        await refetch();
        toast.success("Booking deleted successfully!");
      } else {
        toast.error(response.message || "Failed to delete booking");
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Failed to delete booking");
    }
  };

  const handleStatusChange = async (
    bookingId: string,
    status: "scheduled" | "completed" | "cancelled" | "no_show"
  ) => {
    try {
      const response = await BookingService.updateBooking(bookingId, { status });
      if (response.success) {
        await refetch();
        toast.success("Booking status updated successfully!");
      } else {
        toast.error(response.message || "Failed to update booking status");
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error("Failed to update booking status");
    }
  };

  const exportToCSV = () => {
    if (!filteredBookings.length) {
      toast.error("No booking data to export");
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
        "Currency": booking.currency || 'INR',
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
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowBookingForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Bookings
              </CardTitle>
              <CalendarCheck className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">
                {metrics.totalBookings}
              </div>
              <p className="text-xs text-muted-foreground">
                All time bookings
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
              <Users className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">
                {metrics.completedBookings}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully completed
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Upcoming
              </CardTitle>
              <Clock className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-700">
                {metrics.upcomingBookings}
              </div>
              <p className="text-xs text-muted-foreground">
                Scheduled bookings
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">
                {formatCurrency(metrics.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                From completed bookings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {filteredBookings.length} bookings
            </Badge>
            <Button variant="outline" onClick={() => setShowFilterModal(true)}>
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="space-y-4">
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">Booking Directory</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Showing {startItem}-{endItem} of {totalBookings}
                  </span>
                  <Select
                    value={rowsPerPage.toString()}
                    onValueChange={(value) => {
                      setRowsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
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
                    {currentPageBookings.map((booking, index) => (
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
                                  {booking.status === "no_show"
                                    ? "No Show"
                                    : booking.status.charAt(0).toUpperCase() +
                                      booking.status.slice(1)}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="no_show">No Show</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
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
                    {(!currentPageBookings || currentPageBookings.length === 0) && (
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {startItem} to {endItem} of {totalBookings} bookings
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {getPageNumbers.map((page, index) => (
                    <React.Fragment key={index}>
                      {page === '...' ? (
                        <span className="px-2 py-1 text-muted-foreground">...</span>
                      ) : (
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page as number)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              booking and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (bookingToDelete) {
                  handleDeleteBooking(bookingToDelete._id);
                  setShowDeleteDialog(false);
                  setBookingToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default BookingsPage;