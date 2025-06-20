"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { Plus, BookOpen, Pin, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import { CreatePattern } from "@/components/ui/FloatingActionPresets";
import MainLayout from "@/components/layout/MainLayout";
import StandardCard from "@/components/ui/StandardCard";
import StandardPageLayout from "@/components/layout/StandardPageLayout";

interface ManualSection {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  is_priority?: boolean;
  created_at: string;
  _count?: {
    items: number;
  };
}

export default function ManualPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const [sections, setSections] = useState<ManualSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs for optimization
  const mountedRef = useRef(true);
  const hasLoadedRef = useRef(false);
  const currentPropertyIdRef = useRef<string | null>(null);

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

  // Optimized default cleaning section creation
  const createDefaultCleaningSection = useCallback(
    async (propertyId: string, userId: string) => {
      try {
        const response = await fetch("/api/cleaning-sections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId,
            name: `${currentProperty?.name} - Default Cleaning`,
            userId,
          }),
        });

        if (!response.ok) {
          console.warn(
            "⚠️ Default cleaning section creation failed, continuing..."
          );
        }
      } catch (error) {
        console.warn("⚠️ Error creating default section:", error);
        // Don't block the main flow if this fails
      }
    },
    [currentProperty?.name]
  );

  // Main data loading function
  const loadSections = useCallback(async () => {
    if (!currentProperty?.id || !user?.id || !mountedRef.current) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("🏠 Loading sections for property:", currentProperty.name);

      // Create default cleaning section in background (don't await)
      createDefaultCleaningSection(currentProperty.id, user.id).catch(
        console.warn
      );

      const { data, error } = await supabase
        .from("manual_sections")
        .select(
          `
          *,
          manual_items(count)
        `
        )
        .eq("property_id", currentProperty.id)
        .order("is_priority", { ascending: false })
        .order("created_at", { ascending: true });

      if (!mountedRef.current) {
        console.log("⚠️ Component unmounted, aborting");
        return;
      }

      if (error) {
        console.error("❌ Error fetching instruction sections:", error);
        setError("Failed to load instruction sections");
        setSections([]);
      } else {
        console.log("✅ Fetched instruction sections:", data?.length || 0);

        // Sort sections with cleaning first among priorities
        const sortedData = data?.sort((a, b) => {
          if (a.is_priority !== b.is_priority) {
            return b.is_priority ? 1 : -1;
          }

          if (a.is_priority && b.is_priority) {
            if (a.title === "Cleaning Procedures") return -1;
            if (b.title === "Cleaning Procedures") return 1;
          }

          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });

        setSections(sortedData || []);
      }
    } catch (error) {
      console.error("❌ Unexpected error loading sections:", error);
      if (mountedRef.current) {
        setError("Failed to load instruction sections");
        setSections([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    currentProperty?.id,
    currentProperty?.name,
    user?.id,
    createDefaultCleaningSection,
  ]);

  // Main loading effect
  useEffect(() => {
    if (isInitializing) {
      return;
    }

    if (!user?.id || !currentProperty?.id) {
      console.log("⏳ Waiting for user and property...");
      if (mountedRef.current) {
        setLoading(false);
        hasLoadedRef.current = true;
      }
      return;
    }

    // Check if we need to reload due to property change
    const propertyChanged = currentPropertyIdRef.current !== currentProperty.id;

    if (!hasLoadedRef.current || propertyChanged) {
      console.log("🔄 Loading sections:", {
        propertyChanged,
        hasLoaded: hasLoadedRef.current,
        propertyName: currentProperty.name,
      });

      currentPropertyIdRef.current = currentProperty.id;
      hasLoadedRef.current = true;
      loadSections();
    }
  }, [user?.id, currentProperty?.id, isInitializing, loadSections]);

  // Optimized toggle pin function
  const handleTogglePin = useCallback(
    async (sectionId: string, isPriority: boolean) => {
      if (!currentProperty?.id || !mountedRef.current) {
        return;
      }

      try {
        const { error } = await supabase
          .from("manual_sections")
          .update({ is_priority: isPriority })
          .eq("id", sectionId);

        if (!mountedRef.current) {
          return;
        }

        if (error) {
          console.error("Error updating section priority:", error);
          toast.error("Failed to update section");
        } else {
          toast.success(isPriority ? "Section pinned" : "Section unpinned");

          // Update local state optimistically
          setSections((prev) =>
            prev.map((section) =>
              section.id === sectionId
                ? { ...section, is_priority: isPriority }
                : section
            )
          );
        }
      } catch (error) {
        console.error("Unexpected error updating section:", error);
        if (mountedRef.current) {
          toast.error("Failed to update section");
        }
      }
    },
    [currentProperty?.id]
  );

  // Retry function
  const retryLoad = useCallback(() => {
    if (currentProperty?.id && user?.id) {
      hasLoadedRef.current = false;
      setError(null);
      loadSections();
    }
  }, [currentProperty?.id, user?.id, loadSections]);

  // Memoized filtered sections
  const { prioritySections, regularSections } = useMemo(() => {
    const priority = sections
      .filter((section) => section.is_priority)
      .sort((a, b) => {
        if (a.title === "Cleaning Procedures") return -1;
        if (b.title === "Cleaning Procedures") return 1;
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

    const regular = sections.filter((section) => !section.is_priority);

    return { prioritySections: priority, regularSections: regular };
  }, [sections]);

  // Loading states
  if (isInitializing) {
    return (
      <StandardPageLayout theme="dark" showHeader={true}>
        <div className="p-6">
          <StandardCard>
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">⏳ Initializing...</p>
              </div>
            </div>
          </StandardCard>
        </div>
      </StandardPageLayout>
    );
  }

  if (!user) {
    return null;
  }

  if (!currentProperty) {
    return (
      <StandardPageLayout theme="dark" showHeader={true}>
        <div className="p-6">
          <StandardCard>
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No Property Selected
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Please select a property to view instructions.
              </p>
            </div>
          </StandardCard>
        </div>
      </StandardPageLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <StandardPageLayout theme="dark" showHeader={true}>
        <div className="p-6">
          <StandardCard
            title="Property Manual"
            subtitle={`Instructions and procedures for ${currentProperty.name}`}
          >
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-red-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Failed to Load Sections
              </h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={retryLoad}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </StandardCard>
        </div>
      </StandardPageLayout>
    );
  }

  // Main content
  return (
    <StandardPageLayout theme="dark" showHeader={true}>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <StandardCard
              title="Property Manual"
              subtitle={`Instructions and procedures for ${currentProperty.name}`}
            >
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading sections...</span>
              </div>
            </StandardCard>
          ) : (
            <div className="space-y-8">
              {/* Priority Sections */}
              {prioritySections.length > 0 && (
                <StandardCard
                  title="Priority Sections"
                  subtitle="Important procedures and frequently accessed information"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {prioritySections.map((section) => (
                      <PrioritySectionCard
                        key={section.id}
                        section={section}
                        onTogglePin={handleTogglePin}
                      />
                    ))}
                  </div>
                </StandardCard>
              )}

              {/* Regular Sections */}
              {regularSections.length > 0 && (
                <StandardCard
                  title="All Sections"
                  subtitle="Complete manual sections and procedures"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {regularSections.map((section) => (
                      <SectionCard key={section.id} section={section} />
                    ))}
                  </div>
                </StandardCard>
              )}

              {/* Empty state */}
              {sections.length === 0 && (
                <StandardCard
                  title="Property Manual"
                  subtitle={`Instructions and procedures for ${currentProperty.name}`}
                >
                  <div className="text-center py-12">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No instruction sections yet
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating your first instruction section.
                    </p>
                  </div>
                </StandardCard>
              )}

              {/* Tips section */}
              <div className="text-gray-500 text-sm bg-gray-50 rounded-lg p-4">
                <p className="mb-2">
                  💡 <strong>Tips:</strong>
                </p>
                <ul className="space-y-1">
                  <li>• Click the pin icon to mark sections as priority</li>
                  <li>
                    • Priority sections appear at the top for quick access
                  </li>
                  <li>
                    • The cleaning section is automatically created for each
                    property
                  </li>
                </ul>
              </div>
            </div>
          )}

          <CreatePattern href="/manual/sections/new" label="Add Instructions" />
        </div>
      </div>
    </StandardPageLayout>
  );
}

// Optimized Priority Section Card Component
function PrioritySectionCard({
  section,
  onTogglePin,
}: {
  section: ManualSection;
  onTogglePin: (sectionId: string, isPriority: boolean) => void;
}) {
  const [isToggling, setIsToggling] = useState(false);

  // Check if this is the cleaning section
  if (section.title === "Cleaning Procedures") {
    return <CleaningSectionCard section={section} onTogglePin={onTogglePin} />;
  }

  const handleUnpin = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsToggling(true);
      await onTogglePin(section.id, false);
      setIsToggling(false);
    },
    [section.id, onTogglePin]
  );

  return (
    <Link href={`/manual/sections/${section.id}`}>
      <div className="bg-white rounded-lg shadow border-2 border-yellow-200 hover:border-yellow-300 transition-colors p-6 h-full relative">
        {/* Unpin Button */}
        <button
          onClick={handleUnpin}
          disabled={isToggling}
          className={`absolute top-2 right-2 p-1.5 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors ${
            isToggling ? "opacity-50" : ""
          }`}
          title="Remove from priority"
          aria-label={`Remove ${section.title} from priority`}
        >
          <Pin className="h-3 w-3" />
        </button>

        <div className="flex items-start justify-between mb-3 pr-8">
          <div className="flex items-center">
            <Pin className="h-4 w-4 text-yellow-600 mr-2" />
            {section.icon ? (
              <span className="text-2xl mr-2">{section.icon}</span>
            ) : (
              <BookOpen className="h-5 w-5 text-blue-600" />
            )}
          </div>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {section._count?.items || 0} items
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {section.title}
        </h3>

        {section.description && (
          <p className="text-sm text-gray-600 line-clamp-3">
            {section.description}
          </p>
        )}

        <div className="mt-4 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Created{" "}
            {new Date(section.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}

// Special card component for cleaning section
function CleaningSectionCard({
  section,
  onTogglePin,
}: {
  section: ManualSection;
  onTogglePin: (sectionId: string, isPriority: boolean) => void;
}) {
  const [isToggling, setIsToggling] = useState(false);

  const handleUnpin = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsToggling(true);
      await onTogglePin(section.id, false);
      setIsToggling(false);
    },
    [section.id, onTogglePin]
  );

  return (
    <Link href="/cleaning">
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg shadow border-2 border-green-200 hover:border-green-300 transition-colors p-6 h-full relative">
        <div className="absolute top-2 left-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
          Cleaning Hub
        </div>

        <button
          onClick={handleUnpin}
          disabled={isToggling}
          className={`absolute top-2 right-2 p-1.5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors ${
            isToggling ? "opacity-50" : ""
          }`}
          title="Remove from priority"
          aria-label="Remove cleaning procedures from priority"
        >
          <Pin className="h-3 w-3" />
        </button>

        <div className="flex items-start justify-between mb-4 pr-8 pt-6">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center mr-3 border-2 border-green-200">
              <Sparkles className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
            Cleaning Hub
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 text-lg">
          {section.title}
        </h3>

        <p className="text-sm text-gray-600 mb-4">
          {section.description ||
            "Manage all your cleaning tasks and procedures"}
        </p>

        <div className="flex items-center space-x-2 text-xs">
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded flex items-center">
            <Sparkles className="h-3 w-3 mr-1" />
            Dashboard
          </span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Manage Tasks
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-green-100">
          <span className="text-xs text-gray-500 flex items-center">
            <Sparkles className="h-3 w-3 mr-1 text-green-500" />
            Go to Cleaning Dashboard →
          </span>
        </div>
      </div>
    </Link>
  );
}

// SectionCard component for regular sections
function SectionCard({ section }: { section: ManualSection }) {
  return (
    <Link href={`/manual/sections/${section.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 h-full border border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            {section.icon ? (
              <span className="text-2xl mr-3">{section.icon}</span>
            ) : (
              <BookOpen className="h-5 w-5 text-blue-600 mr-3" />
            )}
          </div>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {section._count?.items || 0} items
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {section.title}
        </h3>

        {section.description && (
          <p className="text-sm text-gray-600 line-clamp-3 mb-4">
            {section.description}
          </p>
        )}

        <div className="mt-auto pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Created{" "}
            {new Date(section.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}
