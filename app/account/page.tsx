// app/account/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import { usePermissions } from "@/lib/hooks/usePermissions"; // ADD: Import permissions
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
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

export default function AccountPage() {
  const { user } = useAuth();
  const { canManageProperties, canManageUsers } = usePermissions(); // ADD: Get permissions

  const accountSections = [
    {
      title: "Profile",
      description: "Update your personal information",
      href: "/account/profile",
      icon: User,
      color: "text-blue-600",
      show: true, // Always show
    },
    {
      title: "Security",
      description: "Password and security settings",
      href: "/account/security",
      icon: Shield,
      color: "text-green-600",
      show: true, // Always show
    },
    {
      title: "Notifications",
      description: "Manage notification preferences",
      href: "/account/notifications",
      icon: Bell,
      color: "text-purple-600",
      show: true, // Always show
    },
    {
      title: "Appearance",
      description: "Theme and display settings",
      href: "/account/appearance",
      icon: Palette,
      color: "text-orange-600",
      show: true, // Always show
    },
    {
      title: "Properties",
      description: "Manage your properties",
      href: "/account/properties",
      icon: Building,
      color: "text-red-600",
      show: canManageProperties(), // CHANGE: Only show if user can manage properties
    },
    {
      title: "Users",
      description: "Manage users and permissions",
      href: "/account/users",
      icon: Users,
      color: "text-indigo-600",
      show: canManageUsers(), // CHANGE: Only show if user can manage users
    },
  ];

  // CHANGE: Filter sections based on permissions
  const visibleSections = accountSections.filter((section) => section.show);

  return (
    <div className="p-6">
      <Header title="Account Settings" />
      <PageContainer>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center space-x-3">
            <User className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Account Settings
              </h1>
              <p className="text-gray-600">
                Manage your account and preferences
              </p>
            </div>
          </div>

          {/* Quick Profile Info */}
          <StandardCard title="Your Account">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
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
              <Link
                href="/account/profile"
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Edit Profile
              </Link>
            </div>
          </StandardCard>

          {/* Account Sections Grid */}
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
        </div>
      </PageContainer>
    </div>
  );
}
