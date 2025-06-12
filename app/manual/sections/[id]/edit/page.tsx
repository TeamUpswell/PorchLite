"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/Header"; // ✅ FIXED: Changed from @/components/ui/Header
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import { Save, ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

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

  useEffect(() => {
    if (sectionId) {
      fetchSection();
    }
  }, [sectionId]);

  const fetchSection = async () => {
    try {
      const { data, error } = await supabase
        .from("manual_sections")
        .select("*")
        .eq("id", sectionId)
        .single();

      if (error) throw error;

      setSection(data);
      setFormData({
        title: data.title,
        description: data.description || "",
        icon: data.icon,
        is_priority: data.is_priority,
      });
    } catch (error) {
      console.error("Error fetching manual section:", error);
      router.push("/manual");
    } finally {
      setLoading(false);
    }
  };

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
      alert("Failed to update manual section");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Header title="Edit Manual Section" />
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading section...</span>
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
          <StandardCard>
            <div className="text-center py-8">
              <p className="text-gray-500">Section not found</p>
              <Link
                href="/manual"
                className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
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
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Edit Manual Section
                </h1>
                <p className="text-gray-600">Update section details</p>
              </div>
            </div>
            <Link
              href={`/manual/sections/${section.id}`}
              className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Section
            </Link>
          </div>

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
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Kitchen Appliances, WiFi Setup, House Rules"
                  required
                />
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
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of what this section covers..."
                />
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
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, icon: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="file-text">File Text</option>
                  <option value="home">Home</option>
                  <option value="wifi">WiFi</option>
                  <option value="tv">TV</option>
                  <option value="car">Parking</option>
                  <option value="utensils">Kitchen</option>
                  <option value="bed">Bedroom</option>
                  <option value="shower">Bathroom</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_priority"
                  checked={formData.is_priority}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_priority: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="is_priority"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Mark as priority section (appears at top)
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <Link
                  href={`/manual/sections/${section.id}`}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving || !formData.title}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </StandardCard>
        </div>
      </PageContainer>
    </div>
  );
}
