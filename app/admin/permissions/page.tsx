"use client";

// REMOVE ANY EXISTING revalidate CONFIGS
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import { BookOpen, Plus, Edit, Trash2, Eye, Users, Building } from "lucide-react";
import Link from "next/link";

export default function AdminManualPage() {
  const { user } = useAuth();
  const { canManageUsers } = usePermissions();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalManuals: 0,
    totalSections: 0,
    activeProperties: 0,
  });

  // Check if user has admin access
  const hasAccess = () => {
    if (!user) return false;
    const role = user.user_metadata?.role;
    return ["admin", "owner"].includes(role?.toLowerCase()) || canManageUsers();
  };

  useEffect(() => {
    if (hasAccess()) {
      fetchManualData();
    } else {
      setLoading(false);
    }
  }, [user]);

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

  if (!hasAccess()) {
    return (
      <div className="p-6">
        <Header title="Admin Manual Management" />
        <PageContainer>
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center space-x-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Admin Manual Management
                </h1>
                <p className="text-gray-600">Access restricted</p>
              </div>
            </div>

            <StandardCard>
              <div className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Access Restricted
                </h3>
                <p className="text-gray-500 mb-4">
                  You don't have permission to manage manuals.
                </p>
                <div className="text-xs text-gray-400 mt-4 p-2 bg-gray-50 rounded">
                  <p>Debug: Role = {user?.user_metadata?.role || "undefined"}</p>
                  <p>User ID = {user?.id || "undefined"}</p>
                </div>
              </div>
            </StandardCard>
          </div>
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
            <StandardCard>
              <div className="text-center p-4">
                <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : stats.totalManuals}
                </div>
                <div className="text-sm text-gray-600">Total Manuals</div>
              </div>
            </StandardCard>
            <StandardCard>
              <div className="text-center p-4">
                <Edit className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : stats.totalSections}
                </div>
                <div className="text-sm text-gray-600">Total Sections</div>
              </div>
            </StandardCard>
            <StandardCard>
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
          <StandardCard title="Manual Administration">
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
                    <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 text-center transition-colors">
                      <Plus className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <div className="font-medium text-gray-900">Create Manual</div>
                      <div className="text-sm text-gray-600">New property manual</div>
                    </button>
                    <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 text-center transition-colors">
                      <Edit className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <div className="font-medium text-gray-900">Edit Templates</div>
                      <div className="text-sm text-gray-600">Manage section templates</div>
                    </button>
                    <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 text-center transition-colors">
                      <Eye className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <div className="font-medium text-gray-900">Preview Manuals</div>
                      <div className="text-sm text-gray-600">View all manuals</div>
                    </button>
                    <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 text-center transition-colors">
                      <Users className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                      <div className="font-medium text-gray-900">User Access</div>
                      <div className="text-sm text-gray-600">Manage permissions</div>
                    </button>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">
                        Manual management features are being developed
                      </p>
                      <div className="text-sm text-gray-400">
                        Coming soon: Full manual editing, template management, and user access controls
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
                    <option>Standard Property Manual</option>
                    <option>Vacation Rental Template</option>
                    <option>Apartment Complex Template</option>
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
              <div className="flex justify-end">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Save Settings
                </button>
              </div>
            </div>
          </StandardCard>
        </div>
      </PageContainer>
    </div>
  );
}
