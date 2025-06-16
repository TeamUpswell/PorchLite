"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { User, Phone, Mail, MapPin, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { currentProperty } = useProperty();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Form fields
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  useEffect(() => {
    if (user) {
      const userProfile: UserProfile = {
        id: user.id,
        email: user.email || "",
        name: user.user_metadata?.name || "",
        phone: user.user_metadata?.phone || "",
        address: user.user_metadata?.address || "",
        city: user.user_metadata?.city || "",
        state: user.user_metadata?.state || "",
        zip: user.user_metadata?.zip || "",
      };

      setProfile(userProfile);
      setFormData({
        name: userProfile.name || "",
        phone: userProfile.phone || "",
        address: userProfile.address || "",
        city: userProfile.city || "",
        state: userProfile.state || "",
        zip: userProfile.zip || "",
      });
      setLoading(false);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
        },
      });

      if (error) throw error;

      setMessage({
        text: "Profile updated successfully!",
        type: "success",
      });

      // Update local profile state
      setProfile((prev) => (prev ? { ...prev, ...formData } : null));
    } catch (error: any) {
      setMessage({
        text: error.message || "Failed to update profile",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <StandardPageLayout>
        <StandardCard>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading profile...</span>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout>
      <div className="space-y-6">
        {/* Success/Error Message */}
        {message.text && (
          <div
            className={`p-4 rounded-md ${
              message.type === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile Information */}
        <StandardCard
          title="Profile Information"
          subtitle="Update your personal details"
          icon={<User className="h-5 w-5 text-gray-600" />}
        >
          <div className="space-y-6">
            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your full name"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
        </StandardCard>

        {/* Address Information */}
        <StandardCard
          title="Address Information"
          subtitle="Your contact address"
          icon={<MapPin className="h-5 w-5 text-gray-600" />}
        >
          <div className="space-y-4">
            {/* Street Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="123 Main Street"
              />
            </div>

            {/* City, State, ZIP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={formData.zip}
                  onChange={(e) => handleInputChange("zip", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="12345"
                />
              </div>
            </div>
          </div>
        </StandardCard>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </StandardPageLayout>
  );
}