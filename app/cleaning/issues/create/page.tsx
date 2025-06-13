"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
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
import PhotoUpload from "@/components/ui/PhotoUpload"; // Use the new component

const SEVERITY_LEVELS = [
  { id: "Low", label: "Low", color: "bg-blue-100 text-blue-800" },
  { id: "Medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { id: "High", label: "High", color: "bg-red-100 text-red-800" },
];

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
];

export default function CreateCleaningIssuePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { currentProperty } = useProperty();

  const [formLoading, setFormLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]); // Simplified to just URLs

  const [issueData, setIssueData] = useState({
    description: "",
    severity: "Medium",
    location: "",
    notes: "",
  });

  useEffect(() => {
    if (!user && !loading) {
      router.push("/"); // Redirect to home if not logged in
    }
  }, [user, loading, router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setIssueData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !currentProperty) {
      toast.error("You must be logged in and have a property selected");
      return;
    }

    if (!issueData.description || !issueData.severity || !issueData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    setFormLoading(true);

    try {
      // Create the issue record (photos are already uploaded by PhotoUpload component)
      const { error } = await supabase.from("cleaning_issues").insert([
        {
          property_id: currentProperty.id,
          description: issueData.description,
          severity: issueData.severity,
          location: issueData.location,
          photo_urls: photos, // Photos are already uploaded
          reported_by: user.id,
          notes: issueData.notes,
        },
      ]);

      if (error) throw error;

      toast.success("Issue reported successfully");
      router.push("/cleaning/issues");
    } catch (error) {
      console.error("Error reporting issue:", error);
      toast.error("Failed to report issue");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AuthenticatedLayout>
      <div className="p-6">
        <Header title="Create Cleaning Issue" />
        <PageContainer>
          <div className="space-y-6">
            <StandardCard
              title="Report New Issue"
              subtitle="Create a new cleaning issue report"
            >
              <div className="space-y-6">
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
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select location</option>
                      {LOCATIONS.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Severity <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-4">
                      {SEVERITY_LEVELS.map((level) => (
                        <label key={level.id} className="flex items-center">
                          <input
                            type="radio"
                            name="severity"
                            value={level.id}
                            checked={issueData.severity === level.id}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <div
                            className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-all ${
                              issueData.severity === level.id
                                ? level.color +
                                  " ring-2 ring-offset-2 ring-gray-500"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            }`}
                          >
                            {level.label}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Photo Upload - Using New Component */}
                <PhotoUpload
                  photos={photos}
                  onPhotosChange={setPhotos}
                  storageBucket="cleaning-photos"
                  maxPhotos={5}
                  maxSizeMB={5}
                  label="Issue Photos"
                  required={false}
                  gridCols="3"
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
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any other details we should know?"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <Link
                    href="/cleaning/issues"
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className={`px-6 py-2 rounded-md text-white font-medium ${
                      formLoading
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
              </div>
            </StandardCard>
          </div>
        </PageContainer>
      </div>
    </AuthenticatedLayout>
  );
}
