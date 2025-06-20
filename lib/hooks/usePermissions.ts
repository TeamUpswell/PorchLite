import { useAuth } from "@/components/auth/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Permission {
  role: string;
  feature: string;
  allowed: boolean;
}

export function usePermissions() {
  const { user } = useAuth();
  const { currentProperty } = useProperty();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Get user's role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role) {
          setUserRole(profile.role);

          // Get permissions for this role
          const { data: rolePermissions } = await supabase
            .from("role_permissions")
            .select("*")
            .eq("role", profile.role);

          if (rolePermissions) {
            setPermissions(rolePermissions);
          }
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  const hasPermission = (feature: string): boolean => {
    return permissions.some((p) => p.feature === feature && p.allowed);
  };

  const isPropertyOwner = (propertyCreatedBy: string): boolean => {
    return user?.id === propertyCreatedBy;
  };

  const canManageProperty = (): boolean => {
    // First check if user is the property owner
    if (currentProperty?.created_by === user?.id) {
      return true;
    }

    // Then check role-based permissions
    return (
      hasPermission("property_management") ||
      hasPermission("admin") ||
      userRole === "admin" ||
      userRole === "super_admin" ||
      userRole === "property_manager" ||
      userRole === "owner"
    );
  };

  const canCreateWalkthrough = (): boolean => {
    return canManageProperty() || hasPermission("walkthrough_management");
  };

  const canEditContent = (): boolean => {
    return canManageProperty() || hasPermission("content_management");
  };

  return {
    permissions,
    userRole,
    loading,
    hasPermission,
    canManageProperty,
    isPropertyOwner,
    canCreateWalkthrough,
    canEditContent,
  };
}
