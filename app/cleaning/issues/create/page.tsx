"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth";
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
  const { user } = useAuth();
  const router = useRouter();
  const { currentProperty } = useProperty();

  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]); // Simplified to just URLs

  const [issueData, setIssueData] = useState({
    description: "",
    severity: "Medium",
    location: "",
    notes: "",
  });

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

    setLoading(true);

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
      setLoading(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link
            href="/cleaning/issues"
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Issues
          </Link>
        </div>

        {!currentProperty ? (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">No Property Selected</h2>
            <p className="text-gray-600">
              Please select a property from your account settings to report
              issues.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold mb-6">
              {currentProperty.name} - Report Cleaning Issue
            </h1>

            <div className="bg-white p-6 rounded-lg shadow-md">
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
                    disabled={loading}
                    className={`px-6 py-2 rounded-md text-white font-medium ${
                      loading
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {loading ? (
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
            </div>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
