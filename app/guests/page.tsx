"use client";

import { useState } from "react";
import { CreatePattern } from "@/components/ui/FloatingActionPresets";
import StandardPageLayout from "@/components/layout/StandardPageLayout"; // Remove the "s" in "layout"

export default function GuestsPage() {
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);

  return (
    <StandardPageLayout>
      {/* Your page content */}

      <CreatePattern
        onClick={() => setShowAddGuestModal(true)}
        label="Add Guest"
      />

      {/* Rest of your component */}
    </StandardPageLayout>
  );
}
