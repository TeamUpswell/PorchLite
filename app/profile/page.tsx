"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { User, Phone, Mail, MapPin, Save, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

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

interface FormData {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  // Refs for optimization
  const mountedRef = useRef(true);
  const savingRef = useRef(false);
  const originalDataRef = useRef<FormData | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Component cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  // Memoized loading state
  const isInitializing = useMemo(() => {
    return authLoading || propertyLoading;
  }, [authLoading, propertyLoading]);

  // Load profile data
  const loadProfile = useCallback(() => {
    if (!user || !mountedRef.current) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("👤 Loading user profile...");

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

      const initialFormData: FormData = {
        name: userProfile.name || "",
        phone: userProfile.phone || "",
        address: userProfile.address || "",
        city: userProfile.city || "",
        state: userProfile.state || "",
        zip: userProfile.zip || "",
      };

      setProfile(userProfile);
      setFormData(initialFormData);
      originalDataRef.current = { ...initialFormData };

      console.log("✅ Profile loaded successfully");
    } catch (error) {
      console.error("❌ Error loading profile:", error);
      if (mountedRef.current) {
        setError("Failed to load profile data");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user]);

  // Main loading effect
  useEffect(() => {
    if (isInitializing) {
      return;
    }

    if (!user) {
      console.log("⏳ Waiting for user...");
      if (mountedRef.current) {
        setLoading(false);
      }
      return;
    }

    loadProfile();
  }, [user, isInitializing, loadProfile]);

  // Memoized form change handler
  const handleInputChange = useCallback((field: keyof FormData) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!mountedRef.current) return;
      
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
      
      // Clear messages when user starts typing
      if (message) {
        setMessage(null);
        if (messageTimeoutRef.current) {
          clearTimeout(messageTimeoutRef.current);
          messageTimeoutRef.current = null;
        }
      }
      
      // Clear error
      if (error) {
        setError(null);
      }
    };
  }, [message, error]);

  // Form validation
  const isFormValid = useMemo(() => {
    // Basic validation - at least name should be provided
    return formData.name.trim().length > 0;
  }, [formData.name]);

  // Check if form has changes
  const hasChanges = useMemo(() => {
    if (!originalDataRef.current) return false;
    
    const original = originalDataRef.current;
    return (
      formData.name !== original.name ||
      formData.phone !== original.phone ||
      formData.address !== original.address ||
      formData.city !== original.city ||
      formData.state !== original.state ||
      formData.zip !== original.zip
    );
  }, [formData]);

  // Auto-clear message after delay
  const setTemporaryMessage = useCallback((msg: { text: string; type: "success" | "error" }) => {
    if (!mountedRef.current) return;
    
    setMessage(msg);
    
    // Clear any existing timeout
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    
    // Set new timeout for success messages
    if (msg.type === "success") {
      messageTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setMessage(null);
        }
      }, 5000);
    }
  }, []);

  // Save handler
  const handleSave = useCallback(async () => {
    // Prevent duplicate saves
    if (savingRef.current || saving || !mountedRef.current || !isFormValid) {
      return;
    }

    if (!user) {
      setError("User not authenticated");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      console.log("💾 Saving profile changes...");

      const { error } = await supabase.auth.updateUser({
        data: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zip: formData.zip.trim(),
        },
      });

      if (!mountedRef.current) {
        console.log("⚠️ Component unmounted, aborting");
        return;
      }

      if (error) {
        console.error("❌ Error updating profile:", error);
        setError(error.message || "Failed to update profile");
        toast.error("Failed to update profile");
      } else {
        console.log("✅ Profile updated successfully");
        
        // Update local profile state
        setProfile(prev => prev ? { ...prev, ...formData } : null);
        
        // Update original data reference
        originalDataRef.current = { ...formData };
        
        setTemporaryMessage({
          text: "Profile updated successfully!",
          type: "success",
        });
        
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      console.error("❌ Unexpected error updating profile:", error);
      if (mountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setSaving(false);
      }
      savingRef.current = false;
    }
  }, [formData, user, saving, isFormValid, setTemporaryMessage]);

  // Retry function
  const retryLoad = useCallback(() => {
    if (user) {
      setError(null);
      loadProfile();
    }
  }, [user, loadProfile]);

  // Loading state
  if (isInitializing || loading) {
    return (
      <StandardPageLayout
        title="Profile"
        subtitle="Loading your profile..."
      >
        <StandardCard>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600">
                {isInitializing ? "⏳ Initializing..." : "👤 Loading profile..."}
              </p>
            </div>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (!user) {
    return null; // Auth will redirect
  }

  // Error state
  if (error) {
    return (
      <StandardPageLayout
        title="Profile"
        subtitle="Error loading profile"
      >
        <StandardCard
          title="Error Loading Profile"
          subtitle="Unable to load your profile information"
        >
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error Loading Profile
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={retryLoad}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (!profile) {
    return (
      <StandardPageLayout
        title="Profile"
        subtitle="Profile not found"
      >
        <StandardCard
          title="Profile Not Found"
          subtitle="Unable to load your profile information"
        >
          <div className="text-center py-8">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Profile Not Found
            </h3>
            <p className="text-gray-600 mb-4">
              Your profile information could not be loaded.
            </p>
            <button
              onClick={retryLoad}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reload Profile
            </button>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout
      title="Profile"
      subtitle={`Manage your account information • ${currentProperty?.name || 'No property selected'}`}
    >
      <div className="space-y-6">
        {/* Success/Error Message */}
        {message && (
          <div
            className={`p-4 rounded-lg border flex items-center ${
              message.type === "error"
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-green-50 text-green-700 border-green-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Profile Information */}
        <StandardCard
          title="Profile Information"
          subtitle="Update your personal details"
          icon={<User className="h-5 w-5 text-gray-600" />}
          headerActions={
            hasChanges && (
              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                Unsaved changes
              </span>
            )
          }
        >
          <div className="space-y-6">
            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={handleInputChange('name')}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                placeholder="Your full name"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.name.length}/100 characters
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  disabled={saving}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  placeholder="(555) 123-4567"
                  maxLength={20}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={handleInputChange('address')}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                placeholder="123 Main Street"
                maxLength={200}
              />
            </div>

            {/* City, State, ZIP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={handleInputChange('city')}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  placeholder="City"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={handleInputChange('state')}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  placeholder="State"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={formData.zip}
                  onChange={handleInputChange('zip')}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  placeholder="12345"
                  maxLength={10}
                />
              </div>
            </div>
          </div>
        </StandardCard>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !isFormValid || !hasChanges}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      </div>
    </StandardPageLayout>
  );
}