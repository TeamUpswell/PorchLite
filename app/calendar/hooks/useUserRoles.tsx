import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getUserRole,
  canManageProperties,
  canManageUsers,
} from "@/lib/utils/roles";

export const useUserRoles = () => {
  const { user } = useAuth();

  // ✅ Use centralized role checking instead of fetching separate roles
  const getUserRoles = () => {
    if (!user) return [];

    const role = getUserRole(user);
    // Return as array for backward compatibility
    return [role];
  };

  const hasPermission = (requiredRole: string) => {
    if (!user) return false;

    const userRole = getUserRole(user);

    // Define role hierarchy levels (lower number = higher privilege)
    const roleHierarchy: Record<string, number> = {
      owner: 6,
      admin: 5,
      manager: 4,
      staff: 3,
      family: 2,
      friend: 1,
      guest: 0,
    };

    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  };

  const canAutoApprove = () => {
    if (!user) return false;

    const userRole = getUserRole(user);
    const autoApprovalRoles = ["owner", "admin", "manager", "family", "friend"];

    return autoApprovalRoles.includes(userRole);
  };

  const canApproveOthers = () => {
    if (!user) return false;

    // ✅ Use our centralized permission checking
    return canManageProperties(user) || canManageUsers(user);
  };

  const determineReservationStatus = (isEditingExisting: boolean = false) => {
    if (!user) return "pending approval";

    if (isEditingExisting && !canApproveOthers()) {
      return null;
    }

    const userRole = getUserRole(user);

    // Owner, admin, manager, family, and friends get auto-confirmation
    const autoConfirmRoles = ["owner", "admin", "manager", "family", "friend"];

    if (autoConfirmRoles.includes(userRole)) {
      return "confirmed";
    }

    return "pending approval";
  };

  const debugUserRoles = () => {
    const userRole = getUserRole(user);
    const userRoles = getUserRoles();

    console.log("🔍 User Role Debug:");
    console.log("- User object:", user);
    console.log("- User ID:", user?.id);
    console.log("- User role:", userRole);
    console.log("- UserRoles (array):", userRoles);
    console.log("- Can auto approve:", canAutoApprove());
    console.log("- Can approve others:", canApproveOthers());
    console.log("- Can manage properties:", canManageProperties(user));
    console.log("- Can manage users:", canManageUsers(user));
  };

  // ✅ Get current user roles for backward compatibility
  const userRoles = getUserRoles();

  return {
    userRoles, // Array format for backward compatibility
    userRole: getUserRole(user), // Single role format
    hasPermission,
    canAutoApprove,
    canApproveOthers,
    determineReservationStatus,
    debugUserRoles,
  };
};
