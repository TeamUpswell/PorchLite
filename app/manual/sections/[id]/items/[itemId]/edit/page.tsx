"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Upload,
  Camera,
  X,
  Image as ImageIcon,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";
import { convertToWebP, supportsWebP } from "@/lib/imageUtils";
import StandardCard from "@/components/ui/StandardCard";
import StandardPageLayout from "@/components/layout/StandardPageLayout";

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
  property_id: string;
}

interface FormData {
  title: string;
  content: string;
  important: boolean;
  media_urls: string[];
}

export default function EditItemPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const router = useRouter();
  const params = useParams();

  const [item, setItem] = useState<ManualItem | null>(null);
  const [section, setSection] = useState<ManualSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Consolidated form state
  const [formData, setFormData] = useState<FormData>({
    title: "",
    content: "",
    important: false,
    media_urls: [],
  });

  // Photo upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Refs for optimization
  const mountedRef = useRef(true);
  const savingRef = useRef(false);
  const originalDataRef = useRef<FormData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const sectionId = params.id as string;
  const itemId = params.itemId as string;

  // Component cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Memoized loading state
  const isInitializing = useMemo(() => {
    return authLoading || propertyLoading;
  }, [authLoading, propertyLoading]);

  // Load item and section data
  const loadData = useCallback(async () => {
    if (!sectionId || !itemId || !user?.id || !mountedRef.current) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("📝 Loading item for edit:", { sectionId, itemId });

      // Load item and section in parallel
      const [itemResponse, sectionResponse] = await Promise.all([
        supabase
          .from("manual_items")
          .select("*")
          .eq("id", itemId)
          .eq("section_id", sectionId) // Verify item belongs to section
          .single(),
        supabase
          .from("manual_sections")
          .select("id, title, property_id")
          .eq("id", sectionId)
          .single()
      ]);

      if (!mountedRef.current) {
        console.log("⚠️ Component unmounted, aborting");
        return;
      }

      // Handle item response
      if (itemResponse.error) {
        if (itemResponse.error.code === 'PGRST116') {
          setError("Item not found");
        } else {
          console.error("❌ Error fetching item:", itemResponse.error);
          setError("Failed to load item");
        }
        return;
      }

      // Handle section response
      if (sectionResponse.error) {
        if (sectionResponse.error.code === 'PGRST116') {
          setError("Section not found");
        } else {
          console.error("❌ Error fetching section:", sectionResponse.error);
          setError("Failed to load section");
        }
        return;
      }

      const itemData = itemResponse.data;
      const sectionData = sectionResponse.data;

      // Verify property access
      if (currentProperty?.id && sectionData.property_id !== currentProperty.id) {
        setError("Item belongs to a different property");
        return;
      }

      console.log("✅ Data loaded successfully");
      setItem(itemData);
      setSection(sectionData);

      // Set form data
      const initialFormData: FormData = {
        title: itemData.title,
        content: itemData.content,
        important: itemData.important || false,
        media_urls: itemData.media_urls || [],
      };

      setFormData(initialFormData);
      originalDataRef.current = { ...initialFormData };

    } catch (error) {
      console.error("❌ Unexpected error loading data:", error);
      if (mountedRef.current) {
        setError("Failed to load item data");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [sectionId, itemId, user?.id, currentProperty?.id]);

  // Main loading effect
  useEffect(() => {
    if (isInitializing) {
      return;
    }

    if (!user?.id) {
      console.log("⏳ Waiting for user...");
      if (mountedRef.current) {
        setLoading(false);
      }
      return;
    }

    if (!sectionId || !itemId) {
      console.log("⚠️ Missing section or item ID");
      if (mountedRef.current) {
        setLoading(false);
        setError("Missing section or item ID");
      }
      return;
    }

    loadData();
  }, [user?.id, sectionId, itemId, isInitializing, loadData]);

  // Memoized form change handler
  const handleFormChange = useCallback((field: keyof FormData) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!mountedRef.current) return;
      
      const value = e.target.type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : e.target.value;
      
      setFormData(prev => ({ ...prev, [field]: value }));
      
      // Clear error when user starts typing
      if (error) {
        setError(null);
      }
    };
  }, [error]);

  // Optimized photo upload handler
  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Reset the input
    e.target.value = '';

    for (const file of files) {
      if (!file.type.match(/image\/(jpeg|jpg|png|webp|gif)/i)) {
        toast.error(`Invalid file type: ${file.name}`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File too large: ${file.name} (max 5MB)`);
        continue;
      }

      if (!mountedRef.current) return;

      setIsUploading(true);
      setUploadProgress(0);

      try {
        let fileToUpload = file;
        let fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";

        // WebP conversion for optimization
        const webpSupported = await supportsWebP();
        if (webpSupported && file.type !== 'image/webp') {
          const optimizedBlob = await convertToWebP(file, 1200, 0.8);
          fileToUpload = new File([optimizedBlob], `manual-item.webp`, {
            type: "image/webp",
          });
          fileExt = "webp";
        }

        if (!mountedRef.current) return;

        const fileName = `manual-items/${itemId}/${uuidv4()}.${fileExt}`;
        
        setUploadProgress(50);

        const { error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(fileName, fileToUpload, {
            cacheControl: "31536000",
            upsert: false,
          });

        if (!mountedRef.current) return;

        setUploadProgress(100);

        if (uploadError) {
          console.error("❌ Upload error:", uploadError);
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from("property-images")
          .getPublicUrl(fileName);

        const newMediaUrls = [...formData.media_urls, publicUrlData.publicUrl];
        
        setFormData(prev => ({
          ...prev,
          media_urls: newMediaUrls
        }));

        // Update item in database immediately for better UX
        const { error: updateError } = await supabase
          .from("manual_items")
          .update({ media_urls: newMediaUrls })
          .eq("id", itemId);

        if (updateError) {
          console.warn("⚠️ Failed to auto-save photo, will save on form submit");
        }

        toast.success(`Photo uploaded: ${file.name}`);
      } catch (error) {
        console.error("❌ Error uploading photo:", error);
        toast.error(`Failed to upload: ${file.name}`);
      } finally {
        if (mountedRef.current) {
          setIsUploading(false);
          setTimeout(() => setUploadProgress(0), 1000);
        }
      }
    }
  }, [formData.media_urls, itemId]);

  // Photo removal handler
  const removePhoto = useCallback(async (photoUrl: string) => {
    if (!mountedRef.current) return;

    try {
      const newMediaUrls = formData.media_urls.filter(url => url !== photoUrl);
      
      setFormData(prev => ({
        ...prev,
        media_urls: newMediaUrls
      }));

      // Update database immediately
      const { error } = await supabase
        .from("manual_items")
        .update({ media_urls: newMediaUrls })
        .eq("id", itemId);

      if (error) {
        console.warn("⚠️ Failed to auto-save photo removal");
      }

      // Optionally delete from storage (best effort)
      try {
        const fileName = photoUrl.split("/").pop();
        if (fileName && fileName.includes("manual-items")) {
          await supabase.storage
            .from("property-images")
            .remove([`manual-items/${itemId}/${fileName}`]);
        }
      } catch (storageError) {
        console.warn("⚠️ Failed to delete file from storage:", storageError);
      }

      toast.success("Photo removed");
    } catch (error) {
      console.error("❌ Error removing photo:", error);
      toast.error("Failed to remove photo");
    }
  }, [formData.media_urls, itemId]);

  // Form validation
  const isFormValid = useMemo(() => {
    return formData.title.trim().length > 0 && formData.content.trim().length > 0;
  }, [formData.title, formData.content]);

  // Check if form has changes
  const hasChanges = useMemo(() => {
    if (!originalDataRef.current) return false;
    
    const original = originalDataRef.current;
    return (
      formData.title !== original.title ||
      formData.content !== original.content ||
      formData.important !== original.important ||
      JSON.stringify(formData.media_urls) !== JSON.stringify(original.media_urls)
    );
  }, [formData]);

  // Save handler
  const handleSave = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Prevent duplicate saves
    if (savingRef.current || saving || !mountedRef.current || !isFormValid) {
      return;
    }

    if (!item?.id) {
      setError("Item not loaded");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError(null);

    try {
      console.log("💾 Saving manual item...");

      const { error } = await supabase
        .from("manual_items")
        .update({
          title: formData.title.trim(),
          content: formData.content.trim(),
          important: formData.important,
          media_urls: formData.media_urls,
        })
        .eq("id", item.id);

      if (!mountedRef.current) {
        console.log("⚠️ Component unmounted, aborting");
        return;
      }

      if (error) {
        console.error("❌ Error updating item:", error);
        setError(error.message || "Failed to update item");
        toast.error("Failed to update item");
      } else {
        console.log("✅ Item updated successfully");
        toast.success("Item updated successfully!");
        
        // Update original data reference
        originalDataRef.current = { ...formData };
        
        router.push(`/manual/sections/${sectionId}/items/${itemId}`);
      }
    } catch (error) {
      console.error("❌ Unexpected error updating item:", error);
      if (mountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update item";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setSaving(false);
      }
      savingRef.current = false;
    }
  }, [formData, item?.id, saving, isFormValid, router, sectionId, itemId]);

  // Retry function
  const retryLoad = useCallback(() => {
    if (sectionId && itemId && user?.id) {
      setError(null);
      loadData();
    }
  }, [sectionId, itemId, user?.id, loadData]);

  // Loading state
  if (isInitializing || loading) {
    return (
      <StandardPageLayout
        title="Edit Manual Item"
        subtitle="Loading item data..."
      >
        <StandardCard>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600">
                {isInitializing ? "⏳ Initializing..." : "📝 Loading item..."}
              </p>
            </div>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (!user) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <StandardPageLayout
        title="Edit Manual Item"
        subtitle="Error loading item"
      >
        <StandardCard
          title="Error Loading Item"
          subtitle="Unable to load the requested manual item"
        >
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {error === "Item not found" ? "Item Not Found" : "Error Loading Item"}
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={retryLoad}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
              {sectionId ? (
                <Link
                  href={`/manual/sections/${sectionId}`}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back to Section
                </Link>
              ) : (
                <Link
                  href="/manual"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back to Manual
                </Link>
              )}
            </div>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (!item || !section) {
    return (
      <StandardPageLayout
        title="Edit Manual Item"
        subtitle="Item not found"
      >
        <StandardCard
          title="Item Not Found"
          subtitle="The requested manual item could not be found"
        >
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Item Not Found
            </h3>
            <p className="text-gray-600 mb-4">
              The manual item you're trying to edit doesn't exist.
            </p>
            <Link
              href="/manual"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Manual
            </Link>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout
      title="Edit Manual Item"
      subtitle={`Editing "${formData.title}" in ${section.title}`}
      breadcrumb={[
        { label: "Manual", href: "/manual" },
        { label: section.title, href: `/manual/sections/${sectionId}` },
        { label: item.title, href: `/manual/sections/${sectionId}/items/${itemId}` },
        { label: "Edit" },
      ]}
    >
      <div className="space-y-6">
        <StandardCard
          title="Edit Item"
          subtitle={`${section.title} • ${currentProperty?.name || 'Unknown Property'}`}
          headerActions={
            <div className="flex items-center gap-2">
              <Link
                href={`/manual/sections/${sectionId}/items/${itemId}`}
                className="inline-flex items-center px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Cancel
              </Link>
              {hasChanges && (
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  Unsaved changes
                </span>
              )}
            </div>
          }
        >
          <form onSubmit={handleSave} className="space-y-6">
            {/* Title Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={handleFormChange('title')}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                placeholder="Enter item title..."
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length}/100 characters
              </p>
            </div>

            {/* Content Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={handleFormChange('content')}
                disabled={saving}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm transition-colors"
                placeholder="Enter item content..."
                maxLength={5000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.content.length}/5000 characters • Line breaks will be preserved
              </p>
            </div>

            {/* Photo Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos ({formData.media_urls.length})
              </label>

              {/* Upload Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors disabled:opacity-50">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photos
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={isUploading || saving}
                  />
                </label>

                <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors md:hidden disabled:opacity-50">
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={isUploading || saving}
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
              {formData.media_urls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {formData.media_urls.map((photo, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={photo}
                        alt={`Item photo ${index + 1}`}
                        width={200}
                        height={150}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo)}
                        disabled={saving}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
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
                  <p className="text-sm text-gray-400 mt-1">
                    Upload photos or take new ones to document this item
                  </p>
                </div>
              )}
            </div>

            {/* Important Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="important"
                checked={formData.important}
                onChange={handleFormChange('important')}
                disabled={saving}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <label
                htmlFor="important"
                className="ml-2 block text-sm text-gray-900"
              >
                Mark as important
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Link
                href={`/manual/sections/${sectionId}/items/${itemId}`}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving || !isFormValid || !hasChanges}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      </div>
    </StandardPageLayout>
  );
}
