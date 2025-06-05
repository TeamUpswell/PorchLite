"use client";

import { useViewMode } from "@/lib/hooks/useViewMode";
import { useState } from "react";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import Button from "@/components/ui/button";
import { Calendar } from "./components/Calendar"; // ✅ Import the actual React Big Calendar

const ViewModeIndicator = ({ mode }: { mode: string }) => {
  const modeInfo = {
    manager: {
      icon: "👑",
      label: "Owner/Manager",
      color: "bg-blue-50 border-blue-200 text-blue-800",
    },
    family: {
      icon: "👥",
      label: "Family & Friends",
      color: "bg-green-50 border-green-200 text-green-800",
    },
    guest: {
      icon: "👁️",
      label: "Guest View",
      color: "bg-amber-50 border-amber-200 text-amber-800",
    },
  };

  const info = modeInfo[mode as keyof typeof modeInfo];
  if (!info) return null;

  return (
    <div className={`mb-4 p-3 border rounded-lg ${info.color}`}>
      <p className="text-sm font-medium">
        {info.icon} Currently viewing as: <strong>{info.label}</strong>
      </p>
    </div>
  );
};

export default function ReservationCalendarPage() {
  const {
    viewMode,
    isManagerView,
    isFamilyView,
    isGuestView,
    isViewingAsLowerRole,
  } = useViewMode();

  const [newReservationTrigger, setNewReservationTrigger] = useState(0);

  const handleAddReservation = () => {
    setNewReservationTrigger((prev) => prev + 1);
  };

  return (
    <ProtectedPageWrapper>
      <PageContainer>
        {/* Show view mode indicator when viewing as lower role */}
        {isViewingAsLowerRole && <ViewModeIndicator mode={viewMode} />}

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Calendar</h1>

            {/* Add reservation button - hide for guests */}
            {!isGuestView && (
              <Button
                onClick={handleAddReservation}
                variant="primary"
                size="md"
              >
                Add Reservation
              </Button>
            )}
          </div>

          {/* ✅ Use StandardCard but let Calendar handle its own styling */}
          <StandardCard className="overflow-hidden" padding="none">
            <Calendar newReservationTrigger={newReservationTrigger} />
          </StandardCard>
        </div>
      </PageContainer>
    </ProtectedPageWrapper>
  );
}
