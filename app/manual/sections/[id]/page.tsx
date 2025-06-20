"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Plus, Edit, ArrowLeft, BookOpen, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import { supabase } from "@/lib/supabase";
import { MultiActionPattern } from "@/components/ui/FloatingActionPresets";
import { toast } from "react-hot-toast";

interface ManualSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  property_id: string;
  created_at: string;
}

interface ManualItem {
  id: string;
  title: string;
  content: string;
  media_urls?: string[];
  section_id: string;
  created_at: string;
  important?: boolean;
  order_index?: number;
}

export default function ManualSectionDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const router = useRouter();
  const params = useParams();
  
  const [section, setSection] = useState<ManualSection | null>(null);
  const [items, setItems] = useState<ManualItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs for optimization
  const mountedRef = useRef(true);
  const hasLoadedRef = useRef(false);
  const currentSectionIdRef = useRef<string | null>(null);

  const sectionId = params.id as string;

  // Component cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Memoized loading state
  const isInitializing = useMemo(() => {
    return authLoading || propertyLoading;
  }, [authLoading, propertyLoading]);

  // Main data loading function
  const loadSectionData = useCallback(async () => {
    if (!sectionId || !user?.id || !mountedRef.current) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("📖 Loading section data for:", sectionId);

      // Fetch section and items in parallel
      const [sectionResponse, itemsResponse] = await Promise.all([
        supabase
          .from("manual_sections")
          .select("*")
          .eq("id", sectionId)
          .single(),
        supabase
          .from("manual_items")
          .select("*")
          .eq("section_id", sectionId)
          .order("order_index", { ascending: true })
      ]);

      if (!mountedRef.current) {
        console.log("⚠️ Component unmounted, aborting");
        return;
      }

      // Handle section response
      if (sectionResponse.error) {
        if (sectionResponse.error.code === 'PGRST116') {
          setError("Section not found");
        } else {
          console.error("❌ Error fetching section:", sectionResponse.error);
          setError("Failed to load section");
        }
        setSection(null);
      } else {
        console.log("✅ Section loaded:", sectionResponse.data.title);
        setSection(sectionResponse.data);
      }

      // Handle items response
      if (itemsResponse.error) {
        console.error("❌ Error fetching items:", itemsResponse.error);
        // Don't fail the whole page if items fail to load
        setItems([]);
        toast.error("Failed to load section items");
      } else {
        console.log("✅ Items loaded:", itemsResponse.data?.length || 0);
        setItems(itemsResponse.data || []);
      }

    } catch (error) {
      console.error("❌ Unexpected error loading section:", error);
      if (mountedRef.current) {
        setError("Failed to load section data");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [sectionId, user?.id]);

  // Main loading effect
  useEffect(() => {
    if (isInitializing) {
      return;
    }

    if (!user?.id) {
      console.log("⏳ Waiting for user...");
      if (mountedRef.current) {
        setLoading(false);
        hasLoadedRef.current = true;
      }
      return;
    }

    if (!sectionId) {
      console.log("⚠️ No section ID provided");
      if (mountedRef.current) {
        setLoading(false);
        setError("No section ID provided");
        hasLoadedRef.current = true;
      }
      return;
    }

    // Check if we need to reload due to section change
    const sectionChanged = currentSectionIdRef.current !== sectionId;
    
    if (!hasLoadedRef.current || sectionChanged) {
      console.log("🔄 Loading section data:", { 
        sectionChanged, 
        hasLoaded: hasLoadedRef.current,
        sectionId 
      });
      
      currentSectionIdRef.current = sectionId;
      hasLoadedRef.current = true;
      loadSectionData();
    }
  }, [user?.id, sectionId, isInitializing, loadSectionData]);

  // Retry function
  const retryLoad = useCallback(() => {
    if (sectionId && user?.id) {
      hasLoadedRef.current = false;
      setError(null);
      loadSectionData();
    }
  }, [sectionId, user?.id, loadSectionData]);

  // Memoized navigation handlers
  const navigationHandlers = useMemo(() => ({
    goToManual: () => router.push("/manual"),
    goToAddItem: () => router.push(`/manual/sections/${sectionId}/items/new`),
    goToEditSection: () => router.push(`/manual/sections/${sectionId}/edit`),
  }), [router, sectionId]);

  // Loading state
  if (isInitializing || loading) {
    return (
      <div className="p-6">
        <Header title="Manual Section" />
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-600">
                  {isInitializing ? "⏳ Initializing..." : "📖 Loading section..."}
                </p>
              </div>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  if (!user) {
    return null; // Auth will redirect
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <Header title="Manual Section" />
        <PageContainer>
          <StandardCard
            title="Error Loading Section"
            subtitle="Unable to load the requested section"
          >
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {error === "Section not found" ? "Section Not Found" : "Error Loading Section"}
              </h3>
              <p className="text-red-600 mb-4">{error}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={retryLoad}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
                <Link
                  href="/manual"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back to Manual
                </Link>
              </div>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="p-6">
        <Header title="Manual Section" />
        <PageContainer>
          <StandardCard
            title="Section Not Found"
            subtitle="The requested manual section could not be found"
          >
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Section Not Found
              </h3>
              <p className="text-gray-600 mb-4">
                The manual section you're looking for doesn't exist or you don't have access to it.
              </p>
              <Link
                href="/manual"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Manual
              </Link>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Header title="Manual Section" />
      <PageContainer>
        <div className="space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Link href="/manual" className="hover:text-blue-600">
              Manual
            </Link>
            <span>›</span>
            <span className="text-gray-900">{section.title}</span>
          </div>

          <StandardCard
            title="Section Details"
            subtitle={`Manage content for this manual section${currentProperty ? ` • ${currentProperty.name}` : ''}`}
            headerActions={
              <div className="flex items-center gap-2">
                <Link
                  href={`/manual/sections/${sectionId}/edit`}
                  className="inline-flex items-center px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Link>
              </div>
            }
          >
            <div className="space-y-6">
              {/* Section Info */}
              <div className="flex items-start space-x-4">
                {section.icon && (
                  <div className="flex-shrink-0">
                    <span className="text-3xl">{section.icon}</span>
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {section.title}
                  </h1>
                  {section.description && (
                    <p className="text-gray-600">{section.description}</p>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    Created {new Date(section.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Items ({items.length})
                  </h2>
                  <Link
                    href={`/manual/sections/${sectionId}/items/new`}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Link>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <BookOpen className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                    <p className="text-gray-500 mb-4">
                      No items in this section yet
                    </p>
                    <Link
                      href={`/manual/sections/${sectionId}/items/new`}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Item
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                      >
                        <div className="flex-1">
                          <Link
                            href={`/manual/sections/${sectionId}/items/${item.id}`}
                            className="block group"
                          >
                            <div className="flex items-center mb-1">
                              <span className="text-xs text-gray-400 mr-2">
                                #{index + 1}
                              </span>
                              <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                                {item.title}
                              </h3>
                              {item.important && (
                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Important
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {item.content.length > 100
                                ? `${item.content.substring(0, 100)}...`
                                : item.content}
                            </p>
                            <div className="text-xs text-gray-400 mt-1">
                              Created {new Date(item.created_at).toLocaleDateString()}
                            </div>
                          </Link>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Link
                            href={`/manual/sections/${sectionId}/items/${item.id}/edit`}
                            className="flex items-center px-3 py-2 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </StandardCard>
        </div>
      </PageContainer>

      {/* Multi-button floating action menu */}
      <MultiActionPattern
        actions={[
          {
            icon: Plus,
            label: "Add Item",
            href: `/manual/sections/${sectionId}/items/new`,
            variant: "primary",
          },
          {
            icon: Edit,
            label: "Edit Section",
            href: `/manual/sections/${sectionId}/edit`,
            variant: "warning",
          },
          {
            icon: ArrowLeft,
            label: "Back to Manual",
            href: "/manual",
            variant: "gray",
          },
        ]}
      />
    </div>
  );
}
