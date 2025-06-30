"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty"; // ✅ Added missing import
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";

// ✅ Added missing interface
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

  // ✅ Added missing loadIssues function
  const loadIssues = async () => {
    if (!currentProperty?.id) return;

    setLoading(true);
    try {
      // TODO: Add your issues loading logic here
      // const { data, error } = await supabase
      //   .from('issues')
      //   .select('*')
      //   .eq('property_id', currentProperty.id)
      //   .order('created_at', { ascending: false });

      console.log("Loading issues for property:", currentProperty.id);
      setIssues([]); // Replace with actual data
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

  // ✅ Early returns AFTER hooks - with actual components
  if (authLoading || propertyLoading) {
    return (
      <div className="p-6">
        <Header title="Issues" />
        <PageContainer>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600">
                {authLoading
                  ? "⏳ Authenticating..."
                  : "🏠 Loading property..."}
              </p>
            </div>
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
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                You need to select a property first to manage issues.
              </p>
              <button
                onClick={() => (window.location.href = "/properties")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Select Property
              </button>
            </div>
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
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600">📋 Loading issues...</p>
            </div>
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
                <div className="text-center py-12">
                  <div className="text-gray-600 dark:text-gray-400 mb-4">
                    <svg
                      className="mx-auto h-16 w-16"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Issues Found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    No issues have been reported for this property yet.
                  </p>
                  <button
                    onClick={() => {
                      // TODO: Add create issue functionality
                      console.log("Create new issue");
                    }}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Report New Issue
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {issue.title}
                          </h3>
                          {issue.description && (
                            <p className="text-gray-600 text-sm mb-2">
                              {issue.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Status: {issue.status}</span>
                            <span>•</span>
                            <span>
                              {new Date(issue.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              issue.status === "open"
                                ? "bg-red-100 text-red-800"
                                : issue.status === "in-progress"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {issue.status}
                          </span>
                        </div>
                      </div>
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
