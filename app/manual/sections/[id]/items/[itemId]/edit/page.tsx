"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

interface ManualItem {
  id: string;
  title: string;
  content: string;
  media_urls?: string[];
  section_id: string;
  created_at: string;
  important?: boolean;
  order_index?: number;
}

interface ManualSection {
  id: string;
  title: string;
}

export default function EditItemPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sectionId = params.id as string;
  const itemId = params.itemId as string; // lowercase d to match folder [itemId]

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState<ManualItem | null>(null);
  const [section, setSection] = useState<ManualSection | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [important, setImportant] = useState(false);

  useEffect(() => {
    if (sectionId && itemId) {
      loadData();
    }
  }, [sectionId, itemId]);

  const loadData = async () => {
    try {
      // Load item
      const { data: itemData, error: itemError } = await supabase
        .from("manual_items")
        .select("*")
        .eq("id", itemId)
        .single();

      if (itemError) throw itemError;

      // Load section
      const { data: sectionData, error: sectionError } = await supabase
        .from("manual_sections")
        .select("id, title")
        .eq("id", sectionId)
        .single();

      if (sectionError) throw sectionError;

      setItem(itemData);
      setSection(sectionData);
      setTitle(itemData.title);
      setContent(itemData.content);
      setImportant(itemData.important || false);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Error loading item");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    if (!content.trim()) {
      alert("Please enter content");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from("manual_items")
        .update({
          title: title.trim(),
          content: content.trim(),
          important,
        })
        .eq("id", itemId);

      if (error) throw error;

      router.push(`/manual/sections/${sectionId}/items/${itemId}`);
    } catch (error: any) {
      console.error("Error updating item:", error);
      alert("Error updating item");
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
            <span className="ml-2">Loading item...</span>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (!item || !section) {
    return (
      <StandardPageLayout title="Item Not Found">
        <StandardCard>
          <div className="text-center py-8">
            <p className="text-red-600">Item not found</p>
            <Link
              href={`/manual/sections/${sectionId}`}
              className="text-blue-600 hover:underline"
            >
              Back to Section
            </Link>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout
      title="Edit Item"
      breadcrumb={[
        { label: "Manual", href: "/manual" },
        { label: section.title, href: `/manual/sections/${sectionId}` },
        {
          label: item.title,
          href: `/manual/sections/${sectionId}/items/${itemId}`,
        },
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
          href={`/manual/sections/${sectionId}/items/${itemId}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Item
        </Link>
      </div>

      <StandardCard>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter item title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter item content..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="important"
              checked={important}
              onChange={(e) => setImportant(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="important"
              className="ml-2 block text-sm text-gray-900"
            >
              Mark as important
            </label>
          </div>
        </div>
      </StandardCard>
    </StandardPageLayout>
  );
}
