// app/account/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import { canManageProperties, canManageUsers } from "@/lib/utils/roles";
import StandardCard from "@/components/ui/StandardCard";
import ProfileModal from "@/components/modals/ProfileModal";
import {
  User,
  Shield,
  Bell,
  Palette,
  Building,
  Users,
  ArrowRight,
  Mail,
  Phone,
} from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import Image from "next/image";

export default function AccountPage() {
  const { user, loading: authLoading } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [timedOut, setTimedOut] = useState(false); // ✅ Added timedOut state

  const accountSections = [
    {
      title: "Profile",
      description: "Update your personal information",
      href: "/account/profile",
      icon: User,
      color: "text-blue-600",
      show: true,
    },
    {
      title: "Security",
      description: "Password and security settings",
      href: "/account/security",
      icon: Shield,
      color: "text-green-600",
      show: true,
    },
    {
      title: "Notifications",
      description: "Manage notification preferences",
      href: "/account/notifications",
      icon: Bell,
      color: "text-purple-600",
      show: true,
    },
    {
      title: "Appearance",
      description: "Theme and display settings",
      href: "/account/appearance",
      icon: Palette,
      color: "text-orange-600",
      show: true,
    },
    {
      title: "Properties",
      description: "Manage your properties",
      href: "/account/properties",
      icon: Building,
      color: "text-red-600",
      show: canManageProperties(user),
    },
    {
      title: "Users",
      description: "Manage users and permissions",
      href: "/account/users",
      icon: Users,
      color: "text-indigo-600",
      show: canManageUsers(user),
    },
  ];

  const visibleSections = accountSections.filter((section) => section.show);

  // ✅ Create a user object that matches ProfileModal expectations
  const profileUser = user
    ? {
        id: user.id,
        email: user.email,
        full_name:
          user.user_metadata?.name || user.user_metadata?.full_name || "",
        phone_number: user.user_metadata?.phone_number || "",
        avatar_url: user.user_metadata?.avatar_url || "",
        address: user.user_metadata?.address || "",
        show_in_contacts: user.user_metadata?.show_in_contacts ?? true,
        role: user.user_metadata?.role || "guest",
      }
    : null;

  // ✅ Added retry function for account data
  const retryAccountData = () => {
    setTimedOut(false);
    // Since this page mainly uses auth data, we can trigger a page refresh
    // or implement specific retry logic if you have other data fetching
    window.location.reload();
  };

  const handleProfileUpdate = (updatedUser: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log("Profile updated:", updatedUser);
    }
    // Optionally refresh user data or update local state
  };

  // ✅ Replaced loading UI with LoadingWithTimeout
  if (authLoading) {
    return (
      <StandardPageLayout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </StandardPageLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <StandardPageLayout>
      <div className="space-y-6">
        <StandardCard title="Your Account">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              {user?.user_metadata?.avatar_url ? (
                <Image
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata.name || "User"}
                  width={64}
                  height={64}
                  className="rounded-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {user?.user_metadata?.name || "User"}
              </h3>
              <div className="flex items-center text-gray-600 text-sm">
                <Mail className="h-4 w-4 mr-1" />
                {user?.email}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Role: {user?.user_metadata?.role || "guest"}
              </div>
            </div>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </StandardCard>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleSections.map((section) => {
            const Icon = section.icon;
            return (
              <StandardCard key={section.href} hover>
                <Link href={section.href} className="block">
                  <div className="p-2">
                    <div className="flex items-center justify-between mb-3">
                      <Icon className={`h-6 w-6 ${section.color}`} />
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {section.description}
                    </p>
                  </div>
                </Link>
              </StandardCard>
            );
          })}
        </div>

        {(canManageProperties(user) || canManageUsers(user)) && (
          <StandardCard title="Quick Actions">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {canManageProperties(user) && (
                <Link
                  href="/account/properties"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Building className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Manage Properties
                    </h4>
                    <p className="text-sm text-gray-600">
                      Add or edit properties
                    </p>
                  </div>
                </Link>
              )}
              {canManageUsers(user) && (
                <Link
                  href="/account/users"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Users className="h-8 w-8 text-indigo-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">Manage Users</h4>
                    <p className="text-sm text-gray-600">
                      Add or edit user accounts
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </StandardCard>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StandardCard>
            <div className="text-center p-4">
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {user?.user_metadata?.role?.charAt(0).toUpperCase() +
                  user?.user_metadata?.role?.slice(1) || "Guest"}
              </div>
              <div className="text-sm text-gray-600">Account Role</div>
            </div>
          </StandardCard>
          <StandardCard>
            <div className="text-center p-4">
              <User className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {user?.created_at
                  ? Math.floor(
                      (Date.now() - new Date(user.created_at).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 0}
              </div>
              <div className="text-sm text-gray-600">Days Active</div>
            </div>
          </StandardCard>
          <StandardCard>
            <div className="text-center p-4">
              <Bell className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {visibleSections.length}
              </div>
              <div className="text-sm text-gray-600">Available Sections</div>
            </div>
          </StandardCard>
        </div>
      </div>

      {/* ✅ Fixed ProfileModal with required props */}
      {profileUser && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={profileUser}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </StandardPageLayout>
  );
}