"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import { Calendar } from "./components/Calendar";

export default function ReservationCalendarPage() {
  const [newReservationTrigger, setNewReservationTrigger] = useState(0);

  const handleNewReservationClick = () => {
    setNewReservationTrigger((prev) => prev + 1);
  };

  return (
    <ProtectedPageWrapper>
      <PageContainer>
        <div className="p-4">
          <StandardCard className="h-full min-h-[800px]" padding="sm">
            <Calendar newReservationTrigger={newReservationTrigger} />
          </StandardCard>
        </div>
      </PageContainer>
    </ProtectedPageWrapper>
  );
}
