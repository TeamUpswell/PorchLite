"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";
import PhotoUpload from "@/components/ui/PhotoUpload";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export default function ProfileModal({
  isOpen,
  onClose,
  user,
}: ProfileModalProps) {
  // ✅ Call all hooks at the top level, before any early returns
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ useEffect is also a hook - must be called before early returns
  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        name: user.name,
        email: user.email,
      });
      setIsEditing(false);
      setError(null);
    }
  }, [isOpen, user.name, user.email]);

  // ✅ Early return AFTER all hooks
  if (!isOpen) return null;

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
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <img
              src={user.avatar || "/default-avatar.png"}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Name"
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email"
                  />
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-medium">{user.name}</h3>
                  <p className="text-gray-600">{user.email}</p>
                  {user.role && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                      {user.role}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            Close
          </button>

          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
