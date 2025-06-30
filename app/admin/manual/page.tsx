"use client";

// REMOVE ANY EXISTING revalidate CONFIGS
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { canManageUsers } from "@/lib/utils/roles";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Building,
  Shield,
} from "lucide-react";
import Link from "next/link";

export default function AdminManualPage() {
  const { user, loading: authLoading } = useAuth();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalManuals: 0,
    totalSections: 0,
    activeProperties: 0,
  });

  // Check if user has access
  const hasAccess = canManageUsers(user);

  useEffect(() => {
    if (!authLoading) {
      if (hasAccess) {
        fetchManualData();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading, hasAccess]);

  const fetchManualData = async () => {
    try {
      // TODO: Implement actual data fetching
      // Simulate loading for now
      setTimeout(() => {
        setStats({
          totalManuals: 5,
          totalSections: 23,
          activeProperties: 3,
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching manual data:", error);
      setLoading(false);
    }
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="p-6">
        <Header title="Admin Manual Management" />
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading...</span>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  if (!user) {
    return null; // Auth will redirect
  }

  if (!hasAccess) {
    return (
      <div className="p-6">
        <Header title="Admin Manual Management" />
        <PageContainer>
          <StandardCard>
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-gray-600 dark:text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Access Denied
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You don't have permission to manage manuals.
              </p>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-4 p-2 bg-gray-50 rounded">
                <p>Role: {user?.user_metadata?.role || "undefined"}</p>
                <p>Required: Admin or above</p>
              </div>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Header title="Admin Manual Management" />
      <PageContainer>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Admin Manual Management
                </h1>
                <p className="text-gray-600">
                  Manage all property manuals from here
                </p>
              </div>
            </div>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StandardCard hover>
              <div className="text-center p-4">
                <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : stats.totalManuals}
                </div>
                <div className="text-sm text-gray-600">Total Manuals</div>
              </div>
            </StandardCard>
            <StandardCard hover>
              <div className="text-center p-4">
                <Edit className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : stats.totalSections}
                </div>
                <div className="text-sm text-gray-600">Total Sections</div>
              </div>
            </StandardCard>
            <StandardCard hover>
              <div className="text-center p-4">
                <Building className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : stats.activeProperties}
                </div>
                <div className="text-sm text-gray-600">Active Properties</div>
              </div>
            </StandardCard>
          </div>

          {/* Manual Administration */}
          <StandardCard
            title="Manual Administration"
            subtitle="Manage property manuals and templates"
          >
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading manuals...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm text-center transition-all">
                      <Plus className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <div className="font-medium text-gray-900">
                        Create Manual
                      </div>
                      <div className="text-sm text-gray-600">
                        New property manual
                      </div>
                    </button>
                    <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm text-center transition-all">
                      <Edit className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <div className="font-medium text-gray-900">
                        Edit Templates
                      </div>
                      <div className="text-sm text-gray-600">
                        Manage section templates
                      </div>
                    </button>
                    <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm text-center transition-all">
                      <Eye className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <div className="font-medium text-gray-900">
                        Preview Manuals
                      </div>
                      <div className="text-sm text-gray-600">
                        View all manuals
                      </div>
                    </button>
                    <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm text-center transition-all">
                      <Users className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                      <div className="font-medium text-gray-900">
                        User Access
                      </div>
                      <div className="text-sm text-gray-600">
                        Manage permissions
                      </div>
                    </button>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Recent Activity
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <BookOpen className="h-12 w-12 text-gray-600 dark:text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">
                        Manual management features are being developed
                      </p>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p className="mb-2">
                          💡 <strong>Coming Soon:</strong>
                        </p>
                        <ul className="text-left space-y-1 max-w-md mx-auto">
                          <li>• Full manual editing interface</li>
                          <li>• Template management system</li>
                          <li>• User access controls</li>
                          <li>• Version history tracking</li>
                          <li>• Bulk operations</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </StandardCard>

          {/* Global Manual Settings */}
          <StandardCard
            title="Global Settings"
            subtitle="System-wide manual configuration"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Manual Template
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="standard">Standard Property Manual</option>
                    <option value="vacation">Vacation Rental Template</option>
                    <option value="apartment">
                      Apartment Complex Template
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto-Generate Sections
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      defaultChecked
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Automatically create common sections for new manuals
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    defaultChecked
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Enable version control for manual changes
                  </span>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Allow tenants to suggest manual improvements
                  </span>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    defaultChecked
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Send notifications for manual updates
                  </span>
                </div>
              </div>
              <div className="flex justify-end">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Save Settings
                </button>
              </div>
            </div>
          </StandardCard>

          {/* Current User Info */}
          <div className="text-gray-700 dark:text-gray-300 text-sm bg-gray-50 rounded-lg p-4">
            <p className="mb-2">
              💡 <strong>Manual Management:</strong>
            </p>
            <ul className="space-y-1">
              <li>
                • Your role:{" "}
                <strong>{user?.user_metadata?.role || "guest"}</strong>
              </li>
              <li>• You can create and edit property manuals</li>
              <li>• Templates can be shared across properties</li>
              <li>• Manual changes are tracked for audit purposes</li>
            </ul>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
