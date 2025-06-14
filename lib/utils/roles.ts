import type { User } from "@supabase/supabase-js";

export const getUserRole = (user: User | null): string => {
  if (!user) return "guest";
  return user.user_metadata?.role?.toLowerCase() || "guest";
};

export const hasRole = (user: User | null, requiredRole: string): boolean => {
  const userRole = getUserRole(user);
  const roleHierarchy: Record<string, number> = {
    guest: 1,
    tenant: 2,
    staff: 3,
    manager: 4,
    admin: 5,
    owner: 6,
  };

  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole.toLowerCase()] || 0;

  return userLevel >= requiredLevel;
};

export const canManageUsers = (user: User | null): boolean => {
  return hasRole(user, "admin");
};

export const canManageProperties = (user: User | null): boolean => {
  return hasRole(user, "manager");
};

export const canManageProperty = (user: User | null): boolean => {
  return hasRole(user, "manager");
};

export const canAccessCleaning = (user: User | null): boolean => {
  return hasRole(user, "staff");
};

export const canManageCleaning = (user: User | null): boolean => {
  return hasRole(user, "manager");
};

// Additional role checks
export const isAdmin = (user: User | null): boolean => {
  return getUserRole(user) === "admin";
};

export const isOwner = (user: User | null): boolean => {
  return getUserRole(user) === "owner";
};

export const isManager = (user: User | null): boolean => {
  return getUserRole(user) === "manager";
};

export const isStaff = (user: User | null): boolean => {
  return getUserRole(user) === "staff";
};

export const isTenant = (user: User | null): boolean => {
  return getUserRole(user) === "tenant";
};

export const isGuest = (user: User | null): boolean => {
  return getUserRole(user) === "guest";
};
