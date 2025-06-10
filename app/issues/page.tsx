"use client";

import { useState, useEffect, useMemo } from "react";
// ... imports

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

  // Your JSX...
}