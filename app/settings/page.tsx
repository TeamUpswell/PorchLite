"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth";
import { supabase } from "@/lib/supabase";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { Settings, UserIcon, KeyIcon } from "lucide-react";

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
    <StandardPageLayout
      title="Settings"
      subtitle="Application settings"
      headerIcon={<Settings className="h-6 w-6 text-blue-600" />}
    >
      <StandardCard title="Settings">
        <div className="text-center py-8">
          <p className="text-gray-500">Settings page coming soon</p>
        </div>
      </StandardCard>
    </StandardPageLayout>
  );
}
