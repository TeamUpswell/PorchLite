"use client";

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
  MoreVertical,
  UserPlus,
  Settings,
  RefreshCw,
} from "lucide-react";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { canManageUsers } from "@/lib/utils/roles";
import { createClient } from "@supabase/supabase-js";
import CreateUserModal from "@/components/admin/CreateUserModal";
import toast from "react-hot-toast";

// ✅ ADDED: Environment-aware logging helpers
const logInfo = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log(message, ...args);
  }
};

const logError = (message: string, error: any) => {
  if (process.env.NODE_ENV === "development") {
    console.error(message, error);
  }
  // We could add error reporting service integration here
};

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

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UsersPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // ✅ ADDED: State for delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Check if user has access
  const hasAccess = canManageUsers(currentUser);

  const roles = [
    { id: "all", name: "All Roles", count: users.length },
    {
      id: "admin",
      name: "Admin",
      count: Object.values(userRoles).filter((r) => r === "admin").length,
    },
    {
      id: "manager",
      name: "Manager",
      count: Object.values(userRoles).filter((r) => r === "manager").length,
    },
    {
      id: "staff",
      name: "Staff",
      count: Object.values(userRoles).filter((r) => r === "staff").length,
    },
    {
      id: "tenant",
      name: "Tenant",
      count: Object.values(userRoles).filter((r) => r === "tenant").length,
    },
    {
      id: "guest",
      name: "Guest",
      count: Object.values(userRoles).filter((r) => r === "guest").length,
    },
  ];

  useEffect(() => {
    if (!authLoading && hasAccess) {
      fetchUsers();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [currentUser, authLoading, hasAccess]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      let rolesMap: Record<string, string> = {};
      try {
        const { data: rolesData, error: rolesError } = await supabase
          .from("user_roles")
          .select("user_id, role");

        if (!rolesError && rolesData) {
          rolesMap = rolesData.reduce((acc, role) => {
            acc[role.user_id] = role.role;
            return acc;
          }, {} as Record<string, string>);
        }
      } catch (roleError) {
        // ✅ FIXED: Using environment-aware logging
        logInfo("No user_roles table found, using metadata roles");
        // Fallback to user_metadata for roles
        profilesData?.forEach((user) => {
          rolesMap[user.id] = user.user_metadata?.role || "guest";
        });
      }

      setUsers(profilesData || []);
      setUserRoles(rolesMap);
    } catch (error) {
      // ✅ FIXED: Using environment-aware logging
      logError("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const userRole = userRoles[user.id] || "guest";
    const matchesRole = selectedRole === "all" || userRole === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userData: { role: newRole },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user role");
      }

      setUserRoles((prev) => ({ ...prev, [userId]: newRole }));
      toast.success("User role updated successfully");
    } catch (error) {
      // ✅ FIXED: Using environment-aware logging
      logError("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  // ✅ FIXED: Replaced window.confirm with proper state management
  const initiateDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    setUserToDelete(userId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!userId) return;

    try {
      const response = await fetch("/api/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setUserRoles((prev) => {
        const newRoles = { ...prev };
        delete newRoles[userId];
        return newRoles;
      });
      toast.success("User deleted successfully");
    } catch (error) {
      // ✅ FIXED: Using environment-aware logging
      logError("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setUserToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "owner":
        return "bg-purple-100 text-purple-800";
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "staff":
        return "bg-green-100 text-green-800";
      case "tenant":
        return "bg-yellow-100 text-yellow-800";
      case "guest":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case "owner":
        return "👑";
      case "admin":
        return "🛡️";
      case "manager":
        return "📋";
      case "staff":
        return "👷";
      case "tenant":
        return "🏠";
      case "guest":
        return "👤";
      default:
        return "❓";
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
                You don&apos;t have permission to manage users.
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

  return (
    <div className="p-6">
      <Header title="User Management" />
      <PageContainer>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex justify-between items-center">
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
            <div className="flex gap-3">
              <button
                onClick={fetchUsers}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {roles.map((role) => (
              <StandardCard key={role.id} className="text-center" hover>
                <div className="text-2xl mb-1">{getRoleBadge(role.id)}</div>
                <div className="text-lg font-bold text-gray-900">
                  {role.count}
                </div>
                <div className="text-xs text-gray-600">{role.name}</div>
              </StandardCard>
            ))}
          </div>

          {/* Role Filter Tabs */}
          <StandardCard>
            <div className="flex space-x-1 overflow-x-auto pb-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedRole === role.id
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {getRoleBadge(role.id)} {role.name} ({role.count})
                </button>
              ))}
            </div>
          </StandardCard>

          {/* Users Table */}
          <StandardCard
            title="Users"
            subtitle={`${filteredUsers.length} users found`}
          >
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading users...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => {
                      const userRole = userRoles[user.id] || "guest";
                      const isCurrentUser = user.id === currentUser?.id;
                      return (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {user.avatar_url ? (
                                  <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={user.avatar_url}
                                    alt=""
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="flex items-center space-x-2">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.full_name || "No name"}
                                  </div>
                                  {isCurrentUser && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {user.phone_number ? (
                                <div className="flex items-center">
                                  <Phone className="w-4 h-4 mr-1 text-gray-400" />
                                  {user.phone_number}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">
                                  No phone
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">
                                {getRoleBadge(userRole)}
                              </span>
                              <select
                                value={userRole}
                                onChange={(e) =>
                                  handleRoleChange(user.id, e.target.value)
                                }
                                className={`text-xs px-2 py-1 rounded-full border-0 font-medium ${getRoleColor(
                                  userRole
                                )}`}
                                disabled={isCurrentUser}
                              >
                                <option value="owner">Owner</option>
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                                <option value="staff">Staff</option>
                                <option value="tenant">Tenant</option>
                                <option value="guest">Guest</option>
                              </select>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setActionMenuOpen(
                                    actionMenuOpen === user.id ? null : user.id
                                  )
                                }
                                className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {actionMenuOpen === user.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                                  <div className="py-1">
                                    <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit User
                                    </button>
                                    <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                                      <Settings className="w-4 h-4 mr-2" />
                                      Reset Password
                                    </button>
                                    {!isCurrentUser && (
                                      <button
                                        onClick={() => {
                                          initiateDeleteUser(user.id);
                                          setActionMenuOpen(null);
                                        }}
                                        className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete User
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No users found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm
                        ? "Try adjusting your search"
                        : "Get started by adding a new user"}
                    </p>
                    {!searchTerm && (
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add First User
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </StandardCard>

          {/* Role Information */}
          <div className="text-gray-500 dark:text-gray-400 text-sm bg-gray-50 rounded-lg p-4">
            <p className="mb-2">
              💡 <strong>User Management:</strong>
            </p>
            <ul className="space-y-1">
              <li>
                • Your role:{" "}
                <strong>{currentUser?.user_metadata?.role || "guest"}</strong>
              </li>
              <li>• You can create, edit, and delete user accounts</li>
              <li>• Role changes take effect immediately</li>
              <li>• You cannot delete your own account</li>
            </ul>
          </div>
        </div>
      </PageContainer>

      {/* Click outside to close menu */}
      {actionMenuOpen && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setActionMenuOpen(null)}
        />
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={fetchUsers}
      />

      {/* ✅ ADDED: Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete this user? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => userToDelete && handleDeleteUser(userToDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
