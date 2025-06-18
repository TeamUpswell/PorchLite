import React from 'react';

interface CalendarEventProps {
  event: {
    id: string;
    title: string;
    start: Date;
    end: Date;
    type: 'reservation' | 'maintenance' | 'blocked';
  };
  onEdit: (event: any) => void;
  onDelete: (event: any) => void;
  isManager: boolean;
}

export default function CalendarEvent({ event, onEdit, onDelete, isManager }: CalendarEventProps) {
  const getEventColor = (type: string) => {
    switch (type) {
      case 'reservation': return 'bg-blue-500';
      case 'maintenance': return 'bg-orange-500';
      case 'blocked': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(event);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(event);
  };

  return (
    <div 
      className={`p-1 mb-1 rounded text-white text-xs cursor-pointer ${getEventColor(event.type)}`}
      onClick={handleClick}
    >
      <div className="font-medium truncate">{event.title}</div>
      <div className="text-xs opacity-75">
        {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      {isManager && (
        <button
          onClick={handleDelete}
          className="text-xs underline hover:no-underline"
        >
          Delete
        </button>
      )}
    </div>
  );
}