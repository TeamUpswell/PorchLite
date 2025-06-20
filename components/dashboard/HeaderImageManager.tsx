"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, Check, X, Lock } from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { useProperty } from "@/lib/hooks/useProperty";
import { useAuth } from "@/components/auth/AuthProvider";
// Role permissions for header image management
const ALLOWED_ROLES = ["owner", "manager", "admin"]; // ← Added 'admin'

// Default presets available to all tenants
const DEFAULT_PRESETS = [
  {
    id: "modern-house",
    name: "Modern House",
    url: "/images/headers/presets/modern-house.jpg",
    thumbnail: "/images/headers/presets/thumbs/modern-house-thumb.jpg",
  },
  {
    id: "cozy-cabin",
    name: "Cozy Cabin",
    url: "/images/headers/presets/cozy-cabin.jpg",
    thumbnail: "/images/headers/presets/thumbs/cozy-cabin-thumb.jpg",
  },
  {
    id: "beach-house",
    name: "Beach House",
    url: "/images/headers/presets/beach-house.jpg",
    thumbnail: "/images/headers/presets/thumbs/beach-house-thumb.jpg",
  },
  {
    id: "city-apartment",
    name: "City Apartment",
    url: "/images/headers/presets/city-apartment.jpg",
    thumbnail: "/images/headers/presets/thumbs/city-apartment-thumb.jpg",
  },
];

// Tenant-specific presets
const TENANT_PRESETS: Record<string, typeof DEFAULT_PRESETS> = {
  "luxury-properties": [
    {
      id: "luxury-villa",
      name: "Luxury Villa",
      url: "/images/headers/presets/luxury/villa.jpg",
      thumbnail: "/images/headers/presets/luxury/thumbs/villa-thumb.jpg",
    },
  ],
  "vacation-rentals": [
    {
      id: "beach-house",
      name: "Beach House",
      url: "/images/headers/presets/vacation/beach.jpg",
      thumbnail: "/images/headers/presets/vacation/thumbs/beach-thumb.jpg",
    },
  ],
};

interface HeaderImageManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentImageUrl?: string;
  onImageUpdate: (imageUrl: string) => void;
}

// Add this utility function at the top of the file, before the component
const resizeImage = (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new window.Image(); // ← Use window.Image instead of Image

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          }
        },
        "image/jpeg",
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
};

