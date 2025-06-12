import React from 'react';
import { format } from 'date-fns';
import { Edit, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Booking } from '@/services/BookingService';

interface BookingListProps {
  bookings: Booking[];
  isLoading: boolean;
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const BookingList: React.FC<BookingListProps> = ({
  bookings,
  isLoading,
  onEdit,
  onDelete,
  page,
  totalPages,
  onPageChange,
}) => {
  console.log('Bookings data:', bookings);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'no_show':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'class':
        return 'Class';
      case 'personal_training':
        return 'Personal Training';
      case 'equipment':
        return 'Equipment';
      default:
        return type;
    }
  };

  const getServiceProvided = (booking: Booking) => {
    if (!booking) return 'N/A';

    switch (booking.type) {
      case 'class':
        return typeof booking.classId === 'object' ? booking.classId.name : booking.className || 'N/A';
      case 'personal_training':
        return typeof booking.trainerId === 'object' ? booking.trainerId.name : booking.trainerName || 'N/A';
      case 'equipment':
        return typeof booking.equipmentId === 'object' ? booking.equipmentId.name : booking.equipmentName || 'N/A';
      default:
        return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service Provided</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking._id}>
                <TableCell>{getTypeLabel(booking.type)}</TableCell>
                <TableCell>{booking.customerId?.name || 'N/A'}</TableCell>
                <TableCell>
                  {getServiceProvided(booking)}
                </TableCell>
                <TableCell>
                  {format(new Date(booking.startTime), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>
                  {format(new Date(booking.startTime), 'hh:mm a')} -{' '}
                  {format(new Date(booking.endTime), 'hh:mm a')}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(booking)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(booking._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default BookingList; 