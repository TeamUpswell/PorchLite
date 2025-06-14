import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getUserRole, VALID_ROLES } from "@/lib/utils/roles";

interface User {
  id: string;
  email: string;
  user_metadata?: {
    role?: string;
  };
}

interface UserRoleDialogProps {
  user: User | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function UserRoleDialog({
  user: selectedUser,
  onClose,
  onUpdate,
}: UserRoleDialogProps) {
  if (!selectedUser) return null;

  const handleToggleRole = async (userId: string, newRole: string) => {
    try {
      // ✅ Update user_metadata.role instead of separate roles table
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...selectedUser.user_metadata,
          role: newRole,
        },
      });

      if (error) throw error;

      // Call the update callback
      onUpdate();
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role");
    }
  };

  const currentRole = getUserRole(selectedUser);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          Manage Role for {selectedUser.email}
        </h3>

        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-3">
            Current role: <span className="font-medium">{currentRole}</span>
          </p>

          <div className="space-y-2">
            {VALID_ROLES.map((role) => (
              <label key={role} className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={currentRole === role}
                  onChange={() => handleToggleRole(selectedUser.id, role)}
                  className="mr-2"
                />
                <span className="capitalize">{role}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
