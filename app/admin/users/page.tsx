"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  Mail,
  Phone,
  Search,
  Filter,
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  role?: string;
  last_sign_in?: string;
}

interface UserRole {
  user_id: string;
  role: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { canManageUsers } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  const roles = [
    { id: "all", name: "All Roles" },
    { id: "admin", name: "Admin" },
    { id: "manager", name: "Manager" },
    { id: "staff", name: "Staff" },
    { id: "guest", name: "Guest" },
  ];

  // Check if user has admin access
  const hasAccess = () => {
    if (!currentUser) return false;
    const role = currentUser.user_metadata?.role;
    return ["admin", "owner"].includes(role?.toLowerCase()) || canManageUsers();
  };

  useEffect(() => {
    if (hasAccess()) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  async function fetchUsers() {
    try {
      setLoading(true);

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Create role mapping
      const roleMap: Record<string, string> = {};
      rolesData?.forEach((role) => {
        roleMap[role.user_id] = role.role;
      });

      setUsers(profilesData || []);
      setUserRoles(roleMap);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const userRole = userRoles[user.id];
    const matchesRole = selectedRole === "all" || userRole === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // First, try to update existing role
      const { error: updateError } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (updateError) {
        // If update fails, try to insert new role
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role: newRole }]);

        if (insertError) throw insertError;
      }

      // Update local state
      setUserRoles((prev) => ({ ...prev, [userId]: newRole }));
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update user role");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot delete your own account");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Delete user role first
      await supabase.from("user_roles").delete().eq("user_id", userId);

      // Delete user profile
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      // Update local state
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setUserRoles((prev) => {
        const newRoles = { ...prev };
        delete newRoles[userId];
        return newRoles;
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "staff":
        return "bg-green-100 text-green-800";
      case "guest":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalUsers = users.length;
  const adminCount = Object.values(userRoles).filter(
    (role) => role === "admin"
  ).length;
  const managerCount = Object.values(userRoles).filter(
    (role) => role === "manager"
  ).length;
  const staffCount = Object.values(userRoles).filter(
    (role) => role === "staff"
  ).length;

  // Access denied for non-admin users
  if (!hasAccess()) {
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
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Access Restricted
                </h3>
                <p className="text-gray-500 mb-4">
                  You don't have permission to manage users.
                </p>
                <div className="text-xs text-gray-400 mt-4 p-2 bg-gray-50 rounded">
                  <p>Debug: Role = {currentUser?.user_metadata?.role || "undefined"}</p>
                  <p>User ID = {currentUser?.id || "undefined"}</p>
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
      <Header title="User Management" />
      <PageContainer>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  User Management
                </h1>
                <p className="text-gray-600">
                  Manage user accounts and permissions
                </p>
              </div>
            </div>
            <Link
              href="/admin/users/invite"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Invite User
            </Link>
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StandardCard className="text-center" hover>
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {totalUsers}
              </div>
              <p className="text-gray-600 text-sm">Total Users</p>
            </StandardCard>

            <StandardCard className="text-center" hover>
              <div className="text-2xl font-bold text-red-600 mb-1">
                {adminCount}
              </div>
              <p className="text-gray-600 text-sm">Admins</p>
            </StandardCard>

            <StandardCard className="text-center" hover>
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {managerCount}
              </div>
              <p className="text-gray-600 text-sm">Managers</p>
            </StandardCard>

            <StandardCard className="text-center" hover>
              <div className="text-2xl font-bold text-green-600 mb-1">
                {staffCount}
              </div>
              <p className="text-gray-600 text-sm">Staff</p>
            </StandardCard>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StandardCard>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </StandardCard>

            <StandardCard>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedRole === role.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {role.name}
                  </button>
                ))}
              </div>
            </StandardCard>
          </div>

          {/* Users List */}
          <StandardCard
            title="Users"
            subtitle={`${filteredUsers.length} user${
              filteredUsers.length !== 1 ? "s" : ""
            } found`}
          >
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="space-y-4">
                {filteredUsers.map((user) => {
                  const userRole = userRoles[user.id];
                  const isCurrentUser = user.id === currentUser?.id;

                  return (
                    <div
                      key={user.id}
                      className={`border rounded-lg p-4 transition-all ${
                        isCurrentUser
                          ? "border-blue-200 bg-blue-50"
                          : "border-gray-200 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.full_name || user.email}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <Users className="h-6 w-6 text-gray-400" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium text-gray-900">
                                {user.full_name || "Unnamed User"}
                              </h3>
                              {isCurrentUser && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  You
                                </span>
                              )}
                              {userRole && (
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                                    userRole
                                  )}`}
                                >
                                  <Shield className="h-3 w-3 mr-1" />
                                  {userRole}
                                </span>
                              )}
                            </div>

                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-2" />
                                <span>{user.email}</span>
                              </div>

                              {user.phone_number && (
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 mr-2" />
                                  <span>{user.phone_number}</span>
                                </div>
                              )}
                            </div>

                            <div className="mt-2 text-xs text-gray-500">
                              Joined{" "}
                              {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          {!isCurrentUser && (
                            <>
                              <select
                                value={userRole || ""}
                                onChange={(e) =>
                                  handleRoleChange(user.id, e.target.value)
                                }
                                className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">No Role</option>
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                                <option value="staff">Staff</option>
                                <option value="guest">Guest</option>
                              </select>

                              <Link
                                href={`/admin/users/${user.id}/edit`}
                                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit User"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>

                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>No users found</p>
                <p className="text-sm mt-1">
                  {searchTerm || selectedRole !== "all"
                    ? "Try adjusting your search or filters"
                    : "Invite users to get started"}
                </p>
              </div>
            )}
          </StandardCard>
        </div>
      </PageContainer>
    </div>
  );
}
