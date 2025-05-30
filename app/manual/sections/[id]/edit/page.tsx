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
        { label: section.title, href: `/manual/sections/${sectionId}` },
        { label: "Edit" },
      ]}
      action={
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      }
    >
      <div className="mb-6">
        <Link
          href={`/manual/sections/${sectionId}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Section
        </Link>
      </div>

      <StandardCard>
        <div className="space-y-6">
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
        </div>
      </StandardCard>
    </StandardPageLayout>
  );
}