// app/account/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { User } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AccountPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  if (loading) {
    return (
      <StandardPageLayout
        title="Account"
        subtitle="Loading..."
        headerIcon={<User className="h-6 w-6 text-blue-600" />}
      >
        <StandardCard>
          <div className="text-center py-8">Loading account information...</div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout
      title="Account"
      subtitle="Manage your account settings"
      headerIcon={<User className="h-6 w-6 text-blue-600" />}
    >
      <StandardCard title="Profile Information">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1 text-sm text-gray-900">{user?.email}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <div className="mt-1 text-sm text-gray-900">
              {profile?.name || "Not set"}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <div className="mt-1 text-sm text-gray-900">
              {profile?.role || "family"}
            </div>
          </div>
        </div>
      </StandardCard>
    </StandardPageLayout>
  );
}
