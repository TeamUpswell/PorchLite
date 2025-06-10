"use client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProperty } from "@/lib/hooks/useProperty";

import TripReportWizard from "@/components/guest-book/TripReportWizard";

export default function NewGuestBookEntryPage() {
  const router = useRouter();
  const { currentProperty } = useProperty();

  const handleComplete = () => {
    router.push("/guest-book");
  };

  return (
    <ProtectedPageWrapper>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ArrowLeft className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Share Your Experience
              </h1>
              <p className="text-gray-600">
                Tell us about your stay and help future guests
              </p>
            </div>
          </div>
          <Link
            href="/guest-book"
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </div>
        <TripReportWizard
          property={currentProperty}
          onComplete={handleComplete}
        />
      </div>
    </ProtectedPageWrapper>
  );
}
