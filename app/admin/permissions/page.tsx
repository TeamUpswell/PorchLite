"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import {
  canManageUsers,
  getUserRoleBadge,
  getUserRoleColor,
} from "@/lib/utils/roles";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import {
  Shield,
  Users,
  Settings,
  Key,
  Lock,
  UserCheck,
  AlertTriangle,
} from "lucide-react";

interface PermissionRule {
  id: string;
  name: string;
  description: string;
  roles: string[];
  resource: string;
  actions: string[];
}

export default function AdminPermissionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<PermissionRule[]>([]);
  const [stats, setStats] = useState({
    totalRoles: 6,
    totalUsers: 0,
    activePermissions: 12,
    securityIssues: 0,
  });

  // Check if user has access
  const hasAccess = canManageUsers(user);

  useEffect(() => {
    if (!authLoading) {
      if (hasAccess) {
        fetchPermissionData();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading, hasAccess]);

  const fetchPermissionData = async () => {
    try {
      // Mock permission data - replace with actual API calls
      const mockPermissions: PermissionRule[] = [
        {
          id: "1",
          name: "User Management",
          description: "Create, edit, and delete users",
          roles: ["admin", "owner"],
          resource: "users",
          actions: ["create", "read", "update", "delete"],
        },
        {
          id: "2",
          name: "Property Management",
          description: "Manage properties and settings",
          roles: ["admin", "owner", "manager"],
          resource: "properties",
          actions: ["create", "read", "update", "delete"],
        },
        {
          id: "3",
          name: "Tenant Access",
          description: "View property information and submit requests",
          roles: ["tenant", "staff"],
          resource: "properties",
          actions: ["read"],
        },
        {
          id: "4",
          name: "Cleaning Management",
          description: "Manage cleaning schedules and checklists",
          roles: ["admin", "manager", "staff"],
          resource: "cleaning",
          actions: ["create", "read", "update"],
        },
      ];

      setPermissions(mockPermissions);
      setStats({
        totalRoles: 6,
        totalUsers: 25,
        activePermissions: mockPermissions.length,
        securityIssues: 0,
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching permission data:", error);
      setLoading(false);
    }
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="p-6">
        <Header title="Permission Management" />
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
        <Header title="Permission Management" />
        <PageContainer>
          <StandardCard>
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Access Denied
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You don't have permission to manage system permissions.
              </p>
              <div className="text-xs text-gray-400 mt-4 p-2 bg-gray-50 rounded">
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
      <Header title="Permission Management" />
      <PageContainer>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Permission Management
                </h1>
                <p className="text-gray-600">
                  Manage user roles and system permissions
                </p>
              </div>
            </div>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Key className="h-4 w-4 mr-2" />
              Create Permission
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StandardCard hover>
              <div className="text-center p-4">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : stats.totalRoles}
                </div>
                <div className="text-sm text-gray-600">User Roles</div>
              </div>
            </StandardCard>
            <StandardCard hover>
              <div className="text-center p-4">
                <UserCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : stats.totalUsers}
                </div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
            </StandardCard>
            <StandardCard hover>
              <div className="text-center p-4">
                <Key className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : stats.activePermissions}
                </div>
                <div className="text-sm text-gray-600">Permissions</div>
              </div>
            </StandardCard>
            <StandardCard hover>
              <div className="text-center p-4">
                <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? "..." : stats.securityIssues}
                </div>
                <div className="text-sm text-gray-600">Security Issues</div>
              </div>
            </StandardCard>
          </div>

          {/* Role Hierarchy */}
          <StandardCard
            title="Role Hierarchy"
            subtitle="System role levels and inheritance"
          >
            <div className="space-y-4">
              {[
                {
                  role: "owner",
                  name: "Owner",
                  level: 6,
                  description: "Full system access",
                },
                {
                  role: "admin",
                  name: "Admin",
                  level: 5,
                  description: "Administrative access",
                },
                {
                  role: "manager",
                  name: "Manager",
                  level: 4,
                  description: "Property management",
                },
                {
                  role: "staff",
                  name: "Staff",
                  level: 3,
                  description: "Operational tasks",
                },
                {
                  role: "tenant",
                  name: "Tenant",
                  level: 2,
                  description: "Tenant access",
                },
                {
                  role: "guest",
                  name: "Guest",
                  level: 1,
                  description: "Limited access",
                },
              ].map((item) => (
                <div
                  key={item.role}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">
                      {getUserRoleBadge(item.role)}
                    </span>
                    <div>
                      <div className="font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {item.description}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getUserRoleColor(
                        item.role
                      )}`}
                    >
                      {item.role}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Level {item.level}
                  </div>
                </div>
              ))}
            </div>
          </StandardCard>

          {/* Permission Rules */}
          <StandardCard
            title="Permission Rules"
            subtitle="Current system permissions"
          >
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading permissions...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Key className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {permission.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {permission.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-3">
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500">
                                Roles:
                              </span>
                              <div className="flex space-x-1">
                                {permission.roles.map((role) => (
                                  <div
                                    key={role}
                                    className="flex items-center space-x-1"
                                  >
                                    <span className="text-sm">
                                      {getUserRoleBadge(role)}
                                    </span>
                                    <span
                                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getUserRoleColor(
                                        role
                                      )}`}
                                    >
                                      {role}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500">
                                Actions:
                              </span>
                              <span className="text-xs text-gray-700">
                                {permission.actions.join(", ")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                          <Settings className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                          <Lock className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </StandardCard>

          {/* Security Settings */}
          <StandardCard
            title="Security Settings"
            subtitle="System-wide security configuration"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default User Role
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="guest">Guest</option>
                    <option value="tenant">Tenant</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    defaultValue={60}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
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
                    Require email verification for new accounts
                  </span>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    defaultChecked
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Enable audit logging for permission changes
                  </span>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Allow users to request role upgrades
                  </span>
                </div>
              </div>
              <div className="flex justify-end">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Save Security Settings
                </button>
              </div>
            </div>
          </StandardCard>

          {/* Current User Info */}
          <div className="text-gray-500 dark:text-gray-400 text-sm bg-gray-50 rounded-lg p-4">
            <p className="mb-2">
              💡 <strong>Permission Management:</strong>
            </p>
            <ul className="space-y-1">
              <li>
                • Your role:{" "}
                <strong>{user?.user_metadata?.role || "guest"}</strong>
              </li>
              <li>• You can manage user permissions and roles</li>
              <li>• Role hierarchy determines access levels</li>
              <li>• Security settings apply system-wide</li>
            </ul>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
