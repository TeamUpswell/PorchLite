"use client";

import { useState, useEffect } from "react";
import { useProperty } from "@/lib/hooks/useProperty";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { supabase } from "@/lib/supabase";
import StandardCard from "@/components/ui/StandardCard";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Eye,
  Plus,
  Navigation, // Changed from Route
  Settings, // Add this
  TestTube,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";

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

export default function WalkthroughManagePage() {
  const { currentProperty } = useProperty();
  const { canManageProperty, userRole } = usePermissions();
  const [sections, setSections] = useState<WalkthroughSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [showAddSection, setShowAddSection] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<string | null>(null);

  // Form states
  const [sectionForm, setSectionForm] = useState({
    title: "",
    description: "",
  });
  const [stepForm, setStepForm] = useState({ title: "", content: "" });

  useEffect(() => {
    if (currentProperty?.id && canManageProperty()) {
      loadSections();
    }
  }, [currentProperty, canManageProperty]);

  const loadSections = async () => {
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

      const sortedSections = data.map((section) => ({
        ...section,
        walkthrough_steps: section.walkthrough_steps.sort(
          (a, b) => a.order_index - b.order_index
        ),
      }));

      setSections(sortedSections);

      // Auto-expand sections with content
      const sectionsWithSteps = new Set(
        sortedSections
          .filter((s) => s.walkthrough_steps.length > 0)
          .map((s) => s.id)
      );
      setExpandedSections(sectionsWithSteps);
    } catch (error) {
      console.error("Error loading sections:", error);
      toast.error("Failed to load walkthrough sections");
    } finally {
      setLoading(false);
    }
  };

  const createSection = async () => {
    if (!currentProperty?.id || !sectionForm.title.trim()) return;

    try {
      const { data, error } = await supabase
        .from("walkthrough_sections")
        .insert([
          {
            property_id: currentProperty.id,
            title: sectionForm.title.trim(),
            description: sectionForm.description.trim(),
            order_index: sections.length,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setSections([...sections, { ...data, walkthrough_steps: [] }]);
      setSectionForm({ title: "", description: "" });
      setShowAddSection(false);
      toast.success("Section created successfully");
    } catch (error) {
      console.error("Error creating section:", error);
      toast.error("Failed to create section");
    }
  };

  const updateSection = async (sectionId: string) => {
    if (!sectionForm.title.trim()) return;

    try {
      const { error } = await supabase
        .from("walkthrough_sections")
        .update({
          title: sectionForm.title.trim(),
          description: sectionForm.description.trim(),
        })
        .eq("id", sectionId);

      if (error) throw error;

      setSections(
        sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                title: sectionForm.title,
                description: sectionForm.description,
              }
            : section
        )
      );

      setEditingSection(null);
      setSectionForm({ title: "", description: "" });
      toast.success("Section updated successfully");
    } catch (error) {
      console.error("Error updating section:", error);
      toast.error("Failed to update section");
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this section and all its steps?"
      )
    )
      return;

    try {
      const { error } = await supabase
        .from("walkthrough_sections")
        .delete()
        .eq("id", sectionId);

      if (error) throw error;

      setSections(sections.filter((s) => s.id !== sectionId));
      toast.success("Section deleted successfully");
    } catch (error) {
      console.error("Error deleting section:", error);
      toast.error("Failed to delete section");
    }
  };

  const createStep = async (sectionId: string) => {
    if (!stepForm.title.trim()) return;

    try {
      const section = sections.find((s) => s.id === sectionId);
      if (!section) return;

      const { data, error } = await supabase
        .from("walkthrough_steps")
        .insert([
          {
            section_id: sectionId,
            title: stepForm.title.trim(),
            content: stepForm.content.trim(),
            order_index: section.walkthrough_steps.length,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setSections(
        sections.map((s) =>
          s.id === sectionId
            ? { ...s, walkthrough_steps: [...s.walkthrough_steps, data] }
            : s
        )
      );

      setStepForm({ title: "", content: "" });
      toast.success("Step created successfully");
    } catch (error) {
      console.error("Error creating step:", error);
      toast.error("Failed to create step");
    }
  };

  const updateStep = async (stepId: string, sectionId: string) => {
    if (!stepForm.title.trim()) return;

    try {
      const { error } = await supabase
        .from("walkthrough_steps")
        .update({
          title: stepForm.title.trim(),
          content: stepForm.content.trim(),
        })
        .eq("id", stepId);

      if (error) throw error;

      setSections(
        sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                walkthrough_steps: section.walkthrough_steps.map((step) =>
                  step.id === stepId
                    ? {
                        ...step,
                        title: stepForm.title,
                        content: stepForm.content,
                      }
                    : step
                ),
              }
            : section
        )
      );

      setEditingStep(null);
      setStepForm({ title: "", content: "" });
      toast.success("Step updated successfully");
    } catch (error) {
      console.error("Error updating step:", error);
      toast.error("Failed to update step");
    }
  };

  const deleteStep = async (stepId: string, sectionId: string) => {
    if (!confirm("Are you sure you want to delete this step?")) return;

    try {
      const { error } = await supabase
        .from("walkthrough_steps")
        .delete()
        .eq("id", stepId);

      if (error) throw error;

      setSections(
        sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                walkthrough_steps: section.walkthrough_steps.filter(
                  (step) => step.id !== stepId
                ),
              }
            : section
        )
      );

      toast.success("Step deleted successfully");
    } catch (error) {
      console.error("Error deleting step:", error);
      toast.error("Failed to delete step");
    }
  };

  const toggleSectionExpanded = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const startEditingSection = (section: WalkthroughSection) => {
    setSectionForm({ title: section.title, description: section.description });
    setEditingSection(section.id);
  };

  const startEditingStep = (step: WalkthroughStep) => {
    setStepForm({ title: step.title, content: step.content });
    setEditingStep(step.id);
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditingStep(null);
    setShowAddSection(false);
    setSectionForm({ title: "", description: "" });
    setStepForm({ title: "", content: "" });
  };

  // Check permissions
  if (!canManageProperty()) {
    return (
      <ProtectedPageWrapper>
        <div className="space-y-6">
          {/* Breadcrumb */}
          <nav className="flex text-sm text-gray-500">
            <Link href="/house" className="hover:text-gray-700">The House</Link>
            <span className="mx-2">/</span>
            <Link href="/house/walkthrough" className="hover:text-gray-700">Walkthrough</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Management</span>
          </nav>

          {/* Page Header */}
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Walkthrough Management</h1>
              <p className="text-gray-600">Manage walkthrough content for {currentProperty?.name}</p>
            </div>
          </div>

          <StandardCard>
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Access Denied
              </h3>
              <p className="text-gray-500">
                You don't have permission to manage walkthrough content.
              </p>
            </div>
          </StandardCard>
        </div>
      </ProtectedPageWrapper>
    );
  }

  if (loading) {
    return (
      <ProtectedPageWrapper>
        <div className="space-y-6">
          {/* Breadcrumb */}
          <nav className="flex text-sm text-gray-500">
            <Link href="/house" className="hover:text-gray-700">The House</Link>
            <span className="mx-2">/</span>
            <Link href="/house/walkthrough" className="hover:text-gray-700">Walkthrough</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Management</span>
          </nav>

          {/* Page Header */}
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Walkthrough Management</h1>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>

          <StandardCard>
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent mx-auto mb-3"></div>
              <p className="text-gray-500">Loading walkthrough management...</p>
            </div>
          </StandardCard>
        </div>
      </ProtectedPageWrapper>
    );
  }

  return (
    <ProtectedPageWrapper>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex text-sm text-gray-500">
          <Link href="/house" className="hover:text-gray-700">The House</Link>
          <span className="mx-2">/</span>
          <Link href="/house/walkthrough" className="hover:text-gray-700">Walkthrough</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Management</span>
        </nav>

        {/* Page Header */}
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Walkthrough Management</h1>
            <p className="text-gray-600">Manage walkthrough content for {currentProperty?.name}</p>
          </div>
        </div>
        {/* Quick Actions */}
        <StandardCard>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Quick Actions
              </h3>
              <p className="text-sm text-gray-600">
                Manage your walkthrough content
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/house/walkthrough"
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Link>
              {process.env.NODE_ENV === "development" && (
                <Link
                  href="/house/walkthrough/test"
                  className="inline-flex items-center px-3 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Test
                </Link>
              )}
              <button
                onClick={() => setShowAddSection(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </button>
            </div>
          </div>
        </StandardCard>

        {/* Add Section Form */}
        {showAddSection && (
          <StandardCard title="Add New Section">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  value={sectionForm.title}
                  onChange={(e) =>
                    setSectionForm({ ...sectionForm, title: e.target.value })
                  }
                  placeholder="e.g., Kitchen Tour, Living Room, Bedroom"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={sectionForm.description}
                  onChange={(e) =>
                    setSectionForm({
                      ...sectionForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief description of this section"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={createSection}
                  disabled={!sectionForm.title.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Section
                </button>
                <button
                  onClick={cancelEditing}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </StandardCard>
        )}

        {/* Sections List */}
        {sections.length === 0 ? (
          <StandardCard>
            <div className="text-center py-8">
              <Navigation className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Sections Yet
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first walkthrough section to get started.
              </p>
              <button
                onClick={() => setShowAddSection(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Section
              </button>
            </div>
          </StandardCard>
        ) : (
          <div className="space-y-4">
            {sections.map((section, index) => (
              <StandardCard key={section.id}>
                <div className="space-y-4">
                  {/* Section Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleSectionExpanded(section.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {expandedSections.has(section.id) ? (
                          <ChevronUp className="h-4 w-4 text-gray-600" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-600" />
                        )}
                      </button>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {index + 1}. {section.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {section.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {section.walkthrough_steps.length} steps
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEditingSection(section)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteSection(section.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Edit Section Form */}
                  {editingSection === section.id && (
                    <div className="border-t pt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Section Title
                        </label>
                        <input
                          type="text"
                          value={sectionForm.title}
                          onChange={(e) =>
                            setSectionForm({
                              ...sectionForm,
                              title: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={sectionForm.description}
                          onChange={(e) =>
                            setSectionForm({
                              ...sectionForm,
                              description: e.target.value,
                            })
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => updateSection(section.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Update Section
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Steps */}
                  {expandedSections.has(section.id) && (
                    <div className="border-t pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">Steps</h4>
                        <button
                          onClick={() => {
                            setStepForm({ title: "", content: "" });
                            setEditingStep(`new-${section.id}`);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Step
                        </button>
                      </div>

                      {/* Add Step Form */}
                      {editingStep === `new-${section.id}` && (
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Step Title
                            </label>
                            <input
                              type="text"
                              value={stepForm.title}
                              onChange={(e) =>
                                setStepForm({
                                  ...stepForm,
                                  title: e.target.value,
                                })
                              }
                              placeholder="e.g., Coffee Maker, Refrigerator, TV Remote"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Step Content
                            </label>
                            <textarea
                              value={stepForm.content}
                              onChange={(e) =>
                                setStepForm({
                                  ...stepForm,
                                  content: e.target.value,
                                })
                              }
                              placeholder="Detailed instructions or information about this step"
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => createStep(section.id)}
                              disabled={!stepForm.title.trim()}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                              Create Step
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Steps List */}
                      {section.walkthrough_steps.map((step, stepIndex) => (
                        <div
                          key={step.id}
                          className="bg-gray-50 p-4 rounded-lg"
                        >
                          {editingStep === step.id ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Step Title
                                </label>
                                <input
                                  type="text"
                                  value={stepForm.title}
                                  onChange={(e) =>
                                    setStepForm({
                                      ...stepForm,
                                      title: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Step Content
                                </label>
                                <textarea
                                  value={stepForm.content}
                                  onChange={(e) =>
                                    setStepForm({
                                      ...stepForm,
                                      content: e.target.value,
                                    })
                                  }
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() =>
                                    updateStep(step.id, section.id)
                                  }
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                  Update Step
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">
                                  {stepIndex + 1}. {step.title}
                                </h5>
                                <p className="text-sm text-gray-600 mt-1">
                                  {step.content}
                                </p>
                                {step.photo_urls &&
                                  step.photo_urls.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-2">
                                      {step.photo_urls.length} photo(s) attached
                                    </p>
                                  )}
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <button
                                  onClick={() => startEditingStep(step)}
                                  className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    deleteStep(step.id, section.id)
                                  }
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {section.walkthrough_steps.length === 0 &&
                        editingStep !== `new-${section.id}` && (
                          <div className="text-center py-6 text-gray-500">
                            <p className="text-sm">
                              No steps yet. Add your first step to get started.
                            </p>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </StandardCard>
            ))}
          </div>
        )}
      </div>
    </ProtectedPageWrapper>
  );
}
