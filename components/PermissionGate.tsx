"use client";

import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Shield } from "lucide-react";

interface PermissionGateProps {
  requiredRole: string | string[];
  fallback: React.ReactNode;
  children: React.ReactNode;
}

export default function PermissionGate({
  requiredRole,
  fallback,
  children,
}: PermissionGateProps) {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Add debug logging
  useEffect(() => {
    console.log("🔒 PermissionGate: user:", user?.id, "requiredRole:", requiredRole);
  }, [user, requiredRole]);

  useEffect(() => {
    async function checkUserRole() {
      if (!user) {
        console.log("🔒 PermissionGate: No user found");
        setLoading(false);
        return;
      }

      try {
        console.log("🔒 PermissionGate: Checking role for user:", user.id);
        
        const { data: roleData, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        console.log("🔒 PermissionGate: Role query result:", roleData, error);

        if (error) {
          console.error("🔒 PermissionGate: Error checking user role:", error);
          setUserRole(null);
        } else {
          setUserRole(roleData?.role || null);
          console.log("🔒 PermissionGate: User role set to:", roleData?.role || null);
        }
      } catch (error) {
        console.error("🔒 PermissionGate: Error in role check:", error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    }

    checkUserRole();
  }, [user]);

  // ✅ Check if user has any of the required roles
  const hasPermission = () => {
    if (!userRole) {
      console.log("🔒 PermissionGate: No user role found, denying access");
      return false;
    }

    let hasAccess = false;
    if (Array.isArray(requiredRole)) {
      hasAccess = requiredRole.includes(userRole);
    } else {
      hasAccess = userRole === requiredRole;
    }

    console.log("🔒 PermissionGate: Permission check - userRole:", userRole, "requiredRole:", requiredRole, "hasAccess:", hasAccess);
    return hasAccess;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Checking permissions...</p>
      </div>
    );
  }

  if (!user || !hasPermission()) {
    console.log("🔒 PermissionGate: Access denied");
    
    // ✅ Enhanced fallback with debug info
    return (
      <div className="p-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-600 mb-4">
          Property settings are restricted to property owners and managers only.
        </p>
        
        {/* ✅ Debug info */}
        <div className="mt-4 p-3 bg-gray-100 rounded text-left text-xs max-w-md mx-auto">
          <p><strong>Debug Info:</strong></p>
          <p>User ID: {user?.id || 'No user'}</p>
          <p>User Role: {userRole || 'No role found'}</p>
          <p>Required Role: {Array.isArray(requiredRole) ? requiredRole.join(', ') : requiredRole}</p>
          <p>Has Permission: {hasPermission().toString()}</p>
        </div>
        
        <p className="text-sm text-gray-500 mt-4">
          Contact the property owner if you need to make changes.
        </p>
      </div>
    );
  }

  console.log("🔒 PermissionGate: Access granted");
  return <>{children}</>;
}
