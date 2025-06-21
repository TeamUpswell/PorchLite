// app/account/components/ProfileModal.tsx - Updated to match your table schema
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

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, profileData, refreshProfile, updateProfileData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  // ✅ Handle avatar upload
  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];

      // Validate file
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file.");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image size must be less than 5MB.");
      }

      // Create preview
      const newPreviewUrl = URL.createObjectURL(file);
      console.log("📷 Showing preview:", newPreviewUrl);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(newPreviewUrl);
      setHasChanges(true);

      // Upload to Supabase
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      // ✅ FIXED: Don't include 'avatars/' in the path since .from('avatars') already specifies the bucket
      const filePath = fileName; // Just use the filename

      console.log("📤 Uploading avatar:", { fileName, filePath });

      // Delete old avatar if exists
      if (profileData?.avatar_url) {
        try {
          // ✅ FIXED: Extract just the filename from the URL
          const urlParts = profileData.avatar_url.split('/');
          const oldFileName = urlParts[urlParts.length - 1];
          
          if (oldFileName && oldFileName.includes(user?.id || "")) {
            console.log("🗑️ Deleting old avatar:", oldFileName);
            await supabase.storage
              .from("avatars")
              .remove([oldFileName]); // ✅ Just the filename, not avatars/filename
          }
        } catch (error) {
          console.log("⚠️ Could not delete old avatar:", error);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { 
          cacheControl: '3600',
          upsert: true // ✅ Allow overwriting if file exists
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;
      console.log("✅ Avatar uploaded, public URL:", avatarUrl);

      // Update form data
      setFormData((prev) => ({ ...prev, avatar_url: avatarUrl }));

      // Clean up preview
      URL.revokeObjectURL(newPreviewUrl);
      setPreviewUrl("");

      console.log("🎉 Avatar upload complete!");
    } catch (error) {
      console.error("❌ Error uploading avatar:", error);
      alert(error instanceof Error ? error.message : "Error uploading avatar!");

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
      }
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  // ✅ Handle form field changes
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // ✅ Save all changes to database
  const handleSave = async () => {
    if (!hasChanges) {
      console.log("📝 No changes to save");
      onClose();
      return;
    }

    try {
      setLoading(true);
      console.log("💾 Saving profile changes:", formData);

      // ✅ Update profile with correct schema
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          email: formData.email,
          address: formData.address,
          avatar_url: formData.avatar_url,
          show_in_contacts: formData.show_in_contacts,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id);

      if (error) throw error;

      console.log("✅ Profile saved to database");

      // Update local profile data
      updateProfileData({
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        email: formData.email,
        address: formData.address,
        avatar_url: formData.avatar_url,
        show_in_contacts: formData.show_in_contacts,
        updated_at: new Date().toISOString(),
      });

      // Refresh from database
      await refreshProfile();

      console.log("🎉 Profile update complete!");
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      alert("Error updating profile!");
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
          {/* ✅ Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              {currentAvatarUrl ? (
                <img
                  src={currentAvatarUrl}
                  alt="Avatar Preview"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600 shadow-lg"
                  onError={(e) => {
                    console.log(
                      "❌ Avatar preview failed to load:",
                      currentAvatarUrl
                    );
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
                <span>Uploading avatar...</span>
              </div>
            )}

            {previewUrl && (
              <div className="text-xs text-amber-600 dark:text-amber-400 text-center">
                Preview - Remember to save your changes!
              </div>
            )}
          </div>

          {/* ✅ Form Fields */}
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleInputChange("full_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your email"
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
                  onChange={(e) =>
                    handleInputChange("phone_number", e.target.value)
                  }
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
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                onClick={() =>
                  handleInputChange(
                    "show_in_contacts",
                    !formData.show_in_contacts
                  )
                }
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400"
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
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
