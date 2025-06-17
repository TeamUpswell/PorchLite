"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";
import PhotoUpload from "@/components/ui/PhotoUpload";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email?: string;
    full_name?: string;
    phone_number?: string;
    avatar_url?: string;
    address?: string;
    show_in_contacts?: boolean;
    role?: string;
  } | null | undefined; // ✅ Allow null/undefined
  onProfileUpdate?: (updatedUser: any) => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  user,
  onProfileUpdate,
}: ProfileModalProps) {
  // ✅ Early return if modal is not open or user is not available
  if (!isOpen || !user) {
    return null;
  }

  const [loading, setLoading] = useState(false);

  // ✅ Safe initialization with fallbacks
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone_number: user?.phone_number || "",
    address: user?.address || "",
    show_in_contacts: user?.show_in_contacts ?? true,
    avatar_url: user?.avatar_url || "",
    role: user?.role || "",
  });

  // ✅ Safe photo initialization
  const [profilePhotos, setProfilePhotos] = useState<string[]>(
    user?.avatar_url ? [user.avatar_url] : []
  );

  useEffect(() => {
    if (isOpen) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        address: user.address || "",
        show_in_contacts: user.show_in_contacts ?? true,
        avatar_url: user.avatar_url || "",
        role: user.role || "", // Include role but make it read-only
      });
      setProfilePhotos(user.avatar_url ? [user.avatar_url] : []);
    }
  }, [isOpen, user]);

  // Handle profile photo changes
  const handleProfilePhotosChange = (photos: string[]) => {
    setProfilePhotos(photos);
    // Update form data with the first (and only) photo
    setFormData((prev) => ({
      ...prev,
      avatar_url: photos[0] || "",
    }));
  };

  // Handle form submission using your existing API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error("User ID is missing");
      return;
    }

    try {
      setLoading(true);

      // Use your existing API endpoint
      const response = await fetch("/api/users/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          userData: {
            ...formData,
            avatar_url: profilePhotos[0] || null,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error("Update failed");
      }

      toast.success("Profile updated successfully!");

      // Create updated user object for callback
      const updatedUser = {
        ...user,
        ...formData,
        avatar_url: profilePhotos[0] || null,
      };

      onProfileUpdate?.(updatedUser);
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Profile Photo Section */}
          <div className="space-y-4">
            <PhotoUpload
              photos={profilePhotos}
              onPhotosChange={handleProfilePhotosChange}
              storageBucket="avatars"
              maxPhotos={1} // ✅ Only allow 1 profile photo
              maxSizeMB={2} // ✅ Smaller limit for profile images
              allowPreview={true}
              gridCols="2" // ✅ Smaller grid since it's just one photo
              label="Profile Photo"
              required={false}
            />

            <p className="text-xs text-gray-500">
              Upload a profile photo to personalize your account.
            </p>
          </div>

          {/* Full Name Field */}
          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name
            </label>
            <input
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, full_name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your full name"
            />
          </div>

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email"
            />
          </div>

          {/* Phone Number Field */}
          <div>
            <label
              htmlFor="phone_number"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number
              <span className="text-gray-400 ml-1">(optional)</span>
            </label>
            <input
              id="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone_number: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your phone number"
            />
          </div>

          {/* Address Field */}
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Address
              <span className="text-gray-400 ml-1">(optional)</span>
            </label>
            <textarea
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your address"
            />
          </div>

          {/* Show in Contacts Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label
                htmlFor="show_in_contacts"
                className="text-sm font-medium text-gray-700"
              >
                Show in Contacts
              </label>
              <p className="text-xs text-gray-500">
                Allow other users to see your contact information
              </p>
            </div>
            <div className="relative">
              <input
                id="show_in_contacts"
                type="checkbox"
                checked={formData.show_in_contacts}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    show_in_contacts: e.target.checked,
                  }))
                }
                className="sr-only"
              />
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    show_in_contacts: !prev.show_in_contacts,
                  }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  formData.show_in_contacts ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.show_in_contacts ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Role Display (Read-only) */}
          {formData.role && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-600 capitalize">
                {formData.role}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
