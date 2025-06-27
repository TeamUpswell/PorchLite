"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthenticatedLayout from "@/components/auth/AuthenticatedLayout";
import { supabase } from "@/lib/supabase";
import { useProperty } from "@/lib/hooks/useProperty";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import PhotoUpload from "@/components/ui/PhotoUpload";

// Types
interface IssueData {
  description: string;
  severity: string;
  location: string;
  notes: string;
}

// Constants
const SEVERITY_LEVELS = [
  { id: "Low", label: "Low", color: "bg-blue-100 text-blue-800" },
  { id: "Medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { id: "High", label: "High", color: "bg-red-100 text-red-800" },
] as const;

const LOCATIONS = [
  "Kitchen",
  "Living Room",
  "Master Bedroom",
  "Guest Bedroom",
  "Master Bathroom",
  "Guest Bathroom",
  "Hallway",
  "Outdoor Area",
  "Other",
] as const;

export default function CreateCleaningIssuePage() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const router = useRouter();

  const [formLoading, setFormLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [issueData, setIssueData] = useState<IssueData>({
    description: "",
    severity: "Medium",
    location: "",
    notes: "",
  });

  // Ref to track component mount
  const mountedRef = useRef(true);

  // Memoize loading states
  const isLoading = useMemo(() => {
    return authLoading || propertyLoading;
  }, [authLoading, propertyLoading]);

  // Component cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Auth redirect effect
  useEffect(() => {
    if (!user && !authLoading) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Memoized form validation
  const isFormValid = useMemo(() => {
    return (
      issueData.description.trim() !== "" &&
      issueData.severity !== "" &&
      issueData.location !== "" &&
      currentProperty?.id
    );
  }, [
    issueData.description,
    issueData.severity,
    issueData.location,
    currentProperty?.id,
  ]);

  // Optimized form handlers
  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value } = e.target;
      setIssueData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handlePhotosChange = useCallback((newPhotos: string[]) => {
    setPhotos(newPhotos);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!user || !currentProperty) {
        toast.error("You must be logged in and have a property selected");
        return;
      }

      if (!isFormValid) {
        toast.error("Please fill in all required fields");
        return;
      }

      setFormLoading(true);

      try {
        console.log("🐛 Submitting cleaning issue:", {
          property_id: currentProperty.id,
          description: issueData.description,
          severity: issueData.severity,
          location: issueData.location,
          photoCount: photos.length,
        });

        // Create the issue record
        const { data, error } = await supabase
          .from("tasks")
          .insert([
            {
              property_id: currentProperty.id,
              description: issueData.description.trim(),
              severity: issueData.severity,
              location: issueData.location,
              photo_urls: photos,
              reported_by: user.id,
              notes: issueData.notes.trim() || null,
              created_at: new Date().toISOString(),
            },
          ])
          .select();

        if (error) throw error;

        console.log("✅ Cleaning issue created successfully:", data?.[0]?.id);

        if (mountedRef.current) {
          toast.success("Issue reported successfully");
          // Small delay to show success message before redirecting
          setTimeout(() => {
            if (mountedRef.current) {
              router.push("/cleaning/issues");
            }
          }, 1000);
        }
      } catch (error) {
        console.error("❌ Error reporting issue:", error);
        if (mountedRef.current) {
          toast.error("Failed to report issue");
        }
      } finally {
        if (mountedRef.current) {
          setFormLoading(false);
        }
      }
    },
    [user, currentProperty, isFormValid, issueData, photos, router]
  );

  const handleCancel = useCallback(() => {
    // TODO: Add confirmation if form has been modified
    router.push("/cleaning/issues");
  }, [router]);

  // Memoized severity level buttons
  const severityButtons = useMemo(
    () =>
      SEVERITY_LEVELS.map((level) => (
        <label key={level.id} className="flex items-center">
          <input
            type="radio"
            name="severity"
            value={level.id}
            checked={issueData.severity === level.id}
            onChange={handleChange}
            className="sr-only"
            disabled={formLoading}
          />
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-all ${
              issueData.severity === level.id
                ? level.color + " ring-2 ring-offset-2 ring-gray-500"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            } ${formLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {level.label}
          </div>
        </label>
      )),
    [issueData.severity, handleChange, formLoading]
  );

  // Memoized location options
  const locationOptions = useMemo(
    () =>
      LOCATIONS.map((location) => (
        <option key={location} value={location}>
          {location}
        </option>
      )),
    []
  );

  // Loading states
  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="p-6">
          <Header title="Create Cleaning Issue" />
          <PageContainer>
            <StandardCard>
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">⏳ Loading form...</p>
                </div>
              </div>
            </StandardCard>
          </PageContainer>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!user) {
    return null;
  }

  if (!currentProperty) {
    return (
      <AuthenticatedLayout>
        <div className="p-6">
          <Header title="Create Cleaning Issue" />
          <PageContainer>
            <StandardCard>
              <div className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Property Selected
                </h3>
                <p className="text-gray-500 mb-4">
                  Please select a property to report an issue.
                </p>
                <Link
                  href="/cleaning/issues"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Issues
                </Link>
              </div>
            </StandardCard>
          </PageContainer>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="p-6">
        <Header title="Create Cleaning Issue" />
        <PageContainer>
          <div className="space-y-6">
            {/* Back link */}
            <div>
              <Link
                href="/cleaning/issues"
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Issues
              </Link>
            </div>

            <StandardCard
              title="Report New Issue"
              subtitle={`Create a new cleaning issue report for ${currentProperty.name}`}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Issue Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={issueData.description}
                    onChange={handleChange}
                    required
                    disabled={formLoading}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="Describe the issue in detail"
                  />
                </div>

                {/* Location & Severity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Location <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="location"
                      name="location"
                      value={issueData.location}
                      onChange={handleChange}
                      required
                      disabled={formLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <option value="">Select location</option>
                      {locationOptions}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Severity <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-4">{severityButtons}</div>
                  </div>
                </div>

                {/* Photo Upload */}
                <PhotoUpload
                  photos={photos}
                  onPhotosChange={handlePhotosChange}
                  storageBucket="cleaning-photos"
                  maxPhotos={5}
                  maxSizeMB={5}
                  label="Issue Photos"
                  required={false}
                  gridCols="3"
                  disabled={formLoading}
                />

                {/* Additional Notes */}
                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Additional Notes{" "}
                    <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={issueData.notes}
                    onChange={handleChange}
                    disabled={formLoading}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="Any other details we should know?"
                  />
                </div>

                {/* Form Validation Feedback */}
                {!isFormValid && (
                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                    <p className="font-medium mb-1">Please complete:</p>
                    <ul className="space-y-1 text-xs">
                      {!issueData.description.trim() && (
                        <li>• Issue description</li>
                      )}
                      {!issueData.location && <li>• Location selection</li>}
                      {!currentProperty && <li>• Property selection</li>}
                    </ul>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={formLoading}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading || !isFormValid}
                    className={`px-6 py-2 rounded-md text-white font-medium transition-colors ${
                      formLoading || !isFormValid
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {formLoading ? (
                      <div className="flex items-center">
                        <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      "Submit Issue Report"
                    )}
                  </button>
                </div>
              </form>
            </StandardCard>
          </div>
        </PageContainer>
      </div>
    </AuthenticatedLayout>
  );
}
