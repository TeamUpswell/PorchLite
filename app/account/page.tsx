// app/account/page.tsx - Fix the import path
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  canManageProperties,
  canManageUsers,
  getUserRole,
} from "@/lib/utils/roles";
import StandardCard from "@/components/ui/StandardCard";
import ProfileModal from "@/components/modals/ProfileModal"; // ✅ Use your original ProfileModal location

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
  Edit,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";

export default function AccountPage() {
  const { user, profileData, profileLoading } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [avatarKey, setAvatarKey] = useState(0);

  // ✅ Listen for profile updates to refresh avatar
  useEffect(() => {
    const handleProfileChange = (event: CustomEvent) => {
      console.log("🔄 Account Page: Profile data changed:", event.detail);
      setAvatarKey((prev) => prev + 1);
    };

    window.addEventListener(
      "profileDataChanged",
      handleProfileChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "profileDataChanged",
        handleProfileChange as EventListener
      );
    };
  }, []);

  const accountSections = [
    {
      title: "Profile",
      description: "Update your personal information",
      href: "#",
      icon: User,
      color: "text-blue-600",
      show: true,
      onClick: () => setIsProfileModalOpen(true),
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

  const displayName =
    profileData?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  const userRole = getUserRole(user);

  const avatarUrl = profileData?.avatar_url
    ? `${profileData.avatar_url}?t=${Date.now()}&key=${avatarKey}`
    : null;

  if (profileLoading) {
    return (
      <StandardPageLayout>
        <StandardCard>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading...</span>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <StandardPageLayout>
      <div className="space-y-6">
        {/* Profile Card */}
        <StandardCard title="Your Account">
          <div className="flex items-center space-x-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`${displayName}'s avatar`}
                  className="w-20 h-20 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600 shadow-lg"
                  onError={(e) => {
                    console.log("❌ Account page avatar failed to load");
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget
                      .nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
              ) : null}

              <div
                className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-gray-200 dark:border-gray-600 shadow-lg"
                style={{ display: avatarUrl ? "none" : "flex" }}
              >
                <User className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {displayName}
              </h3>
              <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mt-1">
                <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              {profileData?.phone && (
                <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mt-1">
                  <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{profileData.phone}</span>
                </div>
              )}
              <div className="flex items-center mt-2">
                <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm px-3 py-1 rounded-full">
                  {userRole.replace("_", " ").toUpperCase()}
                </span>
              </div>
            </div>

            {/* Edit Button */}
            <div className="flex-shrink-0">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="inline-flex items-center px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            </div>
          </div>
        </StandardCard>

        {/* Account Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleSections.map((section) => {
            const Icon = section.icon;

            if (section.onClick) {
              return (
                <StandardCard key={section.title} hover>
                  <button
                    onClick={section.onClick}
                    className="w-full text-left p-2"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Icon className={`h-6 w-6 ${section.color}`} />
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {section.description}
                    </p>
                  </button>
                </StandardCard>
              );
            }

            return (
              <StandardCard key={section.href} hover>
                <Link href={section.href} className="block p-2">
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={`h-6 w-6 ${section.color}`} />
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {section.description}
                  </p>
                </Link>
              </StandardCard>
            );
          })}
        </div>

        {/* Quick Actions */}
        {(canManageProperties(user) || canManageUsers(user)) && (
          <StandardCard title="Quick Actions">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {canManageProperties(user) && (
                <Link
                  href="/account/properties"
                  className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Building className="h-8 w-8 text-red-600 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Manage Properties
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Add or edit properties
                    </p>
                  </div>
                </Link>
              )}
              {canManageUsers(user) && (
                <Link
                  href="/account/users"
                  className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Users className="h-8 w-8 text-indigo-600 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Manage Users
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Add or edit user accounts
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </StandardCard>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StandardCard>
            <div className="text-center p-4">
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userRole.replace("_", " ").toUpperCase()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Account Role
              </div>
            </div>
          </StandardCard>

          <StandardCard>
            <div className="text-center p-4">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {user?.created_at
                  ? Math.floor(
                      (Date.now() - new Date(user.created_at).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Days Active
              </div>
            </div>
          </StandardCard>

          <StandardCard>
            <div className="text-center p-4">
              <Bell className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {visibleSections.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Available Sections
              </div>
            </div>
          </StandardCard>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </StandardPageLayout>
  );
}
