"use client";

// REMOVE ANY EXISTING revalidate CONFIGS
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";

export default function CleaningHistoryPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-6">
      <Header title="Cleaning History" />
      <PageContainer>
        <div className="space-y-6">
          <StandardCard
            title="Cleaning Records"
            subtitle="View cleaning history and completed tasks"
          >
            <div className="space-y-6">
              {/* Your existing cleaning history JSX goes here */}
            </div>
          </StandardCard>
        </div>
      </PageContainer>
    </div>
  );
}
