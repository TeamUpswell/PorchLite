// app/account/page.tsx
"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import {
  User,
  Edit,
  Save,
  Camera,
  Shield,
  Bell,
  Lock,
  Globe,
  LogOut,
  Home, // Add this
} from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import PropertySelector from "@/components/PropertySelector";
import { useAuth } from "@/components/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  full_name: string;
  phone_number?: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface UserPreferences {
  notifications_email: boolean;
  notifications_push: boolean;
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
}

export default function AccountPage() {
  const { user, logout } = useAuth();
  const {
    currentProperty,
    currentTenant,
    userProperties,
    userTenants,
    loading: propertyLoading,
    error: propertyError,
  } = useProperty();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({
    notifications_email: true,
    notifications_push: true,
    theme: "system", // Fixed the syntax error here (removed 'f')
    language: "en",
    timezone: "UTC",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) return;

      try {
        setLoading(true);

        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        setProfile(profileData);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  const handleProfileUpdate = async (updatedProfile: Partial<UserProfile>) => {
    if (!user?.id || !profile) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update(updatedProfile)
        .eq("id", user.id);

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, ...updatedProfile } : null));
      setEditingProfile(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesUpdate = async (
    newPreferences: Partial<UserPreferences>
  ) => {
    setPreferences((prev) => ({ ...prev, ...newPreferences }));
    // In a real app, you'd save this to your database
  };

  const handleSignOut = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      try {
        console.log("Attempting to sign out...");

        if (!logout) {
          console.error("Logout function not available");
          throw new Error("Logout function not available");
        }

        await logout();
        console.log("Sign out successful");
      } catch (error) {
        console.error("Error signing out:", error);

        // Fallback: Manual sign out
        try {
          console.log("Attempting manual sign out...");
          const { error: signOutError } = await supabase.auth.signOut();
          if (signOutError) throw signOutError;

          // Clear storage and redirect
          localStorage.clear();
          window.location.href = "/login";
        } catch (fallbackError) {
          console.error("Fallback sign out failed:", fallbackError);
          alert("Failed to sign out. Please try refreshing the page.");
        }
      }
    }
  };

  if (loading || propertyLoading) {
    return (
      <StandardPageLayout
        title="Account Settings"
        subtitle="Manage your account and preferences"
        headerIcon={<User className="h-6 w-6 text-blue-600" />}
      >
        <StandardCard>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout
      title="Account Settings"
      subtitle="Manage your account and preferences"
      headerIcon={<User className="h-6 w-6 text-blue-600" />}
    >
      {/* Debug Info - Remove in production */}
      {propertyError && (
        <StandardCard
          title="Property Loading Error"
          className="mb-6 border-red-200"
        >
          <div className="text-red-600 text-sm">
            Error loading properties: {propertyError}
          </div>
        </StandardCard>
      )}

      {/* Profile Information */}
      <StandardCard
        title="Profile Information"
        subtitle="Update your personal information"
        headerActions={
          <button
            onClick={() => setEditingProfile(!editingProfile)}
            className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
          >
            <Edit className="h-4 w-4 mr-1" />
            {editingProfile ? "Cancel" : "Edit"}
          </button>
        }
        className="mb-6"
      >
        {profile ? (
          <ProfileForm
            profile={profile}
            editing={editingProfile}
            saving={saving}
            onSave={handleProfileUpdate}
          />
        ) : (
          <div className="text-center py-4 text-gray-500">
            Profile not found
          </div>
        )}
      </StandardCard>

      {/* Property Selection */}
      <StandardCard
        title="Active Property"
        subtitle="Select which property you're currently managing"
        className="mb-6"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Active Property
            </label>
            <PropertySelector />
          </div>

          {currentProperty && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">
                    {currentProperty.name || "Unnamed Property"}
                  </h4>
                  {currentProperty.address && (
                    <p className="text-sm text-blue-700">
                      {currentProperty.address}
                    </p>
                  )}
                  <p className="text-sm text-blue-600">
                    {userProperties.length} propert
                    {userProperties.length !== 1 ? "ies" : "y"} available
                  </p>
                </div>
              </div>
            </div>
          )}

          {userProperties.length === 0 && !propertyLoading && (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <Globe className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No properties found</p>
              <p className="text-sm text-gray-500">
                Contact your administrator to be added to a property
              </p>
            </div>
          )}
        </div>
      </StandardCard>

      {/* Notification Preferences */}
      <StandardCard
        title="Notification Preferences"
        subtitle="Choose how you want to be notified"
        className="mb-6"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">
                  Email Notifications
                </h4>
                <p className="text-sm text-gray-600">
                  Receive updates via email
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifications_email}
                onChange={(e) =>
                  handlePreferencesUpdate({
                    notifications_email: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">
                  Push Notifications
                </h4>
                <p className="text-sm text-gray-600">
                  Receive push notifications in browser
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifications_push}
                onChange={(e) =>
                  handlePreferencesUpdate({
                    notifications_push: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </StandardCard>

      {/* Security Settings */}
      <StandardCard
        title="Security Settings"
        subtitle="Manage your account security"
        className="mb-6"
      >
        <div className="space-y-4">
          <button className="flex items-center justify-between w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center">
              <Lock className="h-5 w-5 text-gray-400 mr-3" />
              <div className="text-left">
                <h4 className="font-medium text-gray-900">Change Password</h4>
                <p className="text-sm text-gray-600">
                  Update your account password
                </p>
              </div>
            </div>
            <Edit className="h-4 w-4 text-gray-400" />
          </button>

          <button className="flex items-center justify-between w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-gray-400 mr-3" />
              <div className="text-left">
                <h4 className="font-medium text-gray-900">
                  Two-Factor Authentication
                </h4>
                <p className="text-sm text-gray-600">
                  Add an extra layer of security
                </p>
              </div>
            </div>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
              Not Enabled
            </span>
          </button>
        </div>
      </StandardCard>

      {/* Sign Out Section */}
      <StandardCard
        title="Account Actions"
        subtitle="Manage your account session"
        className="mb-6"
      >
        <div className="space-y-4">
          <button
            onClick={handleSignOut}
            className="flex items-center justify-between w-full p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors group"
          >
            <div className="flex items-center">
              <LogOut className="h-5 w-5 text-red-500 mr-3" />
              <div className="text-left">
                <h4 className="font-medium text-red-900 group-hover:text-red-700">
                  Sign Out
                </h4>
                <p className="text-sm text-red-600">
                  Sign out from your account
                </p>
              </div>
            </div>
            <LogOut className="h-4 w-4 text-red-400" />
          </button>
        </div>
      </StandardCard>

      {/* Your Property Group */}
      <StandardCard
        title="Home Account"
        subtitle="Your vacation home management account"
        className="mb-6"
      >
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <Home className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-green-900">
                {currentTenant.name || "The Smith Family"}
              </h4>
              <p className="text-sm text-green-700">
                Family vacation home account
              </p>
            </div>
          </div>
        </div>
      </StandardCard>
    </StandardPageLayout>
  );
}

// ProfileForm Component (unchanged)
function ProfileForm({
  profile,
  editing,
  saving,
  onSave,
}: {
  profile: UserProfile;
  editing: boolean;
  saving: boolean;
  onSave: (profile: Partial<UserProfile>) => void;
}) {
  const [formData, setFormData] = useState({
    full_name: profile.full_name || "",
    phone_number: profile.phone_number || "",
    email: profile.email || "",
  });

  useEffect(() => {
    setFormData({
      full_name: profile.full_name || "",
      phone_number: profile.phone_number || "",
      email: profile.email || "",
    });
  }, [profile, editing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || profile.email}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {profile.full_name || "Unnamed User"}
            </h3>
            <p className="text-gray-600">{profile.email}</p>
            {profile.phone_number && (
              <p className="text-gray-600">{profile.phone_number}</p>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Account created {new Date(profile.created_at).toLocaleDateString()}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, full_name: e.target.value }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter your full name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          value={formData.phone_number}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, phone_number: e.target.value }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter your phone number"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter your email"
          disabled
        />
        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
