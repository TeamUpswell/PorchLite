"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";

interface Issue {
  id: string;
  title: string;
  description?: string;
  status: string;
  property_id: string;
  created_at: string;
  [key: string]: any;
}

export default function IssuesPage() {
  // ✅ ALL HOOKS FIRST
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  const loadIssues = async () => {
    if (!currentProperty?.id) return;
    
    setLoading(true);
    try {
      // Add your issues loading logic here
      console.log("Loading issues for property:", currentProperty.id);
      setIssues([]);
    } catch (error) {
      console.error("Error loading issues:", error);
    } finally {
      setLoading(false);
    }
  };

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
  if (authLoading || propertyLoading) {
    return (
      <div className="p-6">
        <Header title="Issues" />
        <PageContainer>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </PageContainer>
      </div>
    );
  }
  
  if (!user) return null;
  
  if (!currentProperty) {
    return (
      <div className="p-6">
        <Header title="Issues" />
        <PageContainer>
          <StandardCard
            title="No Property Selected"
            subtitle="Please select a property to view issues"
          >
            <p className="text-gray-600">You need to select a property first to manage issues.</p>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="p-6">
        <Header title="Issues" />
        <PageContainer>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Header title="Issues" />
      <PageContainer>
        <div className="space-y-6">
          <StandardCard
            title="Property Issues"
            subtitle={`Track and manage issues for ${currentProperty.name}`}
          >
            <div className="space-y-6">
              {issues.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No issues found for this property.
                </p>
              ) : (
                <div className="space-y-4">
                  {issues.map((issue) => (
                    <div key={issue.id} className="border rounded-lg p-4">
                      <h3 className="font-medium">{issue.title}</h3>
                      <p className="text-gray-600 text-sm">{issue.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </StandardCard>
        </div>
      </PageContainer>
    </div>
  );
}