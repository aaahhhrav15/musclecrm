import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '@/config';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

interface Booking {
  _id: string;
  type: 'class' | 'personal_training' | 'equipment';
  customerId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  classId?: {
    _id: string;
    name: string;
  };
  trainerId?: {
    _id: string;
    name: string;
  };
  equipmentId?: {
    _id: string;
    name: string;
  };
  price: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

const ViewBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const response = await axios.get(`${API_URL}/bookings/${id}`, {
        withCredentials: true,
      });
      setBooking(response.data.booking);
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('Failed to load booking details');
      navigate('/dashboard/bookings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <p className="text-red-600">Booking not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/dashboard/bookings')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getServiceDetails = () => {
    switch (booking.type) {
      case 'class':
        return {
          label: 'Class',
          value: booking.classId?.name || 'N/A'
        };
      case 'personal_training':
        return {
          label: 'Trainer',
          value: booking.trainerId?.name || 'N/A'
        };
      case 'equipment':
        return {
          label: 'Equipment',
          value: booking.equipmentId?.name || 'N/A'
        };
      default:
        return {
          label: 'Service',
          value: 'N/A'
        };
    }
  };

  const serviceDetails = getServiceDetails();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/bookings')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Button>
            <h1 className="text-2xl font-bold">Booking Details</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/bookings/edit/${booking._id}`)}
          >
            Edit Booking
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Booking Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Customer</p>
                <p className="mt-1">{booking.customerId.name}</p>
                <p className="text-sm text-gray-500">{booking.customerId.email}</p>
                <p className="text-sm text-gray-500">{booking.customerId.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Booking Type</p>
                <p className="mt-1 capitalize">{booking.type.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{serviceDetails.label}</p>
                <p className="mt-1">{serviceDetails.value}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      booking.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : booking.status === 'no_show'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {booking.status}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Start Time</p>
                <p className="mt-1">{format(new Date(booking.startTime), 'MMM d, yyyy h:mm a')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">End Time</p>
                <p className="mt-1">{format(new Date(booking.endTime), 'MMM d, yyyy h:mm a')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Price</p>
                <p className="mt-1">{formatCurrency(booking.price, booking.currency)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Created At</p>
                <p className="mt-1">{format(new Date(booking.createdAt), 'MMM d, yyyy h:mm a')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="mt-1">{format(new Date(booking.updatedAt), 'MMM d, yyyy h:mm a')}</p>
              </div>
            </div>

            {booking.notes && (
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-500">Notes</p>
                <p className="mt-1 whitespace-pre-wrap">{booking.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ViewBookingPage; 