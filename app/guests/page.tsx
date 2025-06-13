"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";

export default function GuestsPage() {
  const { user, loading } = useAuth();
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);

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
    <div className="p-6">
      <Header title="Guests" />
      <PageContainer>
        <div className="space-y-6">
          <StandardCard
            title="Guest Management"
            subtitle="Manage current and past guests"
          >
            {/* Move all existing guests content here */}
            <div className="space-y-6">
              {/* Your existing guests JSX goes here */}
            </div>
          </StandardCard>
        </div>
      </PageContainer>
    </div>
  );
}
