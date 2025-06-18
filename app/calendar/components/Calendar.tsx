"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { toast } from "react-hot-toast"; // ← Changed from react-toastify
import { supabase } from "@/lib/supabase"; // ← Updated path to match your project structure
import { debugLog, debugError } from "@/lib/utils/debug";
import { useAuth } from "@/components/auth";

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
  isManager?: boolean; // Add this prop
}

export default function Calendar({
  newReservationTrigger = 0,
  isManager = false,
}: CalendarProps) {
  // ✅ ADD PERFORMANCE MONITORING
  useEffect(() => {
    const startTime = performance.now();
    debugLog("📅 Calendar component mounted");

    return () => {
      const endTime = performance.now();
      debugLog(
        "📅 Calendar component unmounted, render time:",
        `${(endTime - startTime).toFixed(2)}ms`
      );
    };
  }, []);

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
    debugLog("📅 Reservation selected:", reservation.title);
    setSelectedReservation(reservation);
    setShowReservationModal(true);

    if (reservation.id) {
      fetchCompanions(reservation.id);
    } else {
      clearCompanions();
    }
  };

  const handleSlotSelect = ({ start, end }: { start: Date; end: Date }) => {
    debugLog("📅 Time slot selected:", { start, end });
    setSelectedSlot({ start, end });
    setSelectedReservation(null);
    setShowReservationModal(true);
    clearCompanions();
  };

  const handleModalClose = () => {
    debugLog("📅 Reservation modal closed");
    setShowReservationModal(false);
    setSelectedReservation(null);
    setSelectedSlot(null);
    clearCompanions();
  };

  const handleReservationSaved = () => {
    debugLog("📅 Reservation saved, refreshing calendar data...");
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

  const handleSelectEvent = useCallback(
    (event: Reservation) => {
      console.log('[DEBUG] 📅 Big Calendar Event selected:', event);
      console.log('[DEBUG] 📅 Event ID:', event.id);
      console.log('[DEBUG] 📅 Event title:', event.title);
      console.log('[DEBUG] 📅 Is editing mode:', Boolean(event.id));
      
      // This event is already in the correct Reservation format
      setSelectedReservation(event);
      setSelectedSlot(null); // Clear selected slot when editing
      setShowReservationModal(true);
      
      if (event.id) {
        fetchCompanions(event.id);
      } else {
        clearCompanions();
      }
      
      console.log('[DEBUG] 📅 Modal should open for editing');
    },
    [fetchCompanions, clearCompanions]
  );

  const handleDeleteReservation = async (id: string) => {
    if (!isManager) {
      toast.error("You don't have permission to delete reservations");
      return;
    }

    const startTime = performance.now();
    debugLog("📅 Deleting reservation:", id);

    try {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      const endTime = performance.now();
      debugLog("📅 Reservation deleted successfully:", {
        id,
        deleteTime: `${(endTime - startTime).toFixed(2)}ms`,
      });

      toast.success("Reservation deleted successfully");
      fetchReservations();
    } catch (error) {
      debugError("📅 Error deleting reservation:", error);
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

  // Day reservations highlighting
  const dayPropGetter = useCallback(
    (date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const dayReservations = reservations.filter((reservation) => {
        const start = new Date(reservation.start_date);
        const end = new Date(reservation.end_date);
        return date >= start && date <= end;
      });

      if (dayReservations.length > 0) {
        return {
          className: "rbc-day-reserved",
          style: {
            backgroundColor: "#fef3c7", // Light yellow for reserved days
            border: "1px solid #f59e0b",
          },
        };
      }

      return {};
    },
    [reservations]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Custom toolbar component without view buttons
  const CustomToolbar = ({ label, onNavigate, onView }: any) => {
    return (
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        {/* Navigation buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate("PREV")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Previous"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={() => onNavigate("TODAY")}
            className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Today
          </button>

          <button
            onClick={() => onNavigate("NEXT")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Next"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Current date/period label */}
        <h2 className="text-lg font-semibold text-gray-900">{label}</h2>

        {/* Empty div to maintain flexbox spacing */}
        <div className="w-24"></div>
      </div>
    );
  };

  return (
    <div className="h-full">
      {/* Status Legend */}
      <StatusLegend />

      {/* Big Calendar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-[calc(100vh-140px)]">
        <BigCalendar
          localizer={localizer}
          events={reservations}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={isManager ? handleSlotSelect : undefined}
          selectable={isManager}
          views={["month"]} // Lock to month view only
          defaultView="month"
          view="month" // Force month view
          date={currentDate}
          onNavigate={setCurrentDate}
          eventPropGetter={eventStyleGetter}
          className={styles.calendar}
          components={{
            toolbar: CustomToolbar, // Use custom toolbar
            event: ({ event }) => (
              <div
                onContextMenu={(e) => handleEventRightClick(event, e)}
                className="cursor-pointer"
                title={isManager ? "Right-click to delete" : "View details"}
              >
                {event.title}
              </div>
            ),
          }}
          dayPropGetter={dayPropGetter}
          step={60}
          showMultiDayTimes
          popup
        />
      </div>

      {/* Reservation Modal */}
      {showReservationModal && (
        <ReservationModal
          isOpen={showReservationModal}
          onClose={handleModalClose}
          reservation={selectedReservation}
          selectedSlot={selectedSlot}
          onSave={handleReservationSaved}
          onDelete={isManager ? handleDeleteReservation : undefined}
          isManager={isManager}
        />
      )}

      {/* Floating Action Button */}
      {isManager && (
        <CreatePattern
          onClick={() =>
            handleSlotSelect({ start: new Date(), end: new Date() })
          }
          label="Add Booking"
        />
      )}
    </div>
  );
}
