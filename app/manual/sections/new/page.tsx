"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import { Save, ArrowLeft, FileText, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

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

export default function NewManualSectionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    icon: "📄",
    is_priority: false,
  });

  // Refs for optimization
  const mountedRef = useRef(true);
  const submittingRef = useRef(false);

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

  // Memoized form validation
  const isFormValid = useMemo(() => {
    return formData.title.trim().length > 0;
  }, [formData.title]);

  // Memoized input handlers
  const handleInputChange = useCallback(
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

  // Optimized save handler
  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Prevent duplicate submissions
      if (
        submittingRef.current ||
        saving ||
        !mountedRef.current ||
        !isFormValid
      ) {
        return;
      }

      if (!currentProperty?.id || !user?.id) {
        setError("Missing property or user information");
        return;
      }

      submittingRef.current = true;
      setSaving(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("manual_sections")
          .insert({
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            icon: formData.icon,
            is_priority: formData.is_priority,
            property_id: currentProperty.id,
            created_by: user.id,
          })
          .select()
          .single();

        if (!mountedRef.current) {
          console.log("⚠️ Component unmounted, aborting");
          return;
        }

        if (error) {
          console.error("❌ Error creating manual section:", error);
          setError(error.message || "Failed to create manual section");
          toast.error("Failed to create manual section");
        } else {
          console.log("✅ Manual section created successfully:", data);
          toast.success("Manual section created successfully!");

          // Navigate to the new section
          router.push(`/manual/sections/${data.id}`);
        }
      } catch (error) {
        console.error("❌ Unexpected error creating manual section:", error);
        if (mountedRef.current) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to create manual section";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (mountedRef.current) {
          setSaving(false);
        }
        submittingRef.current = false;
      }
    },
    [formData, currentProperty?.id, user?.id, saving, isFormValid, router]
  );

  // Memoized cancel handler
  const handleCancel = useCallback(() => {
    router.push("/manual");
  }, [router]);

  // Loading state
  if (isInitializing) {
    return (
      <div className="p-6">
        <Header title="New Manual Section" />
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-600">⏳ Loading...</p>
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

  if (!currentProperty) {
    return (
      <div className="p-6">
        <Header title="New Manual Section" />
        <PageContainer>
          <StandardCard
            title="No Property Selected"
            subtitle="Please select a property to create a manual section"
          >
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Property Selected
              </h3>
              <p className="text-gray-600 mb-4">
                You need to select a property first to create manual sections.
              </p>
              <Link
                href="/properties"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Select Property
              </Link>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Header title="New Manual Section" />
      <PageContainer>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  New Manual Section
                </h1>
                <p className="text-gray-600">
                  Create a new section for {currentProperty.name}
                </p>
              </div>
            </div>
            <Link
              href="/manual"
              className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Manual
            </Link>
          </div>

          {/* Error Display */}
          {error && (
            <StandardCard>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            </StandardCard>
          )}

          {/* Form */}
          <StandardCard title="Section Details">
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Section Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={handleInputChange("title")}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  placeholder="e.g., Kitchen Appliances, WiFi Setup, House Rules"
                  required
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.title.length}/100 characters
                </p>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={handleInputChange("description")}
                  disabled={saving}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  placeholder="Brief description of what this section covers..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/500 characters
                </p>
              </div>

              <div>
                <label
                  htmlFor="icon"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Icon
                </label>
                <select
                  id="icon"
                  value={formData.icon}
                  onChange={handleInputChange("icon")}
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

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_priority"
                  checked={formData.is_priority}
                  onChange={handleInputChange("is_priority")}
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

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !isFormValid}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Section
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
