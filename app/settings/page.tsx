"use client";

import { Header, PageContainer, StandardCard } from "@/components/ui";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";

export default function SettingsPage() {
  return (
    <ProtectedPageWrapper>
      <>
        <Header
          title="Settings"
          subtitle="Manage your account and preferences"
        />
        <PageContainer>
          <div className="p-6">
            <StandardCard>
              <div className="text-center py-8">
                <p className="text-gray-500">Settings page coming soon</p>
              </div>
            </StandardCard>
          </div>
        </PageContainer>
      </>
    </ProtectedPageWrapper>
  );
}
