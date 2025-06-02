import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Booking } from '@/services/BookingService';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface BookingCalendarProps {
  bookings: Booking[];
  onEventClick: (booking: Booking) => void;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  bookings,
  onEventClick,
}) => {
  const events = bookings.map((booking) => ({
    id: booking._id,
    title: `${booking.customerId?.name || 'N/A'} - ${booking.type}`,
    start: new Date(booking.startTime),
    end: new Date(booking.endTime),
    resource: booking,
  }));

  const eventStyleGetter = (event: any) => {
    const booking = event.resource as Booking;
    let backgroundColor = '#3b82f6'; // Default blue

    switch (booking.status) {
      case 'completed':
        backgroundColor = '#22c55e'; // Green
        break;
      case 'cancelled':
        backgroundColor = '#ef4444'; // Red
        break;
      case 'no_show':
        backgroundColor = '#eab308'; // Yellow
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  return (
    <div className="h-[600px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(event) => onEventClick(event.resource)}
        views={['month', 'week', 'day']}
        defaultView="week"
        popup
        selectable
      />
    </div>
  );
};

export default BookingCalendar; 