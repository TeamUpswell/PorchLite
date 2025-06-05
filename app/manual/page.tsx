"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  BookOpen,
  Pin,
  Edit,
  Trash2,
  MapPin,
  Sparkles,
} from "lucide-react"; // ✅ ADD Sparkles
import { toast } from "react-hot-toast";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import { CreatePattern } from "@/components/ui/FloatingActionPresets";
import PropertyMap from "@/components/PropertyMap";

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
  const { user } = useAuth();
  const { currentProperty } = useProperty();
  const [sections, setSections] = useState<ManualSection[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ ADD: Function to create default cleaning section
  const createDefaultCleaningSection = async () => {
    if (!currentProperty?.id || !user?.id) {
      console.log(
        "❌ Cannot create cleaning section - missing property or user"
      );
      return null;
    }

    try {
      // Check if cleaning section already exists
      const { data: existingSection, error: checkError } = await supabase
        .from("manual_sections")
        .select("*")
        .eq("title", "Cleaning Procedures")
        .eq("property_id", currentProperty.id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        console.error(
          "Error checking for existing cleaning section:",
          checkError
        );
        return null;
      }

      if (existingSection) {
        console.log("✅ Cleaning section already exists:", existingSection);
        return existingSection;
      }

      // ✅ IMPROVED: Get the next order_index
      const { data: maxOrderData } = await supabase
        .from("manual_sections")
        .select("order_index")
        .eq("property_id", currentProperty.id)
        .order("order_index", { ascending: false })
        .limit(1)
        .single();

      const nextOrderIndex = maxOrderData?.order_index
        ? maxOrderData.order_index + 1
        : 1;

      console.log(
        "🚀 Creating new cleaning section for property:",
        currentProperty.id
      );

      const insertData = {
        title: "Cleaning Procedures",
        description:
          "Cleaning tasks, checklists, and maintenance procedures for your property",
        icon: "✨",
        is_priority: true,
        property_id: currentProperty.id,
        order_index: nextOrderIndex, // ✅ DYNAMIC: Use next available order
      };

      console.log("📝 Insert data:", insertData);

      const { data: newSection, error: createError } = await supabase
        .from("manual_sections")
        .insert(insertData)
        .select()
        .single();

      if (createError) {
        console.error("❌ FULL ERROR DETAILS:", {
          message: createError.message,
          details: createError.details,
          hint: createError.hint,
          code: createError.code,
          insertData: insertData,
        });

        toast.error(`Database error: ${createError.message}`);
        return null;
      }

      console.log("✅ Successfully created cleaning section:", newSection);
      toast.success("Cleaning section created!");
      return newSection;
    } catch (error) {
      console.error("❌ Unexpected error creating cleaning section:", error);
      toast.error(`Unexpected error: ${error}`);
      return null;
    }
  };

  const fetchSections = async () => {
    if (!currentProperty?.id) {
      console.log("❌ No current property, skipping instruction fetch"); // ✅ CHANGED
      return;
    }

    console.log(
      "🔍 Fetching instruction sections for property:",
      currentProperty.id
    ); // ✅ CHANGED
    setLoading(true);

    try {
      // ✅ ALWAYS create cleaning section first
      await createDefaultCleaningSection();

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

      if (error) {
        console.error("❌ Error fetching instruction sections:", error); // ✅ CHANGED
        toast.error("Failed to load instruction sections"); // ✅ CHANGED
      } else {
        console.log("✅ Fetched instruction sections:", data); // ✅ CHANGED

        // ✅ IMPROVED: Sort to put cleaning section first in priority sections
        const sortedData = data?.sort((a, b) => {
          // First, group by priority
          if (a.is_priority !== b.is_priority) {
            return b.is_priority ? 1 : -1;
          }

          // Within priority sections, put cleaning first
          if (a.is_priority && b.is_priority) {
            if (a.title === "Cleaning Procedures") return -1;
            if (b.title === "Cleaning Procedures") return 1;
          }

          // For everything else, sort by creation date
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });

        setSections(sortedData || []);
      }
    } catch (error) {
      console.error("❌ Unexpected error in fetchSections:", error);
      toast.error("Failed to load instruction sections"); // ✅ CHANGED
    } finally {
      setLoading(false);
    }
  };

  // ✅ ADD: Effect to watch for property changes
  useEffect(() => {
    if (currentProperty?.id && user?.id) {
      console.log(
        "🏠 Property loaded, fetching sections:",
        currentProperty.name
      );
      fetchSections();
    } else {
      console.log("⏳ Waiting for property and user to load...");
    }
  }, [currentProperty?.id, user?.id]);

  // Split sections into priority and non-priority
  const prioritySections = sections.filter((section) => section.is_priority); // ← Changed to is_priority
  const regularSections = sections.filter((section) => !section.is_priority); // ← Changed to !is_priority

  if (loading) {
    return (
      <StandardCard>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading instructions...</span>{" "}
          {/* ✅ CHANGED: From "Loading sections..." */}
        </div>
      </StandardCard>
    );
  }

  // Add toggle pin function
  const handleTogglePin = async (sectionId: string, isPriority: boolean) => {
    try {
      const { error } = await supabase
        .from("manual_sections")
        .update({ is_priority: isPriority })
        .eq("id", sectionId);

      if (error) {
        console.error("Error updating section priority:", error);
        toast.error("Failed to update section");
      } else {
        toast.success(isPriority ? "Section pinned" : "Section unpinned");
        fetchSections(); // Refresh sections
      }
    } catch (error) {
      console.error("Unexpected error updating section:", error);
      toast.error("Failed to update section");
    }
  };

  return (
    <ProtectedPageWrapper>
      <PageContainer className="space-y-6">
        <div className="space-y-8">
          {/* ✅ Priority Sections - with cleaning first */}
          {sections.filter((section) => section.is_priority).length > 0 && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sections
                  .filter((section) => section.is_priority)
                  .sort((a, b) => {
                    // ✅ CLEANING SECTION ALWAYS FIRST
                    if (a.title === "Cleaning Procedures") return -1;
                    if (b.title === "Cleaning Procedures") return 1;
                    // Other priority sections sorted by creation date
                    return (
                      new Date(a.created_at).getTime() -
                      new Date(b.created_at).getTime()
                    );
                  })
                  .map((section) => (
                    <PrioritySectionCard
                      key={section.id}
                      section={section}
                      onTogglePin={handleTogglePin}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* ✅ IMPROVED: Regular Sections (non-priority) */}
          {sections.filter((section) => !section.is_priority).length > 0 && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sections
                  .filter((section) => !section.is_priority)
                  .map((section) => (
                    <SectionCard key={section.id} section={section} />
                  ))}
              </div>
            </div>
          )}

          {/* ✅ IMPROVED: Empty state - only show if NO sections at all */}
          {sections.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No instruction sections yet{" "}
                {/* ✅ CHANGED: From "No sections yet" */}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first instruction section.{" "}
                {/* ✅ CHANGED: From "manual section" */}
              </p>
            </div>
          )}
        </div>
        {/* ✅ KEEP this floating action button */}
        <CreatePattern
          href="/manual/sections/new"
          label="Add Instructions"
        />{" "}
        {/* ✅ CHANGED: From "Add Section" */}
      </PageContainer>
    </ProtectedPageWrapper>
  );
}

