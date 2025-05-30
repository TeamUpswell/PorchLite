"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Edit, ExternalLink, Calendar, Image as ImageIcon, Save } from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";
import { convertToWebP, supportsWebP } from "@/lib/imageUtils";
import Image from "next/image";

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
  const itemId = params.itemId as string; // ✅ Correct

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState<ManualItem | null>(null);
  const [section, setSection] = useState<ManualSection | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [important, setImportant] = useState(false);

  // Photo upload states (matching dashboard pattern)
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
      setPhotos(itemData.media_urls || []); // ← Load existing photos
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error loading item");
    } finally {
      setLoading(false);
    }
  };

  // Photo upload handler (EXACT dashboard pattern)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (!file.type.match(/image\/(jpeg|jpg|png|webp|gif)/i)) {
        toast.error("Please select valid image files");
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        continue;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        let fileToUpload = file;
        let fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";

        // EXACT SAME WebP conversion as dashboard
        const webpSupported = await supportsWebP();
        if (webpSupported) {
          const optimizedBlob = await convertToWebP(file, 1200, 0.8);
          fileToUpload = new File([optimizedBlob], `manual-item.webp`, {
            type: "image/webp",
          });
          fileExt = "webp";
        }

        const fileName = `manual-items/${itemId}/${uuidv4()}.${fileExt}`;

        // EXACT SAME upload pattern as dashboard
        const { error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(fileName, fileToUpload, {
            cacheControl: "31536000",
            upsert: false,
          });

        setUploadProgress(100);

        if (uploadError) throw uploadError;

        // EXACT SAME URL generation
        const { data: publicUrlData } = supabase.storage
          .from("property-images")
          .getPublicUrl(fileName);

        const newPhotos = [...photos, publicUrlData.publicUrl];
        setPhotos(newPhotos);

        // Update item in database immediately
        const { error: updateError } = await supabase
          .from("manual_items")
          .update({ media_urls: newPhotos })
          .eq("id", itemId);

        if (updateError) throw updateError;

        toast.success("Photo uploaded successfully!");
      } catch (error) {
        console.error("Error uploading photo:", error);
        toast.error("Failed to upload photo");
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    }
  };

  // Photo removal handler
  const removePhoto = async (photoUrl: string) => {
    try {
      const newPhotos = photos.filter(url => url !== photoUrl);
      setPhotos(newPhotos);

      // Update database immediately
      const { error } = await supabase
        .from("manual_items")
        .update({ media_urls: newPhotos })
        .eq("id", itemId);

      if (error) throw error;

      // Optionally delete from storage
      const fileName = photoUrl.split('/').pop();
      if (fileName && fileName.includes('manual-items')) {
        await supabase.storage
          .from("property-images")
          .remove([`manual-items/${itemId}/${fileName}`]);
      }

      toast.success("Photo removed");
    } catch (error) {
      console.error("Error removing photo:", error);
      toast.error("Failed to remove photo");
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!content.trim()) {
      toast.error("Please enter content");
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
          media_urls: photos, // ← Include updated photos
        })
        .eq("id", itemId);

      if (error) throw error;

      toast.success("Item updated successfully!");
      router.push(`/manual/sections/${sectionId}/items/${itemId}`);
    } catch (error: any) {
      console.error("Error updating item:", error);
      toast.error("Error updating item");
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
      title="Edit Item" // ← Change title to indicate editing
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
          disabled={saving || isUploading}
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
              Item Title *
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
              Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="Enter item content..."
            />
            <p className="text-sm text-gray-500 mt-1">Line breaks will be preserved in the display</p>
          </div>

          {/* Photo Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos
            </label>
            
            {/* Upload Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                <Upload className="h-4 w-4 mr-2" />
                Upload Photos
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>

              <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors md:hidden">
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Photo Grid */}
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={photo}
                      alt={`Item photo ${index + 1}`}
                      width={200}
                      height={96}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No photos added yet</p>
                <p className="text-sm text-gray-400 mt-1">Upload photos or take new ones to document this item</p>
              </div>
            )}
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