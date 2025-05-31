"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";

interface ManualSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  property_id: string;
  created_at: string;
}

export default function EditSectionPage() {
  const { user } = useAuth();
  const { currentProperty } = useProperty();
  const router = useRouter();
  const params = useParams();
  const sectionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState<ManualSection | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (sectionId) {
      loadSection();
    }
  }, [sectionId]);

  const loadSection = async () => {
    try {
      const { data: sectionData, error } = await supabase
        .from("manual_sections")
        .select("*")
        .eq("id", sectionId)
        .single();

      if (error) throw error;

      setSection(sectionData);
      setTitle(sectionData.title);
      setDescription(sectionData.description || "");
      setIcon(sectionData.icon);
      setCategory(sectionData.category || "");
    } catch (error) {
      console.error("Error loading section:", error);
      alert("Error loading section");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    if (!icon.trim()) {
      alert("Please enter an icon");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from("manual_sections")
        .update({
          title: title.trim(),
          description: description.trim(),
          icon: icon.trim(),
          category: category.trim(),
        })
        .eq("id", sectionId);

      if (error) throw error;

      router.push(`/manual/sections/${sectionId}`);
    } catch (error: any) {
      console.error("Error updating section:", error);
      alert("Error updating section");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <StandardPageLayout title="Loading...">
        <StandardCard>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading section...</span>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (!section) {
    return (
      <StandardPageLayout title="Section Not Found">
        <StandardCard>
          <div className="text-center py-8">
            <p className="text-red-600">Section not found</p>
            <Link href="/manual" className="text-blue-600 hover:underline">
              Back to Manual
            </Link>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout
      title="Edit Section"
      breadcrumb={[
        { label: "Manual", href: "/manual" },
        { label: section?.title || "Loading...", href: `/manual/sections/${sectionId}` },
        { label: "Edit" }
      ]}
    >
      <StandardCard>
        <div className="p-6">
          <form id="edit-section-form" onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter section title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter section description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon (Emoji)
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="🏠"
                maxLength={2}
              />
              <p className="text-sm text-gray-500 mt-1">Enter an emoji to represent this section</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter category..."
              />
              <p className="text-sm text-gray-500 mt-1">Optional: Group related sections together</p>
            </div>
          </form>
        </div>
      </StandardCard>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col space-y-3">
        {/* Save Changes */}
        <button
          type="submit"
          form="edit-section-form"
          disabled={saving}
          className="group flex items-center justify-center bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-lg transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed
          
          /* Mobile: circular button */
          w-14 h-14 rounded-full
          
          /* Desktop: expandable button with rounded corners */
          sm:w-auto sm:h-auto sm:px-4 sm:py-3 sm:rounded-lg sm:hover:scale-105"
          aria-label="Save changes"
        >
          <Save className="h-6 w-6 transition-transform group-hover:rotate-12 duration-200 sm:mr-0 group-hover:sm:mr-2" />

          <span className="hidden sm:inline-block sm:w-0 sm:overflow-hidden sm:whitespace-nowrap sm:transition-all sm:duration-300 group-hover:sm:w-auto group-hover:sm:ml-2">
            {saving ? "Saving..." : "Save Changes"}
          </span>
        </button>

        {/* Back to Section */}
        <Link
          href={`/manual/sections/${sectionId}`}
          className="group flex items-center justify-center bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white shadow-lg transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-gray-500 focus:ring-opacity-50
          
          /* Mobile: circular button */
          w-14 h-14 rounded-full
          
          /* Desktop: expandable button with rounded corners */
          sm:w-auto sm:h-auto sm:px-4 sm:py-3 sm:rounded-lg sm:hover:scale-105"
          aria-label="Back to section"
        >
          <ArrowLeft className="h-6 w-6 transition-transform group-hover:-translate-x-1 duration-200 sm:mr-0 group-hover:sm:mr-2" />

          <span className="hidden sm:inline-block sm:w-0 sm:overflow-hidden sm:whitespace-nowrap sm:transition-all sm:duration-300 group-hover:sm:w-auto group-hover:sm:ml-2">
            Back to Section
          </span>
        </Link>
      </div>
    </StandardPageLayout>
  );
}