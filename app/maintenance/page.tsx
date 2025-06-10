"use client";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";

import { useState } from "react";
import { CreatePattern } from "@/components/ui/FloatingActionPresets";


export default function MaintenancePage() {
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <ProtectedPageWrapper><div className="space-y-6">
      {/* Your page content */}

      <CreatePattern
        onClick={() => setShowReportModal(true)}
        label="Report Issue"
      />

      {/* Rest of your component */}
    </div></ProtectedPageWrapper>
  );
}
