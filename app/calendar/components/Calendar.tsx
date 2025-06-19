"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";
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
  isManager?: boolean;
}

// Cache constants
const CALENDAR_CACHE_KEY = "porchlite_calendar_cache";
const CALENDAR_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function Calendar({
  newReservationTrigger = 0,
  isManager = false,
}: CalendarProps) {
  // Basic persistence state
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const dataBackupRef = useRef<Reservation[]>([]);

  const { user } = useAuth();

  // ✅ REDUCED: Only enable debug logs in development mode
  const isDebugEnabled = process.env.NODE_ENV === 'development';

  const {
    reservations,
    setReservations,
    isLoading,
    fetchReservations,
    deleteReservation: hookDeleteReservation,
  } = useReservations();

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

  // ✅ REMOVED: Performance monitoring - too verbose for production

  // ✅ SIMPLIFIED: Basic backup system
  const backupCalendarData = useCallback(() => {
    if (reservations && reservations.length > 0) {
      dataBackupRef.current = [...reservations];
      
      if (isDebugEnabled) {
        console.log("💾 Calendar data backed up");
      }
    }
  }, [reservations, isDebugEnabled]);

  // ✅ SIMPLIFIED: Cache loading with reduced logging
  const loadCachedCalendarData = useCallback(() => {
    try {
      // First try localStorage
      const cached = localStorage.getItem(CALENDAR_CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const cacheAge = Date.now() - parsedCache.timestamp;

        if (cacheAge < CALENDAR_CACHE_DURATION && parsedCache.reservations) {
          if (isDebugEnabled) {
            console.log("📦 Loading cached calendar data");
          }
          if (setReservations && typeof setReservations === "function") {
            setReservations(parsedCache.reservations);
            dataBackupRef.current = parsedCache.reservations;
            return true;
          }
        }
      }

      // Then try backup
      if (dataBackupRef.current.length > 0) {
        if (isDebugEnabled) {
          console.log("🔄 Using backup calendar data");
        }
        if (setReservations && typeof setReservations === "function") {
          setReservations(dataBackupRef.current);
          return true;
        }
      }

      return false;
    } catch (error) {
      if (isDebugEnabled) {
        console.error("❌ Error loading cached calendar data:", error);
      }
      // Clear bad cache
      try {
        localStorage.removeItem(CALENDAR_CACHE_KEY);
      } catch (e) {
        // Silent fail
      }
      return false;
    }
  }, [setReservations, isDebugEnabled]);

  // ✅ SIMPLIFIED: Cache saving
  const saveCacheCalendarData = useCallback(
    (data: Reservation[]) => {
      try {
        const cacheData = {
          reservations: data,
          timestamp: Date.now(),
          propertyId: user?.id || "unknown",
        };
        localStorage.setItem(CALENDAR_CACHE_KEY, JSON.stringify(cacheData));
        
        if (isDebugEnabled) {
          console.log("💾 Calendar data cached");
        }
      } catch (error) {
        if (isDebugEnabled) {
          console.error("❌ Error saving calendar cache:", error);
        }
      }
    },
    [user?.id, isDebugEnabled]
  );

  // ✅ SIMPLIFIED: Enhanced fetch with reduced logging
  const enhancedFetchReservations = useCallback(
    async (forceRefresh = false) => {
      // Try cache first unless forced refresh
      if (!forceRefresh && hasLoadedOnce && loadCachedCalendarData()) {
        return;
      }

      if (isDebugEnabled) {
        console.log("🔍 Fetching fresh calendar data");
      }

      try {
        await fetchReservations();
        setHasLoadedOnce(true);
        
        if (isDebugEnabled) {
          console.log("✅ Calendar data fetched successfully");
        }
      } catch (error) {
        console.error("❌ Error fetching calendar data:", error);
        // Try to use cached/backup data as fallback
        loadCachedCalendarData();
      }
    },
    [fetchReservations, hasLoadedOnce, loadCachedCalendarData, isDebugEnabled]
  );

  // ✅ SIMPLIFIED: Visibility handling with reduced logging
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible";
      setIsPageVisible(isVisible);

      if (isVisible && hasLoadedOnce) {
        if (isDebugEnabled) {
          console.log("👁️ Calendar became visible, checking data");
        }

        // Small delay to ensure component is ready
        setTimeout(() => {
          if (reservations.length === 0) {
            if (!loadCachedCalendarData()) {
              enhancedFetchReservations(true);
            }
          }
        }, 100);
      } else if (!isVisible && hasLoadedOnce) {
        backupCalendarData();
      }
    };

    const handleFocus = () => {
      if (hasLoadedOnce && reservations.length === 0 && !isLoading) {
        if (!loadCachedCalendarData()) {
          enhancedFetchReservations(true);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    // Backup periodically
    const backupInterval = setInterval(() => {
      if (isPageVisible && hasLoadedOnce && reservations.length > 0) {
        backupCalendarData();
      }
    }, 60000); // Every minute

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      clearInterval(backupInterval);
    };
  }, [
    hasLoadedOnce,
    isPageVisible,
    reservations.length,
    isLoading,
    loadCachedCalendarData,
    enhancedFetchReservations,
    backupCalendarData,
    isDebugEnabled,
  ]);

  // Initial data load
  useEffect(() => {
    enhancedFetchReservations();
  }, [enhancedFetchReservations]);

  // Cache when reservations change
  useEffect(() => {
    if (reservations.length > 0 && hasLoadedOnce) {
      saveCacheCalendarData(reservations);
      backupCalendarData();
    }
  }, [reservations, hasLoadedOnce, saveCacheCalendarData, backupCalendarData]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle new reservation trigger
  useEffect(() => {
    if (newReservationTrigger && newReservationTrigger > 0) {
      setSelectedReservation(null);
      setSelectedSlot({ start: new Date(), end: new Date() });
      setShowReservationModal(true);
      clearCompanions();
    }
  }, [newReservationTrigger, clearCompanions]);

  // ✅ SIMPLIFIED: Event handlers with reduced logging
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
    enhancedFetchReservations(true);
    handleModalClose();
  };

  const handleEventRightClick = (event: Reservation, e: React.MouseEvent) => {
    e.preventDefault();

    if (
      window.confirm(`Delete "${event.title}"? This action cannot be undone.`)
    ) {
      handleDeleteReservation(event.id);
    }
  };

  const handleSelectEvent = useCallback(
    (event: Reservation) => {
      setSelectedReservation(event);
      setSelectedSlot(null);
      setShowReservationModal(true);

      if (event.id) {
        fetchCompanions(event.id);
      } else {
        clearCompanions();
      }
    },
    [fetchCompanions, clearCompanions]
  );

  const handleDeleteReservation = async (id: string) => {
    if (!isManager) {
      toast.error("You don't have permission to delete reservations");
      return;
    }

    try {
      const result = await hookDeleteReservation(id);

      if (result.success) {
        if (isDebugEnabled) {
          console.log("📅 Reservation deleted successfully");
        }

        toast.success("Reservation deleted successfully");

        // Update cache and backup
        const updatedReservations = reservations.filter((r) => r.id !== id);
        saveCacheCalendarData(updatedReservations);
        dataBackupRef.current = updatedReservations;
      } else {
        throw result.error;
      }
    } catch (error) {
      console.error("❌ Error deleting reservation:", error);
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
      const dayReservations = reservations.filter((reservation) => {
        const start = new Date(reservation.start_date || reservation.start);
        const end = new Date(reservation.end_date || reservation.end);
        return date >= start && date <= end;
      });

      if (dayReservations.length > 0) {
        return {
          className: "rbc-day-reserved",
          style: {
            backgroundColor: "#fef3c7",
            border: "1px solid #f59e0b",
          },
        };
      }

      return {};
    },
    [reservations]
  );

  // Loading state
  if (isLoading && !hasLoadedOnce) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Loading calendar...</p>
          {dataBackupRef.current.length > 0 && (
            <button
              onClick={() => loadCachedCalendarData()}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Load backup data ({dataBackupRef.current.length} events)
            </button>
          )}
        </div>
      </div>
    );
  }

  // Custom toolbar component
  const CustomToolbar = ({ label, onNavigate }: any) => {
    return (
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
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

        <h2 className="text-lg font-semibold text-gray-900">{label}</h2>

        <div className="flex items-center space-x-2">
          {hasLoadedOnce && (
            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
              {reservations.length} events
            </span>
          )}
          <button
            onClick={() => enhancedFetchReservations(true)}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
            title="Refresh calendar data"
          >
            ↻
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full">
      <StatusLegend />

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
          views={["month"]}
          defaultView="month"
          view="month"
          date={currentDate}
          onNavigate={setCurrentDate}
          eventPropGetter={eventStyleGetter}
          className={styles.calendar}
          components={{
            toolbar: CustomToolbar,
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