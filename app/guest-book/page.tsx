"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";

export default function GuestBookPage() {
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
    <div className="p-6">
      <Header title="Guest Book" />
      <PageContainer>
        <div className="space-y-6">
          <StandardCard
            title="Guest Messages"
            subtitle="Messages and feedback from your guests"
          >
            {/* Move all existing guest-book content here */}
            <div className="space-y-6">
              {/* Your existing guest-book JSX goes here */}
            </div>
          </StandardCard>
        </div>
      </PageContainer>
    </div>
  );
}
