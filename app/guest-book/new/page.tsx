"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import { useRouter } from "next/navigation";
import { useProperty } from "@/lib/hooks/useProperty";
import TripReportWizard from "@/components/guest-book/TripReportWizard";

export default function NewGuestBookEntryPage() {
  const router = useRouter();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const { user, loading: authLoading } = useAuth();

  const handleComplete = () => {
    router.push("/guest-book");
  };

  // ✅ Combined loading state
  if (authLoading || propertyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Auth will redirect
  }

  // ✅ Property check with proper error handling
  if (!currentProperty) {
    return (
      <div className="p-6">
        <Header title="New Guest Book Entry" />
        <PageContainer>
          <StandardCard
            title="No Property Selected"
            subtitle="Please select a property to add a guest book entry"
          >
            <div className="text-center py-8">
              <div className="max-w-md mx-auto">
                <ArrowLeft className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Property Selected
                </h3>
                <p className="text-gray-600 mb-4">
                  Please select a property to add a guest book entry.
                </p>
                <div className="flex gap-3 justify-center">
                  <Link
                    href="/guest-book"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Back to Guest Book
                  </Link>
                  <Link
                    href="/"
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Header title="New Guest Book Entry" />
      <PageContainer>
        <div className="space-y-6">
          <StandardCard
            title="Share Your Experience"
            subtitle="Tell us about your stay and help future guests"
            headerActions={
              <Link
                href="/guest-book"
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Guest Book
              </Link>
            }
          >
            <div className="space-y-6">
              {/* Header Section */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-50 rounded-full">
                    <ArrowLeft className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Add Your Guest Book Entry
                    </h2>
                    <p className="text-gray-600 text-sm">
                      Property:{" "}
                      <span className="font-medium">{currentProperty.name}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Trip Report Wizard */}
              <TripReportWizard
                property={currentProperty}
                onComplete={handleComplete}
              />
            </div>
          </StandardCard>
        </div>
      </PageContainer>
    </div>
  );
}
