"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProperty } from "@/lib/hooks/useProperty";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import TripReportWizard from "@/components/guest-book/TripReportWizard";

export default function NewGuestBookEntryPage() {
  const router = useRouter();
  const { currentProperty } = useProperty();

  const handleComplete = () => {
    router.push('/guest-book');
  };

  return (
    <StandardPageLayout
      title="Share Your Experience"
      subtitle="Tell us about your stay and help future guests"
      showBackButton
      backHref="/guest-book"
    >
      <TripReportWizard
        property={currentProperty}
        onComplete={handleComplete}
      />
    </StandardPageLayout>
  );
}