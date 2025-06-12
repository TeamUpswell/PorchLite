"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/Header"; // ✅ Fixed import path
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
  const { user: currentUser } = useAuth();
  const { canManageUsers } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("guest");
  const [isInviting, setIsInviting] = useState(false);

  const hasAccess = canManageUsers();

  useEffect(() => {
    if (hasAccess) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [hasAccess]);

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

  if (!hasAccess) {
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
                <p className="text-gray-600">Access restricted</p>
              </div>
            </div>

            <StandardCard>
              <div className="p-8 text-center">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Access Restricted
                </h3>
                <p className="text-gray-500 mb-4">
                  You don't have permission to manage users.
                </p>
                <div className="text-xs text-gray-400 mt-4 p-2 bg-gray-50 rounded">
                  <p>
                    Debug: Role ={" "}
                    {currentUser?.user_metadata?.role || "undefined"}
                  </p>
                  <p>User ID = {currentUser?.id || "undefined"}</p>
                </div>
              </div>
            </StandardCard>
          </div>
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
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={isInviting}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
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
                        <div className="text-xs text-gray-400">
                          Role: {user.user_metadata?.role || "guest"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Users Found
                </h3>
                <p className="text-gray-500">
                  Start by inviting your first user.
                </p>
              </div>
            )}
          </StandardCard>
        </div>
      </PageContainer>
    </div>
  );
}
