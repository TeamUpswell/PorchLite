"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/Header"; // ✅ FIXED: Changed from @/components/ui/Header
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import Button from "@/components/ui/button";
import { Save, ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { useSection } from "@/lib/hooks/useSection";
import toast from "react-hot-toast";

interface ManualSection {
  id: string;
  title: string;
  description?: string;
  icon: string;
  is_priority: boolean;
  property_id: string;
  created_by: string;
}

export default function EditManualSectionPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { currentProperty } = useProperty();
  const [section, setSection] = useState<ManualSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "file-text",
    is_priority: false,
  });

  const sectionId = params?.id as string;

  const { section: fetchedSection, loading: sectionLoading } =
    useSection(sectionId);

  useEffect(() => {
    if (fetchedSection) {
      setSection(fetchedSection);
      setFormData({
        title: fetchedSection.title,
        description: fetchedSection.description || "",
        icon: fetchedSection.icon,
        is_priority: fetchedSection.is_priority,
      });
    }
  }, [fetchedSection]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!section) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("manual_sections")
        .update({
          title: formData.title,
          description: formData.description,
          icon: formData.icon,
          is_priority: formData.is_priority,
        })
        .eq("id", section.id);

      if (error) throw error;

      router.push(`/manual/sections/${section.id}`);
    } catch (error) {
      console.error("Error updating manual section:", error);
      toast.error("Failed to update manual section");
    } finally {
      setSaving(false);
    }
  };

  if (sectionLoading) {
    return (
      <div className="p-6">
        <Header />
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading...</span>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="p-6">
        <Header />
        <PageContainer>
          <StandardCard>
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-600">
                Section Not Found
              </h3>
              <Button
                onClick={() => router.back()}
                variant="secondary"
                className="mt-4"
              >
                Go Back
              </Button>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Header />
      <PageContainer>
        <StandardCard
          title={`Edit Section: ${section.title}`}
          subtitle="Update section details and content"
        >
          {/* Your existing form content here */}
          <form onSubmit={handleSave} className="space-y-6">
            {/* Title field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Description field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                onClick={() => router.back()}
                variant="outline"
                aria-label="Cancel editing"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!formData.title.trim()}
                aria-label="Save section changes"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </StandardCard>
      </PageContainer>
    </div>
  );
}
