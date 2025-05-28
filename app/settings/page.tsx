"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import ProfileForm from "@/components/features/settings/ProfileForm";
import PasswordForm from "@/components/features/settings/PasswordForm";
import { UserIcon, KeyIcon } from "@heroicons/react/24/outline";

interface User {
  id: string;
  email?: string;
  // add other properties as needed
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState({
    full_name: "",
    phone_number: "",
    email: user?.email || "",
    avatar_url: "",
  });
  const [loading, setLoading] = useState(true);

  // Memoize fetchUserProfile with useCallback
  const fetchUserProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          ...profile,
          ...data,
          email: user.email || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, [user, profile, setLoading, setProfile]);

  // Add fetchUserProfile to the dependency array
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user, fetchUserProfile]);

  return (
    <ProtectedPageWrapper>
      <div className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">User Settings</h1>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex -mb-px">
              <button
                onClick={() => setActiveTab("profile")}
                className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "profile"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 mr-2" />
                  Profile Information
                </div>
              </button>

              <button
                onClick={() => setActiveTab("password")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "password"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <KeyIcon className="h-5 w-5 mr-2" />
                  Password
                </div>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow">
            {activeTab === "profile" && (
              <ProfileForm
                profile={profile}
                loading={loading}
                onUpdate={fetchUserProfile}
              />
            )}

            {activeTab === "password" && <PasswordForm />}
          </div>
        </div>
      </div>
    </ProtectedPageWrapper>
  );
}
