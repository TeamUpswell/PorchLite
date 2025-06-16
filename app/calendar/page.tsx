// app/calendar/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { debugLog } from "@/lib/utils/debug";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import Calendar from "./components/Calendar";
import { Calendar as CalendarIcon } from "lucide-react";

export default function ReservationCalendarPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const [newReservationTrigger, setNewReservationTrigger] = useState(0);

  useEffect(() => {
    debugLog("📅 Calendar page component mounted");
    return () => {
      debugLog("📅 Calendar page unmounted");
    };
  }, []);

  // Loading state
  if (authLoading || propertyLoading) {
    return (
      <StandardPageLayout
        theme="dark"
        showHeader={false} // ✅ No page title section
        showSideNav={true}
      >
        <StandardCard>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading calendar...</p>
            </div>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  // No user state
  if (!user) {
    return (
      <StandardPageLayout
        theme="dark"
        showHeader={false} // ✅ No page title section
        showSideNav={true}
      >
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
      </StandardPageLayout>
    );
  }

  // ✅ Main calendar - no page title section, just StandardPageLayout header + sidebar
  return (
    <StandardPageLayout
      theme="dark"
      showHeader={false} // ✅ Remove the title/subtitle section entirely
      showSideNav={true}
    >
      <div className="space-y-6">
        <Calendar
          newReservationTrigger={newReservationTrigger}
          isManager={true}
        />
      </div>
    </StandardPageLayout>
  );
}
