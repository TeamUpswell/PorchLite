"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";

export default function IssuesPage() {
  // ✅ ALL HOOKS FIRST
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  // ... other hooks

  // Your existing functions...

  useEffect(() => {
    if (authLoading || propertyLoading) return;
    if (!user?.id || !currentProperty?.id) {
      setLoading(false);
      setHasInitialized(true);
      return;
    }

    setHasInitialized(true);
    loadIssues();
  }, [user?.id, currentProperty?.id, authLoading, propertyLoading]);

  // ✅ Early returns AFTER hooks
  if (authLoading || propertyLoading) return <LoadingComponent />;
  if (!user) return null;
  if (!currentProperty) return <NoPropertyComponent />;
  if (loading) return <LoadingIssuesComponent />;

  return (
    <div className="p-6">
      <Header title="Issues" />
      <PageContainer>
        <div className="space-y-6">
          <StandardCard
            title="Property Issues"
            subtitle="Track and manage property issues"
          >
            <div className="space-y-6">
              {/* Your existing issues JSX goes here */}
            </div>
          </StandardCard>
        </div>
      </PageContainer>
    </div>
  );
}