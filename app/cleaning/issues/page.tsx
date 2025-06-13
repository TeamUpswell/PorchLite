"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import { AlertTriangle } from "lucide-react";

export default function CleaningIssuesPage() {
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

  const handleReportIssue = () => {
    // Your report issue handling logic here
  };

  return (
    <div className="p-6">
      <Header title="Cleaning Issues" />
      <PageContainer>
        <div className="space-y-6">
          <StandardCard
            title="Issue Tracking"
            subtitle="Track and manage cleaning-related issues"
          >
            <div className="space-y-6">
              {/* Your existing cleaning issues JSX goes here */}
            </div>
          </StandardCard>
        </div>
      </PageContainer>
      <FloatingActionButton
        icon={AlertTriangle}
        label="Report Issue"
        onClick={handleReportIssue}
        variant="warning"
      />
    </div>
  );
}
