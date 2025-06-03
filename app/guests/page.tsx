"use client";

import { useState } from "react";
import { CreatePattern } from "@/components/ui/FloatingActionPresets";
import StandardPageLayout from "@/components/layouts/StandardPageLayout";

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
