"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  ExternalLink,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import StandardCard from "@/components/ui/StandardCard";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import { toast } from "react-hot-toast";

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

interface ManualSection {
  id: string;
  title: string;
  property_id: string;
}

export default function ItemDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const router = useRouter();
  const params = useParams();

  const [item, setItem] = useState<ManualItem | null>(null);
  const [section, setSection] = useState<ManualSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs for optimization
  const mountedRef = useRef(true);
  const hasLoadedRef = useRef(false);
  const currentItemIdRef = useRef<string | null>(null);

  const sectionId = params.id as string;
  const itemId = params.itemId as string;

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
  const loadItemData = useCallback(async () => {
    if (!sectionId || !itemId || !user?.id || !mountedRef.current) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("📖 Loading item data:", { sectionId, itemId });

      // Load item and section in parallel
      const [itemResponse, sectionResponse] = await Promise.all([
        supabase
          .from("manual_items")
          .select("*")
          .eq("id", itemId)
          .eq("section_id", sectionId) // Verify item belongs to section
          .single(),
        supabase
          .from("manual_sections")
          .select("id, title, property_id")
          .eq("id", sectionId)
          .single(),
      ]);

      if (!mountedRef.current) {
        console.log("⚠️ Component unmounted, aborting");
        return;
      }

      // Handle item response
      if (itemResponse.error) {
        if (itemResponse.error.code === "PGRST116") {
          setError("Item not found");
        } else {
          console.error("❌ Error fetching item:", itemResponse.error);
          setError("Failed to load item");
        }
        setItem(null);
      } else {
        console.log("✅ Item loaded:", itemResponse.data.title);
        setItem(itemResponse.data);
      }

      // Handle section response
      if (sectionResponse.error) {
        if (sectionResponse.error.code === "PGRST116") {
          setError("Section not found");
        } else {
          console.error("❌ Error fetching section:", sectionResponse.error);
          setError("Failed to load section");
        }
        setSection(null);
      } else {
        console.log("✅ Section loaded:", sectionResponse.data.title);
        setSection(sectionResponse.data);

        // Verify property access
        if (
          currentProperty?.id &&
          sectionResponse.data.property_id !== currentProperty.id
        ) {
          setError("Item belongs to a different property");
          return;
        }
      }

      // If both failed, show generic error
      if (itemResponse.error && sectionResponse.error) {
        setError("Failed to load item data");
      }
    } catch (error) {
      console.error("❌ Unexpected error loading item:", error);
      if (mountedRef.current) {
        setError("Failed to load item data");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [sectionId, itemId, user?.id, currentProperty?.id]);

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

    if (!sectionId || !itemId) {
      console.log("⚠️ Missing section or item ID");
      if (mountedRef.current) {
        setLoading(false);
        setError("Missing section or item ID");
        hasLoadedRef.current = true;
      }
      return;
    }

    // Check if we need to reload due to item change
    const itemChanged = currentItemIdRef.current !== itemId;

    if (!hasLoadedRef.current || itemChanged) {
      console.log("🔄 Loading item data:", {
        itemChanged,
        hasLoaded: hasLoadedRef.current,
        itemId,
      });

      currentItemIdRef.current = itemId;
      hasLoadedRef.current = true;
      loadItemData();
    }
  }, [user?.id, sectionId, itemId, isInitializing, loadItemData]);

  // Retry function
  const retryLoad = useCallback(() => {
    if (sectionId && itemId && user?.id) {
      hasLoadedRef.current = false;
      setError(null);
      loadItemData();
    }
  }, [sectionId, itemId, user?.id, loadItemData]);

  // Memoized navigation handlers
  const navigationHandlers = useMemo(
    () => ({
      goToSection: () => router.push(`/manual/sections/${sectionId}`),
      goToEdit: () =>
        router.push(`/manual/sections/${sectionId}/items/${itemId}/edit`),
      goToManual: () => router.push("/manual"),
    }),
    [router, sectionId, itemId]
  );

  // Memoized photo click handler
  const handlePhotoClick = useCallback((url: string, index: number) => {
    // Open in new tab
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  // Loading state
  if (isInitializing || loading) {
    return (
      <div className="p-6">
        <Header title="Manual Item" />
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-600">
                  {isInitializing ? "⏳ Initializing..." : "📖 Loading item..."}
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
        <Header title="Manual Item" />
        <PageContainer>
          <StandardCard
            title="Error Loading Item"
            subtitle="Unable to load the requested manual item"
          >
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {error === "Item not found"
                  ? "Item Not Found"
                  : "Error Loading Item"}
              </h3>
              <p className="text-red-600 mb-4">{error}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={retryLoad}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
                {sectionId ? (
                  <Link
                    href={`/manual/sections/${sectionId}`}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Back to Section
                  </Link>
                ) : (
                  <Link
                    href="/manual"
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Back to Manual
                  </Link>
                )}
              </div>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  if (!item || !section) {
    return (
      <div className="p-6">
        <Header title="Manual Item" />
        <PageContainer>
          <StandardCard
            title="Item Not Found"
            subtitle="The requested manual item could not be found"
          >
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Item Not Found
              </h3>
              <p className="text-gray-600 mb-4">
                The manual item you're looking for doesn't exist or you don't
                have access to it.
              </p>
              <div className="flex gap-3 justify-center">
                {sectionId ? (
                  <Link
                    href={`/manual/sections/${sectionId}`}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Section
                  </Link>
                ) : (
                  <Link
                    href="/manual"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Manual
                  </Link>
                )}
              </div>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Header title="Manual Item" />
      <PageContainer>
        <div className="space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Link href="/manual" className="hover:text-blue-600">
              Manual
            </Link>
            <span>›</span>
            <Link
              href={`/manual/sections/${sectionId}`}
              className="hover:text-blue-600"
            >
              {section.title}
            </Link>
            <span>›</span>
            <span className="text-gray-900">{item.title}</span>
          </div>

          <StandardCard
            title="Manual Item"
            subtitle={`${section.title} • ${
              currentProperty?.name || "Unknown Property"
            }`}
            headerActions={
              <div className="flex items-center gap-2">
                <Link
                  href={`/manual/sections/${sectionId}/items/${itemId}/edit`}
                  className="inline-flex items-center px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Link>
              </div>
            }
          >
            <div className="space-y-6">
              {/* Item Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {item.title}
                    </h1>
                    {item.important && (
                      <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Important
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                    <span>
                      Created{" "}
                      {new Date(item.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    {item.order_index && <span>Item #{item.order_index}</span>}
                    {item.media_urls && item.media_urls.length > 0 && (
                      <span className="flex items-center">
                        📸 {item.media_urls.length} photo
                        {item.media_urls.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Content
                </h3>
                <div className="prose prose-lg max-w-none">
                  <div className="whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-6 border text-gray-700">
                    {item.content}
                  </div>
                </div>
              </div>

              {/* Photos */}
              {item.media_urls && item.media_urls.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Photos ({item.media_urls.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {item.media_urls.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => handlePhotoClick(url, index)}
                        className="group relative block w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                      >
                        <div className="relative aspect-video overflow-hidden rounded-lg border border-gray-200 group-hover:border-blue-300 transition-colors">
                          <Image
                            src={url}
                            alt={`${item.title} - Image ${index + 1}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-colors flex items-center justify-center">
                            <div className="bg-white bg-opacity-90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink className="h-5 w-5 text-gray-800" />
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          Click to view full size
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </StandardCard>
        </div>
      </PageContainer>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col space-y-3">
        {/* Edit Item */}
        <Link
          href={`/manual/sections/${sectionId}/items/${itemId}/edit`}
          className="group flex items-center justify-center bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white shadow-lg transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-orange-500 focus:ring-opacity-50
          
          /* Mobile: circular button */
          w-14 h-14 rounded-full
          
          /* Desktop: expandable button with rounded corners */
          sm:w-auto sm:h-auto sm:px-4 sm:py-3 sm:rounded-lg sm:hover:scale-105"
          aria-label="Edit item"
        >
          <Edit className="h-6 w-6 transition-transform group-hover:rotate-12 duration-200 sm:mr-0 group-hover:sm:mr-2" />

          <span className="hidden sm:inline-block sm:w-0 sm:overflow-hidden sm:whitespace-nowrap sm:transition-all sm:duration-300 group-hover:sm:w-auto group-hover:sm:ml-2">
            Edit Item
          </span>
        </Link>

        {/* Back to Section */}
        <Link
          href={`/manual/sections/${sectionId}`}
          className="group flex items-center justify-center bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white shadow-lg transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-gray-500 focus:ring-opacity-50
          
          /* Mobile: circular button */
          w-14 h-14 rounded-full
          
          /* Desktop: expandable button with rounded corners */
          sm:w-auto sm:h-auto sm:px-4 sm:py-3 sm:rounded-lg sm:hover:scale-105"
          aria-label="Back to section"
        >
          <ArrowLeft className="h-6 w-6 transition-transform group-hover:-translate-x-1 duration-200 sm:mr-0 group-hover:sm:mr-2" />

          <span className="hidden sm:inline-block sm:w-0 sm:overflow-hidden sm:whitespace-nowrap sm:transition-all sm:duration-300 group-hover:sm:w-auto group-hover:sm:ml-2">
            Back to Section
          </span>
        </Link>
      </div>
    </div>
  );
}
