import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/config';
import { ArrowLeft, Loader2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import BookingForm from '@/components/bookings/BookingForm';
import BookingService, { Booking } from '@/services/BookingService';

const ViewBookingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await axios.get(`${API_URL}/bookings/${id}`, {
          withCredentials: true
        });
        if (response.data.success) {
          setBooking(response.data.booking);
        } else {
          toast.error('Failed to fetch booking details');
          navigate('/bookings');
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
        toast.error('Failed to fetch booking details');
        navigate('/bookings');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBooking();
    }
  }, [id, navigate]);

  const handleUpdateBooking = async (data: any) => {
    try {
      const response = await BookingService.updateBooking(id!, data);
      if (response.success) {
        // Fetch the updated booking
        const updatedResponse = await axios.get(`${API_URL}/bookings/${id}`, {
          withCredentials: true
        });
        if (updatedResponse.data.success) {
          setBooking(updatedResponse.data.booking);
          setShowEditForm(false);
          toast.success('Booking updated successfully');
        } else {
          toast.error('Failed to fetch updated booking');
        }
      } else {
        toast.error(response.message || 'Failed to update booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p>Booking not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/bookings')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowEditForm(true)}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Booking
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Customer</h3>
                <p>{booking.customerId?.name || 'N/A'}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Booking Type</h3>
                <p className="capitalize">{booking.type.replace('_', ' ')}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Service</h3>
                <p>
                  {booking.type === 'class' && booking.className ? booking.className :
                   booking.type === 'personal_training' && booking.trainerName ? booking.trainerName :
                   booking.type === 'equipment' && booking.equipmentName ? booking.equipmentName :
                   'N/A'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Status</h3>
                <p className="capitalize">{booking.status.replace('_', ' ')}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Start Time</h3>
                <p>{format(new Date(booking.startTime), 'PPp')}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">End Time</h3>
                <p>{format(new Date(booking.endTime), 'PPp')}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Price</h3>
                <p>{formatCurrency(booking.price, booking.currency)}</p>
              </div>
              {booking.notes && (
                <div className="col-span-2">
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p>{booking.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {showEditForm && (
        <BookingForm
          open={showEditForm}
          onClose={() => setShowEditForm(false)}
          booking={booking}
          onSubmit={handleUpdateBooking}
        />
      )}
    </DashboardLayout>
  );
};

export default ViewBookingPage; 