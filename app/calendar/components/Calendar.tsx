"use client";

import { useState, useEffect } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { toast } from "react-hot-toast"; // ← Changed from react-toastify
import { supabase } from "@/lib/supabase"; // ← Updated path to match your project structure

// CSS imports
import "react-big-calendar/lib/css/react-big-calendar.css";
import styles from "../calendar.module.css";

// Custom hooks and components
import { useReservations } from "../hooks/useReservations";
import { useCompanions } from "../hooks/useCompanions";
import { StatusLegend } from "./StatusLegend";
import { ReservationModal } from "./ReservationModal/index";
import { CreatePattern } from "@/components/ui/FloatingActionPresets";

// Types and utils
import { Reservation } from "../types";
import { statusColors } from "../utils/constants";

// Date-fns setup
const locales = {
  "en-US": require("date-fns/locale/en-US"),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarProps {
  newReservationTrigger?: number;
}

export function Calendar({ newReservationTrigger }: CalendarProps) {
  const { reservations, isLoading, fetchReservations } = useReservations();
  const { clearCompanions, fetchCompanions } = useCompanions();

  // UI state
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<"month" | "week" | "day">(
    "month"
  );
  const [isMobile, setIsMobile] = useState(false);

  // Effects
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  useEffect(() => {
    if (newReservationTrigger && newReservationTrigger > 0) {
      setSelectedReservation(null);
      setSelectedSlot({ start: new Date(), end: new Date() });
      setShowReservationModal(true);
      clearCompanions();
    }
  }, [newReservationTrigger, clearCompanions]);

  // Event handlers
  const handleReservationSelect = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowReservationModal(true);
    if (reservation.id) {
      fetchCompanions(reservation.id);
    } else {
      clearCompanions();
    }
  };

  const handleSlotSelect = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end });
    setSelectedReservation(null);
    setShowReservationModal(true);
    clearCompanions();
  };

  const handleModalClose = () => {
    setShowReservationModal(false);
    setSelectedReservation(null);
    setSelectedSlot(null);
    clearCompanions();
  };

  const handleReservationSaved = () => {
    fetchReservations();
    handleModalClose();
  };

  const handleEventRightClick = (event: Reservation, e: React.MouseEvent) => {
    e.preventDefault();

    // Show context menu or immediately show delete confirmation
    if (
      window.confirm(`Delete "${event.title}"? This action cannot be undone.`)
    ) {
      handleDeleteReservation(event.id);
    }
  };

  const handleDeleteReservation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Reservation deleted successfully"); // ← Updated message
      fetchReservations(); // Refresh calendar
    } catch (error) {
      console.error("Error deleting reservation:", error);
      toast.error("Failed to delete reservation");
    }
  };

  // Event styling
  const eventStyleGetter = (event: Reservation) => {
    const backgroundColor =
      statusColors[event.status as keyof typeof statusColors] ||
      statusColors.default;

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 1,
        color: "white",
        border: "none",
        display: "block",
        fontWeight: "600",
        textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
        fontSize: "12px",
        padding: "2px 6px",
      },
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className={styles.calendarContainer}>
        {/* Status Legend */}
        <StatusLegend />

        {/* Calendar View */}
        <div className={styles.calendarView}>
          <div className={styles.calendarWrapper}>
            <BigCalendar
              localizer={localizer}
              events={reservations}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "calc(100vh - 200px)" }}
              onSelectEvent={handleReservationSelect}
              onSelectSlot={handleSlotSelect}
              selectable
              views={isMobile ? ["month"] : ["month", "week", "day"]}
              view={isMobile ? "month" : currentView}
              date={currentDate}
              onNavigate={setCurrentDate}
              onView={setCurrentView}
              defaultView="month"
              toolbar={true}
              eventPropGetter={eventStyleGetter}
              onDoubleClickEvent={handleReservationSelect}
              components={{
                event: ({ event }) => (
                  <div
                    onContextMenu={(e) => handleEventRightClick(event, e)}
                    className="cursor-pointer"
                    title="Right-click to delete" // ← Added helpful tooltip
                  >
                    {event.title}
                  </div>
                ),
              }}
              formats={{
                monthHeaderFormat: (date: Date) =>
                  isMobile
                    ? format(date, "MMM yyyy")
                    : format(date, "MMMM yyyy"),
                dayHeaderFormat: (date: Date) =>
                  isMobile
                    ? format(date, "EEE M/d")
                    : format(date, "EEEE, MMMM do"),
                dayRangeHeaderFormat: ({
                  start,
                  end,
                }: {
                  start: Date;
                  end: Date;
                }) =>
                  isMobile
                    ? `${format(start, "M/d")} - ${format(end, "M/d")}`
                    : `${format(start, "MMM d")} - ${format(
                        end,
                        "MMM d, yyyy"
                      )}`,
              }}
              showMultiDayTimes
              step={60}
              timeslots={1}
              dayLayoutAlgorithm="no-overlap"
            />
          </div>
        </div>

        {/* Floating Action Button */}
        <CreatePattern
          onClick={() =>
            handleSlotSelect({ start: new Date(), end: new Date() })
          }
          label="Add Booking"
        />

        {/* Reservation Modal */}
        {showReservationModal && (
          <ReservationModal
            selectedReservation={selectedReservation} // ← Change from "reservation" to "selectedReservation"
            selectedSlot={selectedSlot}
            onClose={handleModalClose}
            onSaved={handleReservationSaved}
            onDelete={handleDeleteReservation}
          />
        )}
      </div>
    </div>
  );
}
