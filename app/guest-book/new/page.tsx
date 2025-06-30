"use client";

import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import TripReportWizard from "@/components/guest-book/TripReportWizard";
import { useRouter } from "next/navigation";

export default function NewGuestBookEntryPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const router = useRouter();

  const handleComplete = () => {
    // Redirect back to guest book with success message
    router.push("/guest-book?success=true");
  };

  // Show loading while auth or property is loading
  if (authLoading || propertyLoading) {
    return (
      <div className="p-6">
        <Header title="Share Your Memory" />
        <PageContainer>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading...</p>
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  // Redirect to login if no user
  if (!user) {
    return (
      <div className="p-6">
        <Header title="Share Your Memory" />
        <PageContainer>
          <StandardCard className="text-center py-12">
            <PlusCircle className="h-16 w-16 text-gray-600 dark:text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Please log in to share your memory.</p>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  // Show message if no property
  if (!currentProperty) {
    return (
      <div className="p-6">
        <Header title="Share Your Memory" />
        <PageContainer>
          <StandardCard className="text-center py-12">
            <PlusCircle className="h-16 w-16 text-gray-600 dark:text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Property Selected
            </h3>
            <p className="text-gray-600">
              Please select a property to share your memory.
            </p>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Header
        title="Share Your Memory"
        subtitle={`Create a guest book entry for ${currentProperty.name}`}
        icon={PlusCircle}
      />
      <PageContainer>
        {/* Responsive container for the wizard */}
        <div className="max-w-4xl mx-auto">
          <TripReportWizard
            property={currentProperty}
            onComplete={handleComplete}
          />
        </div>
      </PageContainer>
    </div>
  );
}
