"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import {
  X,
  Upload,
  User,
  Camera,
  Phone,
  MapPin,
  Mail,
  Eye,
  EyeOff,
} from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ✅ Image resizing helper function
const resizeImage = (
  file: File,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
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
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and resize
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, profileData, refreshProfile, updateProfileData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string }>({ type: 'success', text: '' });

  // ✅ Updated form data to match your table schema
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    address: "",
    avatar_url: "",
    show_in_contacts: true,
  });

  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);

  // ✅ Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && profileData) {
      setFormData({
        full_name: profileData.full_name || "",
        phone_number: profileData.phone_number || "",
        email: profileData.email || user?.email || "",
        address: profileData.address || "",
        avatar_url: profileData.avatar_url || "",
        show_in_contacts: profileData.show_in_contacts ?? true,
      });
      setPreviewUrl("");
      setHasChanges(false);
      setError("");
      setMessage({ type: 'success', text: '' });
      console.log("📝 ProfileModal: Form initialized with data:", profileData);
    }
  }, [isOpen, profileData, user?.email]);

  // ✅ Cleanup preview URL when modal closes
  useEffect(() => {
    if (!isOpen && previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
  }, [isOpen, previewUrl]);

  // ✅ Enhanced avatar upload with resizing
  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Clear previous errors
    setError("");
    setMessage({ type: 'success', text: '' });

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    console.log('📷 Original file:', {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type
    });

    try {
      setUploading(true);

      // ✅ Auto-resize image if larger than 1MB or dimensions are too large
      let processedFile: File | Blob = file;
      
      if (file.size > 1024 * 1024) { // If larger than 1MB, resize
        console.log('🔄 Resizing large image...');
        processedFile = await resizeImage(file, 400, 400, 0.8);
        console.log('✅ Image resized:', {
          originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
          newSize: `${(processedFile.size / 1024 / 1024).toFixed(2)}MB`,
        });
      }

      // Create preview
      const newPreviewUrl = URL.createObjectURL(processedFile);
      console.log("📷 Showing preview:", newPreviewUrl);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(newPreviewUrl);
      setHasChanges(true);

      // Generate unique filename - simple approach
      const fileExt = file.name.split(".").pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName; // ✅ Simple flat file structure

      console.log("📤 Uploading avatar:", { fileName, filePath, userId: user.id });

      // ✅ Delete old avatar if exists
      if (profileData?.avatar_url) {
        try {
          const urlParts = profileData.avatar_url.split('/');
          const oldFileName = urlParts[urlParts.length - 1];
          
          if (oldFileName && oldFileName.startsWith(user.id)) {
            console.log("🗑️ Deleting old avatar:", oldFileName);
            await supabase.storage
              .from("avatars")
              .remove([oldFileName]);
          }
        } catch (error) {
          console.log("⚠️ Could not delete old avatar:", error);
        }
      }

      // ✅ Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ Avatar uploaded successfully:', uploadData);

      // ✅ Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      console.log('🔗 Public URL generated:', publicUrl);

      // ✅ Update form data with new avatar URL
      setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));

      // Clean up preview
      URL.revokeObjectURL(newPreviewUrl);
      setPreviewUrl("");

      setMessage({
        type: 'success',
        text: 'Avatar uploaded successfully! Remember to save your changes.',
      });

      console.log("🎉 Avatar upload complete!");

    } catch (error: any) {
      console.error("❌ Error uploading avatar:", error);
      setError(error.message || "Failed to upload avatar");
      
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
      }
    } finally {
      setUploading(false);
      // Reset the input so the same file can be selected again
      event.target.value = "";
    }
  };

  // ✅ Handle form field changes
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    // Clear errors when user starts making changes
    if (error) setError("");
  };

  // ✅ Save all changes to database
  const handleSave = async () => {
    if (!hasChanges) {
      console.log("📝 No changes to save");
      onClose();
      return;
    }

    // Basic validation
    if (!formData.full_name.trim()) {
      setError("Full name is required");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    try {
      setLoading(true);
      setError("");
      console.log("💾 Saving profile changes:", formData);

      // ✅ Update profile with correct schema
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name.trim(),
          phone_number: formData.phone_number.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
          avatar_url: formData.avatar_url || null, // Use null instead of empty string
          show_in_contacts: formData.show_in_contacts,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id);

      if (updateError) {
        console.error("❌ Database update error:", updateError);
        throw updateError;
      }

      console.log("✅ Profile saved to database");

      // ✅ Update local profile data
      updateProfileData({
        ...profileData,
        full_name: formData.full_name.trim(),
        phone_number: formData.phone_number.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        avatar_url: formData.avatar_url || null,
        show_in_contacts: formData.show_in_contacts,
        updated_at: new Date().toISOString(),
      });

      // Refresh from database
      await refreshProfile();

      setMessage({
        type: 'success',
        text: 'Profile updated successfully!',
      });

      console.log("🎉 Profile update complete!");
      setHasChanges(false);
      
      // Close modal after a brief delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error: any) {
      console.error("❌ Error updating profile:", error);
      setError(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cancel changes
  const handleCancel = () => {
    if (hasChanges) {
      const confirmDiscard = confirm(
        "You have unsaved changes. Are you sure you want to discard them?"
      );
      if (!confirmDiscard) return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }

    setError("");
    setMessage({ type: 'success', text: '' });
    onClose();
  };

  // ✅ Get current avatar URL
  const getCurrentAvatarUrl = () => {
    if (previewUrl) return previewUrl;
    if (formData.avatar_url) return formData.avatar_url;
    return profileData?.avatar_url || "";
  };

  if (!isOpen) return null;

  const currentAvatarUrl = getCurrentAvatarUrl();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Profile
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}
          
          {message.text && (
            <div className={`p-3 text-sm rounded-lg ${
              message.type === 'success' 
                ? 'text-green-600 bg-green-50 border border-green-200' 
                : 'text-red-600 bg-red-50 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              {currentAvatarUrl ? (
                <img
                  src={currentAvatarUrl}
                  alt="Avatar Preview"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600 shadow-lg"
                  onError={(e) => {
                    console.log("❌ Avatar preview failed to load:", currentAvatarUrl);
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "flex";
                  }}
                  onLoad={() => {
                    console.log("✅ Avatar preview loaded:", currentAvatarUrl);
                  }}
                />
              ) : null}

              <div
                className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-gray-200 dark:border-gray-600 shadow-lg"
                style={{ display: currentAvatarUrl ? "none" : "flex" }}
              >
                <User className="w-10 h-10 text-white" />
              </div>

              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            {uploading && (
              <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Processing and uploading avatar...</span>
              </div>
            )}

            {previewUrl && (
              <div className="text-xs text-amber-600 dark:text-amber-400 text-center">
                Preview - Remember to save your changes!
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleInputChange("full_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange("phone_number", e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Enter your address"
                  rows={3}
                />
              </div>
            </div>

            {/* Show in Contacts */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show in Contacts
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Allow others to see your contact information
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleInputChange("show_in_contacts", !formData.show_in_contacts)}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                {formData.show_in_contacts ? (
                  <Eye className="w-5 h-5 text-blue-600" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
                <span className="text-sm">
                  {formData.show_in_contacts ? "Visible" : "Hidden"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {hasChanges && (
              <span className="text-amber-600 dark:text-amber-400">
                ● You have unsaved changes
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !hasChanges}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}