import React from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'reservation' | 'maintenance' | 'blocked';
  description?: string;
  guests?: number;
  status?: 'confirmed' | 'pending' | 'cancelled' | 'requested';
}

interface CalendarGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventEdit: (event: CalendarEvent) => void;
  onEventDelete: (event: CalendarEvent) => void;
  isManager: boolean;
}

// Event component to isolate click handling
const EventItem = ({ 
  event, 
  onEventEdit 
}: { 
  event: CalendarEvent; 
  onEventEdit: (event: CalendarEvent) => void; 
}) => {
  const handleClick = (e: React.MouseEvent) => {
    console.log('🎯 EventItem: Click detected for:', event.title);
    e.stopPropagation();
    e.preventDefault();
    onEventEdit(event);
  };

  const getEventColor = () => {
    switch (event.status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'requested':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`text-xs p-1 rounded truncate cursor-pointer hover:shadow-sm transition-all border ${getEventColor()}`}
      title={`${event.title} - ${event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
    >
      <div className="font-medium truncate">{event.title}</div>
      {event.guests && (
        <div className="text-xs opacity-75">
          {event.guests} guest{event.guests > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default function CalendarGrid({
  currentDate,
  events,
  onDateClick,
  onEventEdit,
  onEventDelete,
  isManager,
}: CalendarGridProps) {
  console.log('📊 CalendarGrid: Rendered with', events.length, 'events');

  // Get calendar grid data
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    if (!date) return [];
    
    const dayEvents = events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      // Check if the date falls within the event range
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);
      
      return (eventStart <= dateEnd && eventEnd >= dateStart);
    });

    console.log(`📅 Events for ${date.toDateString()}:`, dayEvents.length);
    return dayEvents;
  };

  // Handle date click (for empty areas)
  const handleDateClick = (date: Date, e: React.MouseEvent) => {
    console.log('📅 CalendarGrid: Date area clicked:', date.toDateString());
    // Only trigger if clicking on the date area itself, not on an event
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.date-area')) {
      onDateClick(date);
    }
  };

  const days = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white">
      {/* Calendar Header */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((date, index) => {
          if (!date) {
            return <div key={index} className="h-32 border-r border-b border-gray-200 bg-gray-50"></div>;
          }

          const dayEvents = getEventsForDate(date);
          const isToday = new Date().toDateString() === date.toDateString();
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();

          return (
            <div
              key={date.toISOString()}
              className={`h-32 border-r border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors relative ${
                !isCurrentMonth ? 'bg-gray-50' : ''
              }`}
              onClick={(e) => handleDateClick(date, e)}
            >
              {/* Date Number - clickable area for new events */}
              <div className="p-2 date-area">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 text-sm ${
                    isToday
                      ? 'bg-blue-600 text-white rounded-full'
                      : isCurrentMonth
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>

              {/* Events Container */}
              <div className="px-1 space-y-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((event, eventIndex) => (
                  <EventItem
                    key={`${event.id}-${eventIndex}`}
                    event={event}
                    onEventEdit={onEventEdit}
                  />
                ))}
                
                {/* Show "more" indicator if there are additional events */}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 text-center py-1 pointer-events-none">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>

              {/* Empty space for date clicks */}
              <div className="absolute inset-0 date-area" style={{ zIndex: -1 }}></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}