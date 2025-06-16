"use client";

import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { usePermissions } from "@/lib/hooks/usePermissions";
import StandardCard from "@/components/ui/StandardCard";

export default function PermissionsDebug() {
  const { user } = useAuth();
  const { currentProperty } = useProperty();
  const { userRole, canManageProperty, permissions, isPropertyOwner } =
    usePermissions();

  return (
    <StandardCard title="🔍 Permissions Debug (Dev Only)">
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>User ID:</strong> {user?.id || "None"}
          </div>
          <div>
            <strong>User Role:</strong> {userRole || "None"}
          </div>
          <div>
            <strong>Property ID:</strong> {currentProperty?.id || "None"}
          </div>
          <div>
            <strong>Property Created By:</strong>{" "}
            {currentProperty?.created_by || "None"}
          </div>
          <div>
            <strong>Is Property Owner:</strong>{" "}
            {isPropertyOwner(currentProperty?.created_by).toString()}
          </div>
          <div>
            <strong>Can Manage Property:</strong>{" "}
            {canManageProperty().toString()}
          </div>
        </div>

        <div>
          <strong>All Permissions:</strong>
          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify(permissions, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Current Property Data:</strong>
          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify(currentProperty, null, 2)}
          </pre>
        </div>
      </div>
    </StandardCard>
  );
}
