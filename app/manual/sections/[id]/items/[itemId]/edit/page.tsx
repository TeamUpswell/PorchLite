"use client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import PhotoUpload from "@/components/manual/PhotoUpload";

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [section, setSection] = useState(null);
  const [item, setItem] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    media_urls: [],
    order_index: 1,
    important: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const sectionId = params.id as string;
  const itemId = params.itemId as string;

  useEffect(() => {
    async function fetchData() {
      try {
        console.log("Fetching data:", { sectionId, itemId });
        
        // Fetch section
        const { data: sectionData, error: sectionError } = await supabase
          .from("manual_sections")
          .select("*")
          .eq("id", sectionId)
          .single();
          
        if (sectionError) {
          console.error("Section error:", sectionError);
          throw sectionError;
        }
        setSection(sectionData);
        
        // Fetch item
        const { data: itemData, error: itemError } = await supabase
          .from("manual_items")
          .select("*")
          .eq("id", itemId)
          .single();
          
        if (itemError) {
          console.error("Item error:", itemError);
          throw itemError;
        }
        setItem(itemData);
        
        setFormData({
          title: itemData.title || "",
          content: itemData.content || "",
          media_urls: itemData.media_urls || [],
          order_index: itemData.order_index || 1,
          important: itemData.important || false
        });
        
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    if (sectionId && itemId) {
      fetchData();
    }
  }, [sectionId, itemId]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    
    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from("manual_items")
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq("id", itemId);
        
      if (error) throw error;
      
      router.push(`/manual/sections/${sectionId}`);
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from("manual_items")
        .delete()
        .eq("id", itemId);
        
      if (error) throw error;
      
      router.push(`/manual/sections/${sectionId}`);
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item. Please try again.");
    }
  };

  if (loading) {
    return (
      <StandardPageLayout title="Loading...">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </StandardPageLayout>
    );
  }

  if (!section || !item) {
    return (
      <StandardPageLayout title="Item Not Found">
        <StandardCard>
          <div className="text-center py-8">
            <p className="text-gray-500">Item not found</p>
            <p className="text-sm text-gray-400 mt-2">
              Section ID: {sectionId}<br/>
              Item ID: {itemId}
            </p>
            <Link href="/manual" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
              Back to Manual
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
        { label: "Edit Item" }
      ]}
      action={
        <div className="flex items-center space-x-3">
          <Link
            href={`/manual/sections/${sectionId}`}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Section
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Item
          </button>
        </div>
      }
    >
      <StandardCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Item Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Turning On the TV"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Instructions *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter step-by-step instructions..."
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Add photos to help illustrate the instructions
            </p>
            <PhotoUpload
              onPhotosChange={(urls) =>
                setFormData((prev) => ({ ...prev, media_urls: urls }))
              }
              existingPhotos={formData.media_urls}
              maxPhotos={5}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Display Order
              </label>
              <input
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 1 }))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Options
              </label>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.important}
                    onChange={(e) => setFormData(prev => ({ ...prev, important: e.target.checked }))}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <AlertTriangle className="h-4 w-4 ml-2 mr-1 text-orange-600" />
                  <span className="text-sm text-gray-700">Mark as important</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              href={`/manual/sections/${sectionId}`}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </StandardCard>
    </StandardPageLayout>
  );
}
