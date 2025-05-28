"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import PermissionGate from "@/components/PermissionGate";
import { supabase } from "@/lib/supabase";

// Add this type definition
type PermissionsMap = Record<string, Record<string, boolean>>;

// Add type for permission feature
interface Feature {
  id: string;
  name: string;
}

// Add this interface near your other type definitions
interface RolePermission {
  role: string;
  feature: string;
  allowed: boolean;
}

// Define permission types
const FEATURES: Feature[] = [
  { id: "calendar_view", name: "View Calendar" },
  { id: "calendar_edit", name: "Edit Calendar Events" },
  { id: "tasks_view", name: "View Tasks" },
  { id: "tasks_edit", name: "Create/Edit Tasks" },
  { id: "manual_view", name: "View Manual" },
  { id: "manual_edit", name: "Edit Manual" },
  { id: "inventory_view", name: "View Inventory" },
  { id: "inventory_edit", name: "Edit Inventory" },
  { id: "contacts_view", name: "View Contacts" },
  { id: "contacts_edit", name: "Edit Contacts" },
  { id: "users_manage", name: "Manage Users" },
];

const USER_ROLES = ["friend", "family", "manager", "owner"];

export default function PermissionManagementPage() {
  const { user } = useAuth();
  // Update the state initialization with the type
  const [permissions, setPermissions] = useState<PermissionsMap>({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("");

  // Fetch current permissions
  useEffect(() => {
    async function fetchPermissions() {
      setLoading(true);
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*");

      if (error) {
        console.error("Error fetching permissions:", error);
      } else {
        // Convert to easier format to work with
        const permMap: PermissionsMap = {};
        data?.forEach((item) => {
          if (!permMap[item.role]) permMap[item.role] = {};
          permMap[item.role][item.feature] = item.allowed;
        });
        setPermissions(permMap);
      }
      setLoading(false);
    }

    fetchPermissions();
  }, []);

  // Handle permission toggle
  const togglePermission = (role: string, feature: string) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...(prev[role] || {}),
        [feature]: !(prev[role] || {})[feature],
      },
    }));
  };

  // Save permissions to database
  const savePermissions = async () => {
    setSaveStatus("Saving...");

    try {
      // First delete existing permissions
      await supabase.from("role_permissions").delete().neq("id", 0);

      // Then insert new permissions with explicit type
      const permissionsToInsert: RolePermission[] = [];

      Object.entries(permissions).forEach(([role, features]) => {
        Object.entries(features).forEach(([feature, allowed]) => {
          permissionsToInsert.push({
            role,
            feature,
            allowed,
          });
        });
      });

      const { error } = await supabase
        .from("role_permissions")
        .insert(permissionsToInsert);

      if (error) {
        setSaveStatus(`Error: ${error.message}`);
      } else {
        setSaveStatus("Saved successfully!");
        setTimeout(() => setSaveStatus(""), 3000);
      }
    } catch (err: unknown) {
      // Type check the error before accessing properties
      if (err instanceof Error) {
        setSaveStatus(`Error: ${err.message}`);
      } else {
        setSaveStatus(`An unexpected error occurred`);
      }
    }
  };

  return (
    <ProtectedPageWrapper>
      <PermissionGate
        requiredRole="owner"
        fallback={<p>Only owners can manage permissions.</p>}
      >
        <div className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Permission Management</h1>

              <button
                onClick={savePermissions}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>

            {saveStatus && (
              <div
                className={`p-3 rounded mb-4 ${
                  saveStatus.includes("Error")
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {saveStatus}
              </div>
            )}

            {loading ? (
              <div className="text-center py-10">Loading permissions...</div>
            ) : (
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Feature
                      </th>
                      {USER_ROLES.map((role) => (
                        <th
                          key={role}
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {role}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {FEATURES.map((feature) => (
                      <tr key={feature.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {feature.name}
                        </td>
                        {USER_ROLES.map((role) => (
                          <td
                            key={`${role}-${feature.id}`}
                            className="px-6 py-4 whitespace-nowrap text-center"
                          >
                            <input
                              type="checkbox"
                              checked={permissions[role]?.[feature.id] || false}
                              onChange={() =>
                                togglePermission(role, feature.id)
                              }
                              disabled={
                                role === "owner" &&
                                ["users_manage"].includes(feature.id)
                              }
                              className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              aria-label={`${feature.name} permission for ${role} role`}
                              title={`${feature.name} permission for ${role} role`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </PermissionGate>
    </ProtectedPageWrapper>
  );
}
