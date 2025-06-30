// app/calendar/page.tsx - Final version
"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { debugLog } from "@/lib/utils/debug";
import StandardCard from "@/components/ui/StandardCard";
import Calendar from "./components/Calendar";
import { Calendar as CalendarIcon } from "lucide-react";

function CalendarPageContent() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();

  // Simplified state management
  const [refreshKey, setRefreshKey] = useState(0);

  // Refs to prevent excessive updates
  const lastRefreshRef = useRef(Date.now());
  const mountTimeRef = useRef(Date.now());
  const hasInitializedRef = useRef(false);
  const lastPropertyIdRef = useRef<string | null>(null);

  // Memoize loading state to prevent unnecessary re-renders
  const isLoading = useMemo(() => {
    return authLoading || propertyLoading;
  }, [authLoading, propertyLoading]);

  // Single initialization effect
  useEffect(() => {
    if (hasInitializedRef.current) return;

    debugLog("📅 Calendar page component mounted");
    mountTimeRef.current = Date.now();
    hasInitializedRef.current = true;

    return () => {
      debugLog("📅 Calendar page unmounted");
      hasInitializedRef.current = false;
    };
  }, []);

  // Throttled refresh function to prevent spam
  const refreshCalendar = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;

    // Prevent refreshes more than once every 5 seconds
    if (timeSinceLastRefresh < 5000) {
      console.log("🚫 Calendar refresh throttled");
      return;
    }

    lastRefreshRef.current = now;
    setRefreshKey((prev) => prev + 1);
    debugLog("🔄 Calendar refreshed");
  }, []);

  // Handle property changes (refresh calendar when property changes)
  useEffect(() => {
    if (!currentProperty?.id) {
      return;
    }

    // If property changed, refresh calendar (but throttled)
    if (
      lastPropertyIdRef.current &&
      lastPropertyIdRef.current !== currentProperty.id
    ) {
      console.log("🏠 Property changed, refreshing calendar");
      refreshCalendar();
    }

    lastPropertyIdRef.current = currentProperty.id;
  }, [currentProperty?.id, refreshCalendar]);

  // Simplified visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible";

      if (isVisible) {
        console.log("👁️ Calendar page became visible");

        // Only refresh if it's been hidden for more than 5 minutes
        const timeSinceMount = Date.now() - mountTimeRef.current;
        if (timeSinceMount > 300000) {
          // 5 minutes
          console.log("🔄 Calendar: Refreshing after long absence");

          // Call refresh directly instead of using the callback
          const now = Date.now();
          const timeSinceLastRefresh = now - lastRefreshRef.current;

          if (timeSinceLastRefresh >= 5000) {
            lastRefreshRef.current = now;
            setRefreshKey((prev) => prev + 1);
            debugLog("🔄 Calendar refreshed after visibility change");
          }
        }
      } else {
        console.log("👁️ Calendar page became hidden");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <StandardCard>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mr-3"></div>
          <span>Loading calendar...</span>
        </div>
      </StandardCard>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <StandardCard>
        <div className="text-center py-8">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Authentication Required
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Please sign in to view the calendar.
          </p>
        </div>
      </StandardCard>
    );
  }

  // Main content
  return (
    <div className="space-y-6">
      <Calendar
        newReservationTrigger={refreshKey}
        isManager={true}
      />
    </div>
  );
}

export default function CalendarPage() {
  return (
    <PageErrorBoundary>
      <CalendarPageContent />
    </PageErrorBoundary>
  );
}