export default function HeaderImageManager({
  isOpen,
  onClose,
  currentImageUrl,
  onImageUpdate,
}: HeaderImageManagerProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const [userImages, setUserImages] = useState<
    Array<{ id: string; url: string; name: string; created_at: string }>
  >([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedUserImage, setSelectedUserImage] = useState<string | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { currentProperty } = useProperty();
  const { user } = useAuth();

  // Check user's role for current property
  useEffect(() => {
    async function checkUserRole() {
      if (!user || !currentProperty) {
        setLoadingRole(false);
        return;
      }

      try {
        // Use tenant_users table (same as DashboardHeader)
        const { data, error } = await supabase
          .from("tenant_users") // ← Changed from 'property_users'
          .select("role, status")
          .eq("tenant_id", currentProperty.tenant_id) // ← Changed from 'property_id'
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();

        if (error) {
          console.error("Error checking user role:", error);
          setUserRole(null);
        } else {
          setUserRole(data?.role || null);
        }
      } catch (error) {
        console.error("Role check error:", error);
        setUserRole(null);
      } finally {
        setLoadingRole(false);
      }
    }

    checkUserRole();
  }, [user, currentProperty]);

  // Check if user has permission to edit
  const hasEditPermission =
    userRole && ALLOWED_ROLES.includes(userRole.toLowerCase());

  // Get tenant-specific presets
  const getAvailablePresets = () => {
    const tenantType = currentProperty?.tenant_type || "default";
    return TENANT_PRESETS[tenantType] || DEFAULT_PRESETS;
  };

  // Load user's uploaded images
  useEffect(() => {
    async function loadUserImages() {
      if (!user || !currentProperty || !hasEditPermission) {
        return;
      }

      setLoadingImages(true);
      try {
        // Get list of uploaded images from storage
        const { data: files, error } = await supabase.storage
          .from("property-images")
          .list("headers", {
            limit: 50,
            sortBy: { column: "created_at", order: "desc" },
          });

        if (error) {
          console.error("Error loading user images:", error);
          return;
        }

        // Convert to image objects with public URLs
        const imageList = files
          .filter((file) => file.name.includes("_")) // Filter out folders
          .map((file) => {
            const {
              data: { publicUrl },
            } = supabase.storage
              .from("property-images")
              .getPublicUrl(`headers/${file.name}`);

            return {
              id: file.name,
              url: publicUrl,
              name: file.name.split("_").slice(1).join("_"), // Remove timestamp prefix
              created_at: file.created_at || "",
            };
          });

        setUserImages(imageList);
      } catch (error) {
        console.error("Error loading images:", error);
      } finally {
        setLoadingImages(false);
      }
    }

    loadUserImages();
  }, [user, currentProperty, hasEditPermission]);

  if (!isOpen) return null;

  // Show loading state while checking permissions
  if (loadingRole) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Show permission denied if user doesn't have access
  if (!hasEditPermission) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="text-center">
            <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Access Restricted
            </h2>
            <p className="text-gray-600 mb-4">
              Only property owners and managers can change the header image.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Your current role:{" "}
              <span className="font-medium">{userRole || "None"}</span>
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !currentProperty || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Check original file size (show warning for very large files)
    const maxOriginalSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxOriginalSize) {
      toast.error("Image is too large. Please select a smaller image.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      console.log("📸 Original file:", {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.type,
      });

      // Resize the image before upload
      const resizedFile = await resizeImage(file, 1920, 1080, 0.8);

      console.log("📏 Resized file:", {
        name: resizedFile.name,
        size: `${(resizedFile.size / 1024 / 1024).toFixed(2)}MB`,
        type: resizedFile.type,
      });

      // Check if resized file is still too large for Supabase (5MB limit)
      const maxSupabaseSize = 5 * 1024 * 1024; // 5MB
      let finalFile = resizedFile;

      if (resizedFile.size > maxSupabaseSize) {
        console.log("🔄 File still too large, compressing further...");
        // Try with higher compression
        finalFile = await resizeImage(file, 1280, 720, 0.6);

        if (finalFile.size > maxSupabaseSize) {
          // Last resort - very aggressive compression
          finalFile = await resizeImage(file, 1024, 576, 0.4);
        }
      }

      console.log("✅ Final file for upload:", {
        name: finalFile.name,
        size: `${(finalFile.size / 1024 / 1024).toFixed(2)}MB`,
        type: finalFile.type,
      });

      // Generate unique filename with timestamp - SIMPLIFIED PATH
      const timestamp = Date.now();
      const sanitizedName = finalFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `headers/${timestamp}_${sanitizedName}`; // ← Simplified path

      console.log("📁 Upload path:", filePath);
      console.log("🔍 Upload debug info:", {
        userId: user.id,
        tenantId: currentProperty.tenant_id,
        propertyId: currentProperty.id,
        userRole: userRole,
        filePath: filePath,
        fileSize: finalFile.size,
      });

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("property-images")
        .upload(filePath, finalFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("❌ Supabase upload error:", error);
        throw error;
      }

      console.log("📤 Upload successful:", data);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("property-images").getPublicUrl(filePath);

      console.log("🔗 Public URL:", publicUrl);

      setCustomImageUrl(publicUrl);
      setSelectedPreset(null);
      setSelectedUserImage(null);

      // Refresh the user images list
      const { data: files } = await supabase.storage
        .from("property-images")
        .list("headers", {
          limit: 50,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (files) {
        const imageList = files
          .filter((file) => file.name.includes("_"))
          .map((file) => {
            const {
              data: { publicUrl: imgUrl },
            } = supabase.storage
              .from("property-images")
              .getPublicUrl(`headers/${file.name}`);

            return {
              id: file.name,
              url: imgUrl,
              name: file.name.split("_").slice(1).join("_"),
              created_at: file.created_at || "",
            };
          });

        setUserImages(imageList);
      }

      toast.success(
        `Image uploaded successfully! Compressed from ${(
          file.size /
          1024 /
          1024
        ).toFixed(1)}MB to ${(finalFile.size / 1024 / 1024).toFixed(1)}MB`
      );
    } catch (error: any) {
      console.error("❌ Upload error:", error);

      // Provide specific error messages
      if (error.message?.includes("row-level security")) {
        toast.error(
          "Permission denied. Please check your account permissions."
        );
      } else if (error.message?.includes("size")) {
        toast.error(
          "Image is still too large after compression. Please try a smaller image."
        );
      } else if (error.message?.includes("storage")) {
        toast.error("Storage error. Please try again or contact support.");
      } else {
        toast.error(`Upload failed: ${error.message || "Unknown error"}`);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);

      // Reset file input
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleSave = async () => {
    if (!currentProperty || !user || !hasEditPermission) {
      toast.error("You do not have permission to update this image");
      return;
    }

    try {
      let imageUrl = "";

      if (selectedPreset) {
        const preset = getAvailablePresets().find(
          (p) => p.id === selectedPreset
        );
        imageUrl = preset?.url || "";
      } else if (customImageUrl) {
        imageUrl = customImageUrl;
      } else if (selectedUserImage) {
        const userImage = userImages.find(
          (img) => img.id === selectedUserImage
        );
        imageUrl = userImage?.url || "";
      }

      if (!imageUrl) {
        toast.error("Please select an image");
        return;
      }

      // Update property with tenant check
      const { error } = await supabase
        .from("properties")
        .update({
          header_image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentProperty.id)
        .eq("tenant_id", currentProperty.tenant_id);

      if (error) throw error;

      onImageUpdate(imageUrl);
      toast.success("Header image updated!");
      onClose();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save header image");
    }
  };

  const handleDeleteImage = async (imageId: string, imageName: string) => {
    // Create a more user-friendly confirmation
    const confirmMessage = `Delete "${imageName}"?\n\nThis action cannot be undone and will permanently remove this image from your library.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      console.log("🗑️ Deleting image:", { imageId, imageName });

      // Delete from Supabase Storage
      const { error } = await supabase.storage
        .from("property-images")
        .remove([`headers/${imageId}`]);

      if (error) {
        console.error("❌ Delete error:", error);
        toast.error("Failed to delete image");
        return;
      }

      console.log("✅ Image deleted successfully");

      // Remove from local state
      setUserImages((prev) => prev.filter((img) => img.id !== imageId));

      // Clear selection if deleted image was selected
      if (selectedUserImage === imageId) {
        setSelectedUserImage(null);
      }

      toast.success(`"${imageName}" deleted successfully`);
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast.error("Failed to delete image");
    }
  };

  const availablePresets = getAvailablePresets();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Sticky Save Bar - Mobile Optimized */}
        {(selectedPreset || customImageUrl || selectedUserImage) && (
          <div className="sticky top-0 z-10 bg-blue-50 border-b border-blue-200 px-3 sm:px-6 py-3 sm:py-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  Ready to save
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onClose}
                  className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
                  Choose Header Image
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  For {currentProperty?.name || "this property"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {/* Mobile-Optimized Preview - Remove redundant save button */}
            {(selectedPreset || customImageUrl || selectedUserImage) && (
              <div className="mb-4 sm:mb-6 bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-sm sm:text-lg font-semibold text-gray-900">
                    Selected Image
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                    READY
                  </span>
                </div>
                <div className="relative h-24 sm:h-32 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={
                      customImageUrl ||
                      userImages.find((img) => img.id === selectedUserImage)
                        ?.url ||
                      availablePresets.find((p) => p.id === selectedPreset)
                        ?.url ||
                      ""
                    }
                    alt="Header preview"
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Removed the redundant save button section */}
              </div>
            )}

            {/* Rest of your content with mobile optimizations */}
            {/* My Uploaded Images - Mobile Grid */}
            {userImages.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-3 text-gray-900">
                  My Images ({userImages.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                  {userImages.map((image) => (
                    <div
                      key={image.id}
                      className={`group relative rounded-lg overflow-hidden border-2 transition-all ${
                        selectedUserImage === image.id
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {/* Image Container */}
                      <div
                        onClick={() => {
                          setSelectedUserImage(image.id);
                          setSelectedPreset(null);
                          setCustomImageUrl(null);
                        }}
                        className="aspect-video relative cursor-pointer"
                      >
                        <Image
                          src={image.url}
                          alt={image.name}
                          fill
                          className="object-cover"
                        />
                        {selectedUserImage === image.id && (
                          <div className="absolute inset-0 bg-blue-600 bg-opacity-20 flex items-center justify-center">
                            <Check className="h-6 w-6 text-blue-600 bg-white rounded-full p-1" />
                          </div>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent selecting the image
                            handleDeleteImage(image.id, image.name);
                          }}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100 hover:opacity-100"
                          title="Delete image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Image Info */}
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {image.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(image.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Custom Image */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">
                Upload New Image
              </h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {uploading ? (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Uploading... {Math.round(uploadProgress)}%
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-lg font-medium text-gray-700 mb-1">
                      Upload your own image
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      JPG, PNG, or WebP up to 5MB
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Choose File
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Preset Images */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">
                Choose from Presets
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({availablePresets.length} available)
                </span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {availablePresets.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedPreset === preset.id
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="aspect-video relative">
                      <Image
                        src={preset.thumbnail}
                        alt={preset.name}
                        fill
                        className="object-cover"
                      />
                      {selectedPreset === preset.id && (
                        <div className="absolute inset-0 bg-blue-600 bg-opacity-20 flex items-center justify-center">
                          <Check className="h-8 w-8 text-blue-600 bg-white rounded-full p-1" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-gray-900">{preset.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={
                  !selectedPreset && !customImageUrl && !selectedUserImage
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Header Image
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
