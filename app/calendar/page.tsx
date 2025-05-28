"use client";

export const dynamic = "force-dynamic";

import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { Calendar } from "./components/Calendar";

export default function ReservationCalendarPage() {
  const [triggerNewReservation, setTriggerNewReservation] = useState(false);

  const handleNewReservationClick = () => {
    setTriggerNewReservation(true);
  };

  // Reset the trigger after it's been used
  useEffect(() => {
    if (triggerNewReservation) {
      const timer = setTimeout(() => {
        setTriggerNewReservation(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [triggerNewReservation]);

  return (
    <StandardPageLayout
      title="Property Calendar"
      subtitle="Manage reservations and bookings"
      headerIcon={<CalendarIcon className="h-6 w-6 text-blue-600" />}
      headerActions={
        <button
          onClick={handleNewReservationClick}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Reservation
        </button>
      }
    >
      <StandardCard className="h-full min-h-[800px]" padding="sm">
        <Calendar onNewReservation={triggerNewReservation} />
      </StandardCard>
    </StandardPageLayout>
  );
}
