"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  canManageProperties,
  canManageUsers,
  getUserRole,
} from "@/lib/utils/roles";
import StandardCard from "@/components/ui/StandardCard";
import ProfileModal from "@/components/modals/ProfileModal";
import Image from "next/image";

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

export default function AccountPage() {
  const { user, profileData, profileLoading } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [avatarKey, setAvatarKey] = useState(0);
  const [imageError, setImageError] = useState(false);

  // Listen for profile updates to refresh avatar
  useEffect(() => {
    const handleProfileChange = (event: CustomEvent) => {
      // Use debugLog instead of console.log
      // debugLog("🔄 Account Page: Profile data changed:", event.detail);
      setAvatarKey((prev) => prev + 1);
      setImageError(false); // Reset image error on profile change
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

  // Loading state
  if (profileLoading) {
    return (
      <StandardCard>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600">⏳ Loading account...</p>
          </div>
        </div>
      </StandardCard>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <StandardCard
        title="Account"
        subtitle="Manage your profile and account settings"
        headerActions={
          <div className="flex items-center text-sm text-gray-600">
            <User className="h-4 w-4 mr-1" />
            {userRole.replace("_", " ").toUpperCase()}
          </div>
        }
      />

      {/* Profile Card */}
      <StandardCard
        title="Your Profile"
        subtitle="Personal information and account details"
        headerActions={
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="inline-flex items-center px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300  rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </button>
        }
      >
        <div className="flex items-center space-x-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {avatarUrl && !imageError ? (
              <Image
                src={avatarUrl}
                alt={`${displayName}'s avatar`}
                width={80}
                height={80}
                className="rounded-full object-cover border-4 border-gray-200 dark:border-gray-600 shadow-lg"
                onError={() => {
                  setImageError(true);
                }}
                priority
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-gray-200 dark:border-gray-600 shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {displayName}
            </h3>
            <div className="flex items-center text-gray-700 dark:text-gray-300 text-sm mt-1">
              <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            {profileData?.phone && (
              <div className="flex items-center text-gray-700 dark:text-gray-300 text-sm mt-1">
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
        </div>
      </StandardCard>

      {/* Account Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StandardCard className="text-center p-6">
          <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {userRole.replace("_", " ").toUpperCase()}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Account Role
          </div>
        </StandardCard>

        <StandardCard className="text-center p-6">
          <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {user?.created_at
              ? Math.floor(
                  (Date.now() - new Date(user.created_at).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : 0}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Days Active
          </div>
        </StandardCard>

        <StandardCard className="text-center p-6">
          <Bell className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {visibleSections.length}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Available Sections
          </div>
        </StandardCard>
      </div>

      {/* Account Settings */}
      <StandardCard
        title="Account Settings"
        subtitle="Manage your preferences and configurations"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleSections.map((section) => {
            const Icon = section.icon;

            if (section.onClick) {
              return (
                <div
                  key={section.title}
                  className=" rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <button
                    onClick={section.onClick}
                    className="w-full text-left p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Icon className={`h-6 w-6 ${section.color}`} />
                      <ArrowRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {section.description}
                    </p>
                  </button>
                </div>
              );
            }

            return (
              <Link
                key={section.href}
                href={section.href}
                className="block  rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={`h-6 w-6 ${section.color}`} />
                    <ArrowRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {section.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </StandardCard>

      {/* Quick Actions */}
      {(canManageProperties(user) || canManageUsers(user)) && (
        <StandardCard
          title="Quick Actions"
          subtitle="Frequently used management tools"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {canManageProperties(user) && (
              <Link
                href="/account/properties"
                className="flex items-center p-4  rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Building className="h-8 w-8 text-red-600 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Manage Properties
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Add or edit properties
                  </p>
                </div>
              </Link>
            )}
            {canManageUsers(user) && (
              <Link
                href="/account/users"
                className="flex items-center p-4  rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Users className="h-8 w-8 text-indigo-600 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Manage Users
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Add or edit user accounts
                  </p>
                </div>
              </Link>
            )}
          </div>
        </StandardCard>
      )}

      {/* Account Tips */}
      <StandardCard
        title="Account Tips"
        subtitle="Make the most of your PorchLite account"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium text-sm">1</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  Complete Your Profile
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Add a profile photo and contact information for better collaboration
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-medium text-sm">2</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  Enable Notifications
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Stay informed about important updates and property activities
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-medium text-sm">3</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  Secure Your Account
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Use a strong password and keep your security settings updated
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-medium text-sm">4</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  Customize Appearance
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Choose themes and display settings that work best for you
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-medium text-sm">5</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  Manage Properties
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Keep your property information up to date for better management
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-medium text-sm">6</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  Invite Team Members
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Collaborate with others by inviting them to manage properties
                </p>
              </div>
            </div>
          </div>
        </div>
      </StandardCard>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}