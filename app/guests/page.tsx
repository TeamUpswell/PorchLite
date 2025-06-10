"use client";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";

import { useState } from "react";
import { CreatePattern } from "@/components/ui/FloatingActionPresets";
 // Remove the "s" in "layout"

export default function GuestsPage() {
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);

  return (
    <ProtectedPageWrapper><div className="space-y-6">
      {/* Your page content */}

      <CreatePattern
        onClick={() => setShowAddGuestModal(true)}
        label="Add Guest"
      />

      {/* Rest of your component */}
    </div></ProtectedPageWrapper>
  );
}
