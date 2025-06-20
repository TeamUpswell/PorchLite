"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";

export default function HouseWalkthroughPage() {
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
      <Header title="House Walkthrough" />
      <PageContainer>
        <div className="space-y-6">
          <StandardCard
            title="Property Walkthrough"
            subtitle="Guide guests through your property"
          >
            <div className="space-y-6">
              {/* Copy your existing walkthrough content here */}
            </div>
          </StandardCard>
        </div>
      </PageContainer>
    </div>
  );
}
