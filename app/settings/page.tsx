"use client";

import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import StandardCard from "@/components/ui/StandardCard";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <ProtectedPageWrapper>
      <div className="space-y-6">
        <StandardCard
          title="Settings"
          subtitle="Manage your application settings"
        >
          <div className="text-center py-8">
            <p className="text-gray-500">Settings page coming soon</p>
          </div>
        </StandardCard>
      </div>
    </ProtectedPageWrapper>
  );
}