// Priority Section Card Component (Compact Cards) - WITH ICONS
function PrioritySectionCard({
  section,
  onTogglePin,
}: {
  section: ManualSection;
  onTogglePin: (sectionId: string, isPriority: boolean) => void;
}) {
  // Check if this is the cleaning section
  if (section.title === "Cleaning Procedures") {
    return <CleaningSectionCard section={section} onTogglePin={onTogglePin} />;
  }

  // Regular priority section card for other sections
  const [isToggling, setIsToggling] = useState(false);

  const handleUnpin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsToggling(true);
    await onTogglePin(section.id, false);
    setIsToggling(false);
  };

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
        >
          <Pin className="h-3 w-3" />
        </button>

        <div className="flex items-start justify-between mb-3 pr-8">
          <div className="flex items-center">
            <Pin className="h-4 w-4 text-yellow-600 mr-2" />
            {/* Display the icon from database */}
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

// Full Width Section Card Component - WITH PIN TOGGLE
function FullWidthSectionCard({
  section,
  onTogglePin,
}: {
  section: ManualSection;
  onTogglePin: (sectionId: string, isPriority: boolean) => void;
}) {
  const [isToggling, setIsToggling] = useState(false);

  const handlePinToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsToggling(true);
    await onTogglePin(section.id, !section.is_priority);
    setIsToggling(false);
  };

  return (
    <Link href={`/manual/sections/${section.id}`}>
      <StandardCard className="hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {/* Display the icon from database or fallback to BookOpen */}
              {section.icon ? (
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <span className="text-2xl">{section.icon}</span>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {section.title}
              </h3>
              {section.description && (
                <p className="text-gray-600 line-clamp-2">
                  {section.description}
                </p>
              )}
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>
                  {section._count?.items || 0} item{" "}
                  {section._count?.items !== 1 ? "s" : ""}
                </span>
                <span>
                  Created{" "}
                  {new Date(section.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Pin Toggle Button */}
            <button
              onClick={handlePinToggle}
              disabled={isToggling}
              className={`p-2 rounded-lg transition-colors ${
                section.is_priority
                  ? "text-yellow-600 bg-yellow-50 hover:bg-yellow-100"
                  : "text-gray-400 hover:text-yellow-600 hover:bg-yellow-50"
              } ${isToggling ? "opacity-50" : ""}`}
              title={
                section.is_priority ? "Remove from priority" : "Add to priority"
              }
            >
              <Pin className="h-4 w-4" />
            </button>

            {/* Edit Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/manual/sections/${section.id}/edit`;
              }}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit section"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
        </div>
      </StandardCard>
    </Link>
  );
}

// ✅ ADD: Special card component for cleaning section
function CleaningSectionCard({
  section,
  onTogglePin,
}: {
  section: ManualSection;
  onTogglePin: (sectionId: string, isPriority: boolean) => void;
}) {
  const [isToggling, setIsToggling] = useState(false);

  const handleUnpin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsToggling(true);
    await onTogglePin(section.id, false);
    setIsToggling(false);
  };

  return (
    <Link href={`/manual/sections/${section.id}`}>
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg shadow border-2 border-green-200 hover:border-green-300 transition-colors p-6 h-full relative">
        {/* Special badge for cleaning */}
        <div className="absolute top-2 left-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
          Cleaning Hub
        </div>

        {/* Unpin Button */}
        <button
          onClick={handleUnpin}
          disabled={isToggling}
          className={`absolute top-2 right-2 p-1.5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors ${
            isToggling ? "opacity-50" : ""
          }`}
          title="Remove from priority"
        >
          <Pin className="h-3 w-3" />
        </button>

        <div className="flex items-start justify-between mb-4 pr-8 pt-6">
          <div className="flex items-center">
            {/* ✅ UPDATED: Use Sparkles icon with gradient background */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center mr-3 border-2 border-green-200">
              <Sparkles className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
            {section._count?.items || 0} tasks
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 text-lg">
          {section.title}
        </h3>

        <p className="text-sm text-gray-600 mb-4">
          {section.description ||
            "Manage all your cleaning tasks and procedures"}
        </p>

        {/* ✅ UPDATED: Quick actions with sparkle theme */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded flex items-center">
            <Sparkles className="h-3 w-3 mr-1" />
            Add Tasks
          </span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
            View Checklists
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-green-100">
          <span className="text-xs text-gray-500 flex items-center">
            <Sparkles className="h-3 w-3 mr-1 text-green-500" />
            Cleaning Management Center
          </span>
        </div>
      </div>
    </Link>
  );
}

// ✅ ADD: Missing SectionCard component for regular sections
function SectionCard({ section }: { section: ManualSection }) {
  return (
    <Link href={`/manual/sections/${section.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 h-full border border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            {/* Display the icon from database */}
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
