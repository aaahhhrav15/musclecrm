import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

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

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  instructor?: string;
  capacity?: number;
  enrolled?: number;
  price?: string;
  status?: string;
}

interface BookingCalendarProps {
  bookings: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  bookings,
  onEventClick,
}) => {
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3b82f6'; // Default blue

    switch (event.status) {
      case 'completed':
        backgroundColor = '#22c55e'; // Green
        break;
      case 'cancelled':
        backgroundColor = '#ef4444'; // Red
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
        padding: '4px',
        height: '100%',
      },
    };
  };

  const CustomEvent = ({ event }: { event: CalendarEvent }) => {
    if (!event) return null;

    return (
      <div className="flex flex-col gap-1 h-full">
        <div className="font-semibold text-sm">{event.title || 'Unnamed Class'}</div>
        {event.instructor && event.instructor !== 'No Instructor' && (
          <div className="text-xs opacity-90">👤 {event.instructor}</div>
        )}
      </div>
    );
  };

  return (
    <div className="h-[600px]">
      <Calendar
        localizer={localizer}
        events={bookings}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={onEventClick}
        views={['month', 'week', 'day']}
        defaultView="week"
        popup
        selectable
        components={{
          event: CustomEvent,
        }}
        formats={{
          eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
            `${localizer.format(start, 'h:mm a', culture)} - ${localizer.format(end, 'h:mm a', culture)}`,
        }}
      />
    </div>
  );
};

export default BookingCalendar; 