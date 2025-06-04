"use client";

import { useState, useEffect } from "react";
import { useProperty } from "@/lib/hooks/useProperty";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { supabase } from "@/lib/supabase";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import {
  Navigation,
  ArrowLeft,
  ArrowRight,
  Camera,
  Settings,
  Plus,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import PermissionsDebug from "@/components/debug/PermissionsDebug";

interface WalkthroughSection {
  id: string;
  title: string;
  description: string;
  order_index: number;
  walkthrough_steps: WalkthroughStep[];
}

interface WalkthroughStep {
  id: string;
  title: string;
  content: string;
  photo_urls: string[];
  order_index: number;
}

export default function WalkthroughPage() {
  const { currentProperty, refreshProperty } = useProperty();
  const { canManageProperty, userRole } = usePermissions();
  const [sections, setSections] = useState<WalkthroughSection[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tourEnabled, setTourEnabled] = useState(true);
  const [updatingTourStatus, setUpdatingTourStatus] = useState(false);

  // Flatten all steps from all sections for easy navigation
  const allSteps = sections.flatMap((section) =>
    section.walkthrough_steps.map((step) => ({
      ...step,
      sectionTitle: section.title,
      sectionId: section.id,
    }))
  );

  useEffect(() => {
    if (currentProperty?.id) {
      setTourEnabled(currentProperty.house_tour_enabled ?? true);
      if (currentProperty.house_tour_enabled !== false) {
        loadWalkthrough();
      } else {
        setLoading(false);
      }
    }
  }, [currentProperty]);

  const loadWalkthrough = async () => {
    if (!currentProperty?.id) return;

    try {
      const { data, error } = await supabase
        .from("walkthrough_sections")
        .select(
          `
          *,
          walkthrough_steps (
            id,
            title,
            content,
            photo_urls,
            order_index
          )
        `
        )
        .eq("property_id", currentProperty.id)
        .order("order_index", { ascending: true });

      if (error) throw error;

      // Sort steps within each section
      const sortedSections = data.map((section) => ({
        ...section,
        walkthrough_steps: section.walkthrough_steps.sort(
          (a, b) => a.order_index - b.order_index
        ),
      }));

      setSections(sortedSections);
    } catch (error) {
      console.error("Error loading walkthrough:", error);
      toast.error("Failed to load walkthrough");
    } finally {
      setLoading(false);
    }
  };

  const toggleTourEnabled = async () => {
    if (!currentProperty?.id || !canManageProperty()) return;

    setUpdatingTourStatus(true);
    try {
      const newStatus = !tourEnabled;

      const { error } = await supabase
        .from("properties")
        .update({ house_tour_enabled: newStatus })
        .eq("id", currentProperty.id);

      if (error) throw error;

      setTourEnabled(newStatus);
      toast.success(newStatus ? "House tour enabled" : "House tour disabled");

      // Refresh property data
      if (refreshProperty) {
        refreshProperty();
      }

      // Load/clear walkthrough data based on new status
      if (newStatus) {
        loadWalkthrough();
      } else {
        setSections([]);
      }
    } catch (error) {
      console.error("Error updating tour status:", error);
      toast.error("Failed to update tour status");
    } finally {
      setUpdatingTourStatus(false);
    }
  };

  const nextStep = () => {
    if (currentStepIndex < allSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const currentStep = allSteps[currentStepIndex];

  // Show property selection if no property
  if (!currentProperty) {
    return (
      <StandardPageLayout
        title="House Walkthrough"
        subtitle="Get familiar with your vacation home"
        headerIcon={<Navigation className="h-6 w-6 text-blue-600" />}
        breadcrumb={[
          { label: "The House", href: "/house" },
          { label: "Walkthrough" },
        ]}
      >
        <StandardCard>
          <div className="text-center py-8">
            <Navigation className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Property Selected
            </h3>
            <p className="text-gray-500 mb-4">
              Please select a property to view its walkthrough.
            </p>
            <Link
              href="/account/properties"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Select Property
            </Link>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <StandardPageLayout
        title="House Walkthrough"
        subtitle={`Loading walkthrough for ${currentProperty.name}`}
        headerIcon={<Navigation className="h-6 w-6 text-blue-600" />}
        breadcrumb={[
          { label: "The House", href: "/house" },
          { label: "Walkthrough" },
        ]}
      >
        <StandardCard>
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent mx-auto mb-3"></div>
            <p className="text-gray-500">Loading walkthrough...</p>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  // Show disabled state
  if (!tourEnabled) {
    return (
      <StandardPageLayout
        title="House Walkthrough"
        subtitle={`Walkthrough for ${currentProperty.name}`}
        headerIcon={<Navigation className="h-6 w-6 text-gray-600" />}
        breadcrumb={[
          { label: "The House", href: "/house" },
          { label: "Walkthrough" },
        ]}
      >
        <div className="space-y-6">
          {/* Tour Toggle for Managers */}
          {canManageProperty() && (
            <StandardCard>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    House Tour Status
                  </h3>
                  <p className="text-sm text-gray-600">
                    Control whether guests can access the house walkthrough
                  </p>
                </div>
                <button
                  onClick={toggleTourEnabled}
                  disabled={updatingTourStatus}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    updatingTourStatus
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : tourEnabled
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-red-100 text-red-700 hover:bg-red-200"
                  }`}
                >
                  {updatingTourStatus ? (
                    <div className="h-4 w-4 border-2 border-gray-400 rounded-full animate-spin border-t-transparent" />
                  ) : tourEnabled ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                  <span>{tourEnabled ? "Enabled" : "Disabled"}</span>
                </button>
              </div>
            </StandardCard>
          )}

          {/* Disabled State */}
          <StandardCard>
            <div className="text-center py-8">
              <EyeOff className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                House Tour Disabled
              </h3>
              <p className="text-gray-500 mb-4">
                The house walkthrough has been disabled for this property.
              </p>

              {canManageProperty() ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    As a {userRole}, you can enable the house tour and manage
                    its content.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      onClick={toggleTourEnabled}
                      disabled={updatingTourStatus}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Enable House Tour
                    </button>
                    <Link
                      href="/house/walkthrough/manage"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Content
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Contact the property owner if you need access to the house
                  tour.
                </p>
              )}
            </div>
          </StandardCard>
        </div>
      </StandardPageLayout>
    );
  }

  // Show empty state with management options for authorized users
  if (sections.length === 0 || allSteps.length === 0) {
    return (
      <StandardPageLayout
        title="House Walkthrough"
        subtitle={`Walkthrough for ${currentProperty.name}`}
        headerIcon={<Navigation className="h-6 w-6 text-blue-600" />}
        breadcrumb={[
          { label: "The House", href: "/house" },
          { label: "Walkthrough" },
        ]}
      >
        <div className="space-y-6">
          {/* Tour Toggle for Managers */}
          {canManageProperty() && (
            <StandardCard>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    House Tour Status
                  </h3>
                  <p className="text-sm text-gray-600">
                    Control whether guests can access the house walkthrough
                  </p>
                </div>
                <button
                  onClick={toggleTourEnabled}
                  disabled={updatingTourStatus}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    updatingTourStatus
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {updatingTourStatus ? (
                    <div className="h-4 w-4 border-2 border-gray-400 rounded-full animate-spin border-t-transparent" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span>Enabled</span>
                </button>
              </div>
            </StandardCard>
          )}

          <StandardCard>
            <div className="text-center py-8">
              <Navigation className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Walkthrough Content
              </h3>
              <p className="text-gray-500 mb-4">
                The house walkthrough content hasn't been created yet.
              </p>

              {canManageProperty() ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Link
                      href="/house/walkthrough/manage"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Walkthrough
                    </Link>
                    <Link
                      href="/house/walkthrough/test"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Test Data
                    </Link>
                  </div>
                  <p className="text-xs text-gray-500">
                    As a {userRole}, you can create and manage walkthrough
                    content
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  The property owner will create the walkthrough content soon.
                </p>
              )}
            </div>
          </StandardCard>
        </div>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout
      title="House Walkthrough"
      subtitle="Get familiar with your vacation home"
      headerIcon={<Navigation className="h-6 w-6 text-blue-600" />}
      breadcrumb={[
        { label: "The House", href: "/house" },
        { label: "Walkthrough" },
      ]}
    >
      <div className="space-y-6">
        {/* Tour Toggle and Management Link for Authorized Users */}
        {canManageProperty() && (
          <StandardCard>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  House Tour Controls
                </h3>
                <p className="text-sm text-gray-600">
                  Manage tour visibility and content
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  href="/house/walkthrough/manage"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Manage
                </Link>
                <button
                  onClick={toggleTourEnabled}
                  disabled={updatingTourStatus}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors ${
                    updatingTourStatus
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {updatingTourStatus ? (
                    <div className="h-4 w-4 border-2 border-gray-400 rounded-full animate-spin border-t-transparent" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="text-sm">Enabled</span>
                </button>
              </div>
            </div>
          </StandardCard>
        )}

        {/* Progress Bar */}
        <StandardCard>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>
                Step {currentStepIndex + 1} of {allSteps.length}
              </span>
              <span>
                {Math.round(((currentStepIndex + 1) / allSteps.length) * 100)}%
                Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStepIndex + 1) / allSteps.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Section Info */}
          {currentStep && (
            <div className="text-sm text-gray-500">
              Section: {currentStep.sectionTitle}
            </div>
          )}
        </StandardCard>

        {/* Current Step */}
        {currentStep && (
          <StandardCard title={currentStep.title}>
            <div className="space-y-6">
              {/* Step Images */}
              {currentStep.photo_urls && currentStep.photo_urls.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentStep.photo_urls.map((photoUrl, index) => (
                    <div key={index} className="aspect-video relative">
                      <img
                        src={photoUrl}
                        alt={`${currentStep.title} - Photo ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border border-gray-200 shadow-sm"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">
                      Photo of {currentStep.title}
                    </p>
                    {canManageProperty() && (
                      <p className="text-xs text-gray-400 mt-1">
                        Add photos in walkthrough management
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step Content */}
              <div>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {currentStep.content}
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <button
                  onClick={prevStep}
                  disabled={currentStepIndex === 0}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    currentStepIndex === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </button>

                {/* Step Dots */}
                <div className="flex space-x-2 max-w-xs overflow-x-auto">
                  {allSteps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStepIndex(index)}
                      className={`w-3 h-3 rounded-full transition-colors flex-shrink-0 ${
                        index === currentStepIndex
                          ? "bg-blue-600"
                          : index < currentStepIndex
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>

                {currentStepIndex === allSteps.length - 1 ? (
                  <Link
                    href="/house"
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Complete Tour
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                ) : (
                  <button
                    onClick={nextStep}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                )}
              </div>
            </div>
          </StandardCard>
        )}

        {/* Section Overview */}
        {sections.length > 1 && (
          <StandardCard title="Walkthrough Sections">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sections.map((section, sectionIndex) => {
                const sectionStartIndex = sections
                  .slice(0, sectionIndex)
                  .reduce((acc, s) => acc + s.walkthrough_steps.length, 0);

                const isCurrentSection =
                  currentStepIndex >= sectionStartIndex &&
                  currentStepIndex <
                    sectionStartIndex + section.walkthrough_steps.length;

                return (
                  <button
                    key={section.id}
                    onClick={() => setCurrentStepIndex(sectionStartIndex)}
                    className={`text-left p-4 rounded-lg border transition-colors ${
                      isCurrentSection
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <h4 className="font-medium text-gray-900">
                      {section.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {section.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {section.walkthrough_steps.length} steps
                    </p>
                  </button>
                );
              })}
            </div>
          </StandardCard>
        )}
      </div>
      {process.env.NODE_ENV === "development" && (
        <StandardCard title="Ownership Check">
          <div className="text-sm space-y-2">
            <div>
              My User ID:{" "}
              <code className="bg-yellow-100 px-2 py-1 rounded">
                491e99c0-e470-43e9-af67-66eaa67bbeae
              </code>
            </div>
            <div>
              Property Owner:{" "}
              <code className="bg-blue-100 px-2 py-1 rounded">
                {currentProperty?.created_by || "null"}
              </code>
            </div>
            <div>
              Match:{" "}
              <span
                className={`font-bold ${
                  currentProperty?.created_by ===
                  "491e99c0-e470-43e9-af67-66eaa67bbeae"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {currentProperty?.created_by ===
                "491e99c0-e470-43e9-af67-66eaa67bbeae"
                  ? "✅ YES"
                  : "❌ NO"}
              </span>
            </div>
            <div>
              Can Manage:{" "}
              <span
                className={`font-bold ${
                  canManageProperty() ? "text-green-600" : "text-red-600"
                }`}
              >
                {canManageProperty() ? "✅ YES" : "❌ NO"}
              </span>
            </div>
          </div>
        </StandardCard>
      )}
    </StandardPageLayout>
  );
}
