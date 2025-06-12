"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import { debugLog } from "@/lib/utils/debug";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header";
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
      <ProtectedPageWrapper>
        <Header title="Reservations" />
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading calendar...</p>
            </div>
          </div>
        </PageContainer>
      </ProtectedPageWrapper>
    );
  }

  return (
    <ProtectedPageWrapper>
      <Header title="Reservations" />
      <PageContainer>
        <div className="space-y-6">
          <Calendar
            newReservationTrigger={newReservationTrigger}
            isManager={true}
          />
        </div>
      </PageContainer>
    </ProtectedPageWrapper>
  );
}
