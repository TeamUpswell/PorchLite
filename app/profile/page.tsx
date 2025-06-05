"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import AvatarUpload from "@/components/ui/AvatarUpload";
import { User, Phone, Mail, MapPin, Eye, EyeOff, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  email: string;
  avatar_url: string | null;
  address: string | null;
  show_in_contacts: boolean;
  role: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error loading profile:", error);
          // If profile doesn't exist, create a basic one
          if (error.code === "PGRST116") {
            await createInitialProfile();
          }
          return;
        }

        setProfile(data);
        setFormData(data);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const createInitialProfile = async () => {
    if (!user) return;

    try {
      const initialProfile = {
        id: user.id,
        email: user.email || "",
        full_name: null,
        phone_number: null,
        avatar_url: null,
        address: null,
        show_in_contacts: false,
        role: "user",
      };

      const { data, error } = await supabase
        .from("profiles")
        .insert(initialProfile)
        .select()
        .single();

      if (error) {
        console.error("Error creating profile:", error);
        return;
      }

      setProfile(data);
      setFormData(data);
    } catch (error) {
      console.error("Error creating initial profile:", error);
    }
  };

  const handleInputChange = (
    field: keyof UserProfile,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleAvatarChange = async (avatarUrl: string) => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating avatar:", error);
        alert("Failed to update avatar");
        return;
      }

      setProfile((prev) => (prev ? { ...prev, avatar_url: avatarUrl } : null));
      setFormData((prev) => ({ ...prev, avatar_url: avatarUrl }));
    } catch (error) {
      console.error("Error updating avatar:", error);
      alert("Failed to update avatar");
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!user || !profile || !hasChanges) return;

    setSaving(true);
    try {
      const updateData = {
        ...formData,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
        alert("Failed to save profile changes");
        return;
      }

      setProfile((prev) => (prev ? { ...prev, ...updateData } : null));
      setHasChanges(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedPageWrapper>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-gray-500">Loading profile...</div>
        </div>
      </ProtectedPageWrapper>
    );
  }

  if (!profile) {
    return (
      <ProtectedPageWrapper>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-red-500">Error loading profile</div>
        </div>
      </ProtectedPageWrapper>
    );
  }

  return (
    <ProtectedPageWrapper>
      <PageContainer className="space-y-6">
        <div className="max-w-2xl mx-auto">
          <StandardCard>
            <div className="p-6">
              {/* Avatar Section */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Profile Photo
                </h2>
                <AvatarUpload
                  onAvatarChange={handleAvatarChange}
                  currentAvatar={profile.avatar_url || undefined}
                />
              </div>

              {/* Personal Information */}
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                  Personal Information
                </h2>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name || ""}
                    onChange={(e) =>
                      handleInputChange("full_name", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number || ""}
                    onChange={(e) =>
                      handleInputChange("phone_number", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your phone number"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Address
                  </label>
                  <textarea
                    value={formData.address || ""}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your address"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={profile.role || "user"}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Role is managed by administrators
                  </p>
                </div>

                {/* Privacy Settings */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Privacy Settings
                  </h3>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {formData.show_in_contacts ? (
                        <Eye className="w-5 h-5 text-green-500" />
                      ) : (
                        <EyeOff className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Show in Contacts
                        </label>
                        <p className="text-xs text-gray-500">
                          Allow other users to see your contact information
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleInputChange(
                          "show_in_contacts",
                          !formData.show_in_contacts
                        )
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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

                {/* Account Information */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Account Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-gray-500">Account Created</label>
                      <p className="text-gray-900">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-gray-500">Last Updated</label>
                      <p className="text-gray-900">
                        {new Date(profile.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Save Button (Mobile) */}
                {hasChanges && (
                  <div className="md:hidden pt-4">
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? "Saving..." : "Save Changes"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </StandardCard>
        </div>
      </PageContainer>
    </ProtectedPageWrapper>
  );
}
