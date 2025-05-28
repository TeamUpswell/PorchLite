"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { PhotoIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

interface ProfileFormProps {
  profile: {
    full_name: string;
    phone_number: string;
    email: string;
    avatar_url?: string;
  };
  loading: boolean;
  onUpdate: () => void;
}

export default function ProfileForm({
  profile,
  loading,
  onUpdate,
}: ProfileFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    full_name: profile.full_name || "",
    phone_number: profile.phone_number || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      setSaving(true);
      setMessage({ type: "", text: "" });

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      let error;

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            full_name: formData.full_name,
            phone_number: formData.phone_number,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        error = updateError;
      } else {
        // Create new profile
        const { error: insertError } = await supabase.from("profiles").insert([
          {
            id: user.id,
            full_name: formData.full_name,
            phone_number: formData.phone_number,
            email: user.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

        error = insertError;
      }

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Profile updated successfully!",
      });

      onUpdate();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to update profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="space-y-6">
        {/* Email (non-editable) */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={profile.email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Your email address is managed through your authentication provider.
          </p>
        </div>

        {/* Full Name */}
        <div>
          <label
            htmlFor="full_name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full Name
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Enter your full name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label
            htmlFor="phone_number"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Phone Number
          </label>
          <input
            type="tel"
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            placeholder="Enter your phone number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Avatar Upload (Future Enhancement) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profile Picture
          </label>
          <div className="mt-1 flex items-center">
            {profile.avatar_url ? (
              <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                <Image
                  src={profile.avatar_url || "/images/default-avatar.png"}
                  alt="Profile picture"
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover"
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                <PhotoIcon className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <button
              type="button"
              className="ml-4 px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              disabled
            >
              Change
            </button>
            <p className="ml-4 text-xs text-gray-500">Coming soon</p>
          </div>
        </div>

        {/* Status Message */}
        {message.text && (
          <div
            className={`rounded-md p-4 ${
              message.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
