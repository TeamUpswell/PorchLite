"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, BookOpen, Pin, Edit, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { CreatePattern } from "@/components/ui/FloatingActionPresets";

interface ManualSection {
  id: string;
  title: string;
  description?: string;
  icon?: string; // ← Add the icon field
  is_priority?: boolean; // ← Changed from priority to is_priority
  created_at: string;
  _count?: {
    items: number;
  };
}

export default function ManualPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<ManualSection[]>([]);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      console.log("Loading manual sections...");

      const { data: sectionsData, error } = await supabase
        .from("manual_sections")
        .select("*")
        .order("is_priority", { ascending: false }) // ← Changed to is_priority
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Raw sections data:", sectionsData);

      if (!sectionsData || sectionsData.length === 0) {
        console.log("No sections found in database");
        setSections([]);
        return;
      }

      // Now get item counts separately
      const sectionsWithCounts = await Promise.all(
        sectionsData.map(async (section) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from("manual_items")
            .select("id")
            .eq("section_id", section.id);

          if (itemsError) {
            console.error(
              "Error loading items for section:",
              section.id,
              itemsError
            );
          }

          return {
            ...section,
            _count: {
              items: itemsData?.length || 0,
            },
          };
        })
      );

      console.log("Sections with counts:", sectionsWithCounts);
      setSections(sectionsWithCounts);
    } catch (error) {
      console.error("Error loading sections:", error);
    } finally {
      setLoading(false);
    }
  };

  // Split sections into priority and non-priority
  const prioritySections = sections.filter((section) => section.is_priority); // ← Changed to is_priority
  const regularSections = sections.filter((section) => !section.is_priority); // ← Changed to !is_priority

  if (loading) {
    return (
      <StandardPageLayout title="Manual">
        <StandardCard>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading sections...</span>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  // Add toggle pin function
  const handleTogglePin = async (sectionId: string, isPriority: boolean) => {
    try {
      const { error } = await supabase
        .from("manual_sections")
        .update({ is_priority: isPriority })
        .eq("id", sectionId);

      if (error) throw error;

      // Update local state
      setSections((prev) =>
        prev.map((section) =>
          section.id === sectionId
            ? { ...section, is_priority: isPriority }
            : section
        )
      );

      // Show success message
      const message = isPriority
        ? "Section added to priority!"
        : "Section removed from priority!";
      toast.success(message);
    } catch (error) {
      console.error("Error toggling pin status:", error);
      toast.error("Failed to update section");
    }
  };

  return (
    <StandardPageLayout title="Property Manual">
      <div className="space-y-8">
        {/* Priority Sections */}
        {prioritySections.length > 0 && (
          <div>
            <div className="flex items-center mb-4">
              <Pin className="h-5 w-5 text-yellow-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Priority Sections
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {prioritySections.map((section) => (
                <PrioritySectionCard
                  key={section.id}
                  section={section}
                  onTogglePin={handleTogglePin}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Sections */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {prioritySections.length > 0 ? "All Sections" : "Manual Sections"}
            </h2>
            <span className="text-sm text-gray-500">
              {sections.length} section{sections.length !== 1 ? "s" : ""}
            </span>
          </div>

          {regularSections.length > 0 ? (
            <div className="space-y-4">
              {regularSections.map((section) => (
                <FullWidthSectionCard
                  key={section.id}
                  section={section}
                  onTogglePin={handleTogglePin}
                />
              ))}
            </div>
          ) : prioritySections.length === 0 ? (
            <StandardCard>
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No manual sections yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first section to start building your property
                  manual.
                </p>
                <Link
                  href="/manual/sections/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Section
                </Link>
              </div>
            </StandardCard>
          ) : null}
        </div>
      </div>

      {/* Floating Action Button - Add Section */}
      <CreatePattern href="/manual/sections/new" label="Add Section" />
    </StandardPageLayout>
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
