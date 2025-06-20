"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import { Save, ArrowLeft, FileText, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface ManualSection {
  id: string;
  title: string;
  description?: string;
  icon: string;
  is_priority: boolean;
  property_id: string;
  created_by: string;
  created_at: string;
}

interface FormData {
  title: string;
  description: string;
  icon: string;
  is_priority: boolean;
}

const ICON_OPTIONS = [
  { value: "📄", label: "File Text" },
  { value: "🏠", label: "Home" },
  { value: "📶", label: "WiFi" },
  { value: "📺", label: "TV" },
  { value: "🚗", label: "Parking" },
  { value: "🍴", label: "Kitchen" },
  { value: "🛏️", label: "Bedroom" },
  { value: "🚿", label: "Bathroom" },
  { value: "📋", label: "Instructions" },
  { value: "🔧", label: "Maintenance" },
  { value: "📞", label: "Emergency" },
  { value: "ℹ️", label: "Information" },
] as const;

export default function EditManualSectionPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();

  const [section, setSection] = useState<ManualSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Consolidated form state
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    icon: "📄",
    is_priority: false,
  });

  // Refs for optimization
  const mountedRef = useRef(true);
  const savingRef = useRef(false);
  const originalDataRef = useRef<FormData | null>(null);

  const sectionId = params?.id as string;

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

  // Load section data
  const loadSection = useCallback(async () => {
    if (!sectionId || !user?.id || !mountedRef.current) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("📝 Loading section for edit:", sectionId);

      const { data: sectionData, error } = await supabase
        .from("manual_sections")
        .select("*")
        .eq("id", sectionId)
        .single();

      if (!mountedRef.current) {
        console.log("⚠️ Component unmounted, aborting");
        return;
      }

      if (error) {
        if (error.code === "PGRST116") {
          setError("Section not found");
        } else {
          console.error("❌ Error fetching section:", error);
          setError("Failed to load section");
        }
        setSection(null);
        return;
      }

      // Verify property access
      if (
        currentProperty?.id &&
        sectionData.property_id !== currentProperty.id
      ) {
        setError("Section belongs to a different property");
        return;
      }

      // Verify ownership or admin access
      if (sectionData.created_by !== user.id) {
        console.warn(
          "⚠️ User doesn't own this section, checking admin access..."
        );
        // You might want to add admin check here
      }

      console.log("✅ Section loaded successfully:", sectionData.title);
      setSection(sectionData);

      // Set form data
      const initialFormData: FormData = {
        title: sectionData.title,
        description: sectionData.description || "",
        icon: sectionData.icon,
        is_priority: sectionData.is_priority,
      };

      setFormData(initialFormData);
      originalDataRef.current = { ...initialFormData };
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
  }, [sectionId, user?.id, currentProperty?.id]);

  // Main loading effect
  useEffect(() => {
    if (isInitializing) {
      return;
    }

    if (!user?.id) {
      console.log("⏳ Waiting for user...");
      if (mountedRef.current) {
        setLoading(false);
      }
      return;
    }

    if (!sectionId) {
      console.log("⚠️ No section ID provided");
      if (mountedRef.current) {
        setLoading(false);
        setError("No section ID provided");
      }
      return;
    }

    loadSection();
  }, [user?.id, sectionId, isInitializing, loadSection]);

  // Memoized form change handler
  const handleFormChange = useCallback(
    (field: keyof FormData) => {
      return (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      ) => {
        if (!mountedRef.current) return;

        const value =
          e.target.type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : e.target.value;

        setFormData((prev) => ({ ...prev, [field]: value }));

        // Clear error when user starts typing
        if (error) {
          setError(null);
        }
      };
    },
    [error]
  );

  // Form validation
  const isFormValid = useMemo(() => {
    return formData.title.trim().length > 0;
  }, [formData.title]);

  // Check if form has changes
  const hasChanges = useMemo(() => {
    if (!originalDataRef.current) return false;

    const original = originalDataRef.current;
    return (
      formData.title !== original.title ||
      formData.description !== original.description ||
      formData.icon !== original.icon ||
      formData.is_priority !== original.is_priority
    );
  }, [formData]);

  // Save handler
  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Prevent duplicate saves
      if (savingRef.current || saving || !mountedRef.current || !isFormValid) {
        return;
      }

      if (!section?.id) {
        setError("Section not loaded");
        return;
      }

      savingRef.current = true;
      setSaving(true);
      setError(null);

      try {
        console.log("💾 Saving section changes...");

        const { error } = await supabase
          .from("manual_sections")
          .update({
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            icon: formData.icon,
            is_priority: formData.is_priority,
          })
          .eq("id", section.id);

        if (!mountedRef.current) {
          console.log("⚠️ Component unmounted, aborting");
          return;
        }

        if (error) {
          console.error("❌ Error updating section:", error);
          setError(error.message || "Failed to update section");
          toast.error("Failed to update section");
        } else {
          console.log("✅ Section updated successfully");
          toast.success("Section updated successfully!");

          // Update original data reference
          originalDataRef.current = { ...formData };

          router.push(`/manual/sections/${section.id}`);
        }
      } catch (error) {
        console.error("❌ Unexpected error updating section:", error);
        if (mountedRef.current) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to update section";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (mountedRef.current) {
          setSaving(false);
        }
        savingRef.current = false;
      }
    },
    [formData, section?.id, saving, isFormValid, router]
  );

  // Retry function
  const retryLoad = useCallback(() => {
    if (sectionId && user?.id) {
      setError(null);
      loadSection();
    }
  }, [sectionId, user?.id, loadSection]);

  // Loading state
  if (isInitializing || loading) {
    return (
      <div className="p-6">
        <Header title="Edit Manual Section" />
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-600">
                  {isInitializing
                    ? "⏳ Initializing..."
                    : "📝 Loading section..."}
                </p>
              </div>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <Header title="Edit Manual Section" />
        <PageContainer>
          <StandardCard
            title="Error Loading Section"
            subtitle="Unable to load the requested section"
          >
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {error === "Section not found"
                  ? "Section Not Found"
                  : "Error Loading Section"}
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
        <Header title="Edit Manual Section" />
        <PageContainer>
          <StandardCard
            title="Section Not Found"
            subtitle="The requested manual section could not be found"
          >
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Section Not Found
              </h3>
              <p className="text-gray-600 mb-4">
                The manual section you're trying to edit doesn't exist.
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
      <Header title="Edit Manual Section" />
      <PageContainer>
        <div className="space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Link href="/manual" className="hover:text-blue-600">
              Manual
            </Link>
            <span>›</span>
            <Link
              href={`/manual/sections/${section.id}`}
              className="hover:text-blue-600"
            >
              {section.title}
            </Link>
            <span>›</span>
            <span className="text-gray-900">Edit</span>
          </div>

          <StandardCard
            title={`Edit Section: ${section.title}`}
            subtitle={`${
              currentProperty?.name || "Unknown Property"
            } • Created ${new Date(section.created_at).toLocaleDateString()}`}
            headerActions={
              <div className="flex items-center gap-2">
                <Link
                  href={`/manual/sections/${section.id}`}
                  className="inline-flex items-center px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Cancel
                </Link>
                {hasChanges && (
                  <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    Unsaved changes
                  </span>
                )}
              </div>
            }
          >
            <form onSubmit={handleSave} className="space-y-6">
              {/* Title field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={handleFormChange("title")}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  placeholder="Enter section title..."
                  required
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.title.length}/100 characters
                </p>
              </div>

              {/* Description field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={handleFormChange("description")}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  rows={3}
                  placeholder="Brief description of what this section covers..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/500 characters
                </p>
              </div>

              {/* Icon field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <select
                  value={formData.icon}
                  onChange={handleFormChange("icon")}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                >
                  {ICON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value} {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_priority"
                  checked={formData.is_priority}
                  onChange={handleFormChange("is_priority")}
                  disabled={saving}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
                <label
                  htmlFor="is_priority"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Mark as priority section (appears at top)
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Link
                  href={`/manual/sections/${section.id}`}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving || !isFormValid || !hasChanges}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </StandardCard>

          {/* Preview */}
          {formData.title && (
            <StandardCard title="Preview">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{formData.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {formData.title}
                    </h3>
                    {formData.description && (
                      <p className="text-sm text-gray-600">
                        {formData.description}
                      </p>
                    )}
                  </div>
                  {formData.is_priority && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      Priority
                    </span>
                  )}
                </div>
              </div>
            </StandardCard>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
