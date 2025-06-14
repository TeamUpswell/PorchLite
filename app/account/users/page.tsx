"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import {
  canManageUsers,
  getUserRoleBadge,
  getUserRoleColor,
} from "@/lib/utils/roles";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import { Users, UserPlus, Mail, Shield, Edit, Trash2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
    role?: string;
  };
  created_at: string;
  last_sign_in_at?: string;
}

export default function UsersPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("guest");
  const [isInviting, setIsInviting] = useState(false);

  const hasAccess = canManageUsers(currentUser);

  useEffect(() => {
    if (!authLoading) {
      if (hasAccess) {
        fetchUsers();
      } else {
        setLoading(false);
      }
    }
  }, [hasAccess, authLoading]);

  const fetchUsers = async () => {
    try {
      // In a real app, you'd have an admin endpoint to fetch users
      // For now, we'll show a placeholder
      setUsers([]);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);

    try {
      // TODO: Implement user invitation logic
      console.log("Inviting user:", inviteEmail, "with role:", inviteRole);

      // Reset form
      setInviteEmail("");
      setInviteRole("guest");
    } catch (error) {
      console.error("Error inviting user:", error);
    } finally {
      setIsInviting(false);
    }
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="p-6">
        <Header title="User Management" />
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

  if (!currentUser) {
    return null; // Auth will redirect
  }

  if (!hasAccess) {
    return (
      <div className="p-6">
        <Header title="User Management" />
        <PageContainer>
          <StandardCard>
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Access Denied
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You don't have permission to manage users.
              </p>
              <div className="text-xs text-gray-400 mt-4 p-2 bg-gray-50 rounded">
                <p>Role: {currentUser?.user_metadata?.role || "undefined"}</p>
                <p>Required: Admin or above</p>
              </div>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <Header title="User Management" />
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading users...</span>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Header title="User Management" />
      <PageContainer>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                User Management
              </h1>
              <p className="text-gray-600">
                Manage users and their permissions
              </p>
            </div>
          </div>

          {/* Invite User Section */}
          <StandardCard
            title="Invite New User"
            subtitle="Send an invitation to join your property"
            icon={<UserPlus className="h-5 w-5 text-gray-600" />}
          >
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Role
                  </label>
                  <select
                    id="role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="guest">Guest</option>
                    <option value="tenant">Tenant</option>
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={isInviting}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Mail className="h-4 w-4 mr-2" />
                {isInviting ? "Sending..." : "Send Invitation"}
              </button>
            </form>
          </StandardCard>

          {/* Users List */}
          <StandardCard
            title="Current Users"
            subtitle="Manage existing users and their roles"
          >
            {users.length > 0 ? (
              <div className="space-y-4">
                {users.map((user) => {
                  const userRole = user.user_metadata?.role || "guest";
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {user.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.user_metadata?.name || user.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-lg">
                              {getUserRoleBadge(userRole)}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getUserRoleColor(
                                userRole
                              )}`}
                            >
                              {userRole}
                            </span>
                            {user.last_sign_in_at && (
                              <span className="text-xs text-gray-400">
                                Last active:{" "}
                                {new Date(
                                  user.last_sign_in_at
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Users Found
                </h3>
                <p className="text-gray-500 mb-4">
                  Start by inviting your first user to this property.
                </p>
                <div className="text-sm text-gray-400 bg-gray-50 rounded-lg p-4">
                  <p className="mb-2">
                    💡 <strong>Coming Soon:</strong>
                  </p>
                  <ul className="text-left space-y-1">
                    <li>• User invitation system</li>
                    <li>• Role management</li>
                    <li>• Activity tracking</li>
                    <li>• Bulk user operations</li>
                  </ul>
                </div>
              </div>
            )}
          </StandardCard>

          {/* Role Information */}
          <StandardCard
            title="Role Permissions"
            subtitle="Understanding user roles"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  role: "guest",
                  name: "Guest",
                  description: "Limited read-only access",
                },
                {
                  role: "tenant",
                  name: "Tenant",
                  description: "Basic property access and requests",
                },
                {
                  role: "staff",
                  name: "Staff",
                  description: "Operational tasks and maintenance",
                },
                {
                  role: "manager",
                  name: "Manager",
                  description: "Property management and staff oversight",
                },
                {
                  role: "admin",
                  name: "Admin",
                  description: "Full system access and user management",
                },
                {
                  role: "owner",
                  name: "Owner",
                  description: "Complete ownership and control",
                },
              ].map((item) => (
                <div
                  key={item.role}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">
                      {getUserRoleBadge(item.role)}
                    </span>
                    <span className="font-medium text-gray-900">
                      {item.name}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getUserRoleColor(
                        item.role
                      )}`}
                    >
                      {item.role}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </StandardCard>

          {/* Current User Info */}
          <div className="text-gray-500 dark:text-gray-400 text-sm bg-gray-50 rounded-lg p-4">
            <p className="mb-2">
              💡 <strong>Your Access Level:</strong>
            </p>
            <ul className="space-y-1">
              <li>
                • Your role:{" "}
                <strong>{currentUser?.user_metadata?.role || "guest"}</strong>
              </li>
              <li>• You can invite and manage users</li>
              <li>• User invitations will be sent via email</li>
              <li>• Role changes take effect immediately</li>
            </ul>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
