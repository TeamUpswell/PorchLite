"use client";

import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";
import { useState, useEffect } from "react";
import {
  CalendarIcon,
  PlusIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import styles from "./CalendarView.module.css";

// Create localizer for the calendar
const localizer = momentLocalizer(moment);

// Define types for the components
export interface Reservation {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  description?: string;
  user_id?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Reservation;
}

interface CalendarViewProps {
  reservations: Reservation[];
  onSelectEvent: (reservation: Reservation) => void;
}

export default function CalendarView({
  reservations,
  onSelectEvent,
}: CalendarViewProps) {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Transform reservations to calendar events whenever reservations change
  useEffect(() => {
    try {
      // Safety check for empty or undefined reservations
      if (!reservations || reservations.length === 0) {
        setCalendarEvents([]);
        return;
      }

      // Transform reservations data for the calendar with robust date parsing
      const events = reservations.map((reservation) => {
        // Safely parse dates with fallbacks
        let startDate, endDate;

        try {
          startDate = new Date(reservation.start_date);
          // If invalid date, throw error to trigger fallback
          if (isNaN(startDate.getTime())) throw new Error("Invalid start date");
        } catch (e) {
          console.warn(
            `Invalid start date format for reservation ${reservation.id}`,
            e
          );
          startDate = new Date(); // Fallback to today
        }

        try {
          endDate = new Date(reservation.end_date);
          // If invalid date, throw error to trigger fallback
          if (isNaN(endDate.getTime())) throw new Error("Invalid end date");
        } catch (e) {
          console.warn(
            `Invalid end date format for reservation ${reservation.id}`,
            e
          );
          // Fallback: start date + 1 day
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1);
        }

        // Create calendar event with safely parsed dates
        return {
          id: reservation.id,
          title: reservation.title || "Untitled Reservation",
          start: startDate,
          end: endDate,
          resource: reservation,
        };
      });

      setCalendarEvents(events);
    } catch (error: any) {
      console.error("Error transforming reservations:", error);
      setError(error.message || "Error preparing calendar events");
    }
  }, [reservations]);

  // Custom calendar toolbar with refresh button
  const CustomToolbar = (toolbar: any) => {
    const goToToday = () => {
      toolbar.onNavigate("TODAY");
    };

    return (
      <div className="flex justify-between items-center mb-4 p-2 bg-white rounded-lg shadow-sm">
        <div>
          <button
            className="px-3 py-1 mr-2 bg-white border border-gray-300 rounded-md text-sm"
            onClick={() => toolbar.onNavigate("PREV")}
          >
            Previous
          </button>
          <button
            className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm"
            onClick={() => toolbar.onNavigate("NEXT")}
          >
            Next
          </button>
        </div>

        <h3 className="text-lg font-semibold">{toolbar.label}</h3>

        <div>
          <button
            className="px-3 py-1 mr-2 bg-white border border-gray-300 rounded-md text-sm"
            onClick={goToToday}
          >
            Today
          </button>
          <button
            className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-md text-sm flex items-center"
            onClick={() => window.location.reload()}
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>
    );
  };

  // Custom event component for better styling
  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <div className="p-1 overflow-hidden text-sm">
      <div className="font-medium truncate">{event.title}</div>
    </div>
  );

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded flex items-center">
        <span className="mr-2">⚠️</span>
        Error loading calendar: {error}
        <button
          className="ml-auto px-3 py-1 bg-red-100 rounded-md text-xs"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className={styles.calendarWrapper}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          className={styles.calendarContainer}
          selectable={true}
          onSelectEvent={(event) => onSelectEvent(event.resource)}
          views={["month", "week", "day", "agenda"]}
          defaultView="month"
          components={{
            toolbar: CustomToolbar,
            event: EventComponent as any,
          }}
          eventPropGetter={() => ({
            className: styles.eventStyle,
          })}
          dayPropGetter={(date) => {
            const today = new Date();
            const isToday =
              date.getDate() === today.getDate() &&
              date.getMonth() === today.getMonth() &&
              date.getFullYear() === today.getFullYear();

            if (isToday) {
              return { className: styles.todayCell };
            }
            return {};
          }}
        />
      </div>
    </div>
  );
}
