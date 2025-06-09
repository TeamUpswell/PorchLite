"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import { debugLog } from "@/lib/utils/debug";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import Calendar from "./components/Calendar";

export default function ReservationCalendarPage() {
  const { user, loading } = useAuth();
  const [newReservationTrigger, setNewReservationTrigger] = useState(0);

  useEffect(() => {
    debugLog("📅 Calendar page component mounted");
    return () => {
      debugLog("📅 Calendar page unmounted");
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedPageWrapper>
      <Calendar
        newReservationTrigger={newReservationTrigger}
        isManager={true}
      />
    </ProtectedPageWrapper>
  );
}
