"use client";

import { useAuth } from "@/components/auth";
import { Header, PageContainer, StandardCard } from "@/components/ui";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ReservationsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Auth will redirect
  }

  return (
    <>
      <Header
        title="Reservations"
        subtitle="Manage guest bookings and availability"
      />
      <PageContainer>
        <div className="p-6">
          <StandardCard>
            {/* Move all existing reservations content here */}
            <div className="space-y-6">
              {/* Your existing reservations JSX goes here */}
            </div>
          </StandardCard>
        </div>
      </PageContainer>
    </>
  );
}
