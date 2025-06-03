"use client";

import { useState } from "react";
import { CreatePattern } from "@/components/ui/FloatingActionPresets";
import StandardPageLayout from "@/components/layout/StandardPageLayout";

export default function MaintenancePage() {
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <StandardPageLayout>
      {/* Your page content */}

      <CreatePattern
        onClick={() => setShowReportModal(true)}
        label="Report Issue"
      />

      {/* Rest of your component */}
    </StandardPageLayout>
  );
}
