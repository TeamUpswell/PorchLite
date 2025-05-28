import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { roleHierarchy, UserRole } from "../types";

export const useUserRoles = () => {
  const { user, fetchUserRoles } = useAuth();
  const [userRoles, setUserRoles] = useState<string[]>([]);

  const getUserRoles = async () => {
    if (!user?.id) {
      console.log("🔍 No user ID available");
      return [];
    }

    try {
      const roles = await fetchUserRoles(user.id);
      console.log("🔍 Fetched roles from database:", roles);
      setUserRoles(roles);
      return roles;
    } catch (error) {
      console.error("🔍 Error fetching user roles:", error);
      return [];
    }
  };

  const hasPermission = (requiredRole: UserRole) => {
    if (!user || !userRoles || userRoles.length === 0) {
      return false;
    }

    const userHighestLevel = Math.min(
      ...userRoles
        .filter((role) => role in roleHierarchy)
        .map((role) => roleHierarchy[role as UserRole])
    );

    const requiredLevel = roleHierarchy[requiredRole];
    return userHighestLevel <= requiredLevel;
  };

  const canAutoApprove = () => {
    if (!userRoles || userRoles.length === 0) return false;
    
    const autoApprovalRoles = ["owner", "property_manager", "family", "friends"];
    return userRoles.some((role) => autoApprovalRoles.includes(role));
  };

  const canApproveOthers = () => {
    if (!userRoles || userRoles.length === 0) return false;
    const approverRoles = ["owner", "property_manager"];
    return userRoles.some((role) => approverRoles.includes(role));
  };

  const determineReservationStatus = (isEditingExisting: boolean = false) => {
    if (!userRoles || userRoles.length === 0) return "pending approval";

    if (isEditingExisting && !canApproveOthers()) {
      return null;
    }

    if (userRoles.includes("owner")) return "confirmed";
    if (userRoles.includes("property_manager")) return "confirmed";
    if (userRoles.includes("family")) return "confirmed";
    if (userRoles.includes("friends")) return "confirmed";

    return "pending approval";
  };

  const debugUserRoles = () => {
    console.log("🔍 User Role Debug:");
    console.log("- User object:", user);
    console.log("- User ID:", user?.id);
    console.log("- UserRoles state:", userRoles);
    console.log("- Can auto approve:", canAutoApprove());
    console.log("- Can approve others:", canApproveOthers());
  };

  useEffect(() => {
    if (user?.id) {
      getUserRoles();
    } else {
      setUserRoles([]);
    }
  }, [user?.id]);

  return {
    userRoles,
    hasPermission,
    canAutoApprove,
    canApproveOthers,
    determineReservationStatus,
    debugUserRoles,
  };
};