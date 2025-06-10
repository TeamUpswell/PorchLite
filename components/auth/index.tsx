"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { debugLog, debugError } from "@/lib/utils/debug";

// Add role and permission types at the top:
type UserRole = "manager" | "family" | "guest";

interface Property {
  id: string;
  name: string;
  address?: string;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
}

interface Tenant {
  id: string;
  user_id: string;
  property_id: string;
  role: "owner" | "tenant" | "manager" | "family" | "guest";
  tenant_id: string;
}

interface AuthContextType {
  user: User | null;
  property: Property | null;
  tenant: Tenant | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  userRole: UserRole | null;
  hasPermission: (requiredRole: UserRole) => boolean;
  canAccess: (feature: string) => boolean;
  contextVersion: number;
}

// ✅ Add permission hierarchy
const ROLE_HIERARCHY: Record<UserRole, number> = {
  manager: 3,
  family: 2,
  guest: 1,
};

// ✅ Add feature permissions
const FEATURE_PERMISSIONS: Record<string, UserRole[]> = {
  // Manager only
  "property-management": ["manager"],
  "user-management": ["manager"],
  "financial-reports": ["manager"],
  "system-settings": ["manager"],

  // Manager + Family
  "inventory-management": ["manager", "family"],
  "maintenance-tasks": ["manager", "family"],
  "calendar-management": ["manager", "family"],
  "document-upload": ["manager", "family"],

  // All roles
  "view-inventory": ["manager", "family", "guest"],
  "view-calendar": ["manager", "family", "guest"],
  "basic-messaging": ["manager", "family", "guest"],
  "view-documents": ["manager", "family", "guest"],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  // Add this to force re-renders when context changes
  const [contextVersion, setContextVersion] = useState(0);

  const router = useRouter();

  // ✅ CONSOLIDATED AUTH EFFECT
  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        debugLog("🔍 Checking initial auth session...");
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted) {
          if (session?.user) {
            // Fetch profile data
            const { data: profile } = await supabase
              .from("profiles")
              .select("*, role")
              .eq("id", session.user.id)
              .single();

            session.user.profile = profile;
            setUser(session.user);
            setUserRole(profile?.role || "guest");

            // 🔥 ADD THIS - Load property data on initial session:
            debugLog("🔍 Loading data for user:", session.user.id);
            await loadPropertyData(session.user.id);
          } else {
            setUser(null);
            setUserRole(null);
            // Clear property data when no user
            setProperty(null);
            setTenant(null);
          }

          debugLog(
            "✅ Initial session check complete:",
            session?.user?.email || "No user"
          );
          setIsLoading(false);
        }
      } catch (error) {
        console.error("❌ Error getting initial session:", error);
        if (mounted) {
          setUser(null);
          setUserRole(null);
          setProperty(null);
          setTenant(null);
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      debugLog("🔄 Auth state changed:", event, session?.user?.email);

      if (event === "SIGNED_IN" && session?.user) {
        // Fetch profile data
        const { data: profile } = await supabase
          .from("profiles")
          .select("*, role")
          .eq("id", session.user.id)
          .single();

        session.user.profile = profile;
        setUser(session.user);
        setUserRole(profile?.role || "guest");

        // 🔥 ADD THIS - Actually load property data for the user:
        debugLog("🔍 Loading data for user:", session.user.id);
        await loadPropertyData(session.user.id);

        // Auto-redirect after sign in
        if (window.location.pathname === "/auth") {
          const urlParams = new URLSearchParams(window.location.search);
          const redirectTo = urlParams.get("redirectedFrom") || "/";

          debugLog("🔄 Auto-redirecting after sign in to:", redirectTo);
          router.replace(redirectTo);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setUserRole(null);
        // Clear property data on sign out
        setProperty(null);
        setTenant(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return { error };
      } else {
        setError(null);
        return { error: null };
      }
    } catch (error: any) {
      setError(error.message);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      window.location.href = "/auth"; // ✅ This is correct
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // ✅ Simplified permission checking without property dependency
  const hasPermission = useCallback(
    (requiredRole: string) => {
      if (!user) return false;

      debugLog("🔑 Permission check:", {
        requiredRole,
        userEmail: user.email,
        userRole,
      });

      // For now, be permissive for owners/managers
      if (user.email?.includes("pdxbernards.com")) {
        debugLog("✅ User is from owner domain - granting access");
        return true;
      }

      // Check role hierarchy
      if (userRole === "manager" || userRole === "family") {
        debugLog("✅ User has sufficient role");
        return true;
      }

      debugLog("❌ Permission denied for role:", requiredRole);
      return false;
    },
    [user, userRole]
  );

  const canAccess = (feature: string): boolean => {
    if (!userRole) return false;
    const allowedRoles = FEATURE_PERMISSIONS[feature];
    return allowedRoles ? allowedRoles.includes(userRole) : false;
  };

  // Update context version whenever key data changes
  useEffect(() => {
    setContextVersion((prev) => prev + 1);
    debugLog("🔄 Auth context updated:", {
      hasUser: !!user,
      hasProperty: !!property,
      hasTenant: !!tenant,
      version: contextVersion + 1,
    });
  }, [user, property, tenant]);

  // Replace your incomplete loadPropertyData function:
  const loadPropertyData = async (userId: string) => {
    try {
      debugLog("🔍 Starting property lookup for user:", userId);

      // Get current session first
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        debugLog("❌ No session available");
        return;
      }

      debugLog("🔍 Current session:", session.user?.id);

      // Get user's tenant IDs
      const { data: userTenants, error: tenantError } = await supabase
        .from("tenants")
        .select("tenant_id")
        .eq("user_id", userId);

      if (tenantError) {
        debugLog("❌ Error fetching tenants:", tenantError);
        return;
      }

      const tenantIds = userTenants?.map((t) => t.tenant_id) || [];
      debugLog("🔍 User tenant IDs:", tenantIds);

      // Get owned properties
      const { data: ownedProperties, error: ownedError } = await supabase
        .from("properties")
        .select("*")
        .eq("created_by", userId);

      debugLog("🔍 Owned properties query result:", {
        ownedProperties,
        ownedError,
      });

      // Get tenant properties
      const { data: tenantProperties, error: tenantPropsError } = await supabase
        .from("properties")
        .select("*")
        .in("id", tenantIds);

      debugLog("🔍 Tenant properties query result:", {
        props: tenantProperties,
        tenantError: tenantPropsError,
      });

      // Combine and deduplicate properties
      const allProperties = [
        ...(ownedProperties || []),
        ...(tenantProperties || []),
      ];
      const uniqueProperties = allProperties.filter(
        (prop, index, self) => index === self.findIndex((p) => p.id === prop.id)
      );

      debugLog("🔍 All properties before deduplication:", allProperties);
      debugLog("✅ Final properties after processing:", uniqueProperties);

      if (uniqueProperties.length > 0) {
        const selectedProperty = uniqueProperties[0];

        debugLog("🏠 Setting property in AuthProvider:", selectedProperty);
        setProperty(selectedProperty);

        // Determine tenant role
        const isOwner = ownedProperties?.some(
          (p) => p.id === selectedProperty.id
        );
        const tenantId = tenantIds[0] || `owner-${userId}`;

        const enhancedTenant = {
          id: isOwner ? `owner-${userId}` : tenantId,
          user_id: userId,
          property_id: selectedProperty.id,
          role: isOwner ? ("owner" as const) : ("tenant" as const),
          tenant_id: tenantId,
        };

        debugLog("✅ Set up as property owner:", {
          tenant: enhancedTenant,
          property: selectedProperty,
        });
        debugLog("👤 Setting tenant in AuthProvider:", enhancedTenant);
        setTenant(enhancedTenant);
      } else {
        debugLog("⚠️ No properties found for user");
      }
    } catch (error) {
      debugLog("❌ Error loading property data:", error);
    }
  };

  const value = {
    user,
    property,
    tenant,
    isLoading,
    signIn,
    signUp,
    signOut,
    userRole,
    hasPermission,
    canAccess,
    contextVersion, // ← Add this to the context
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  // Log whenever context is accessed
  useEffect(() => {
    debugLog("🔍 useAuth called:", {
      hasUser: !!context.user,
      hasProperty: !!context.property,
      hasTenant: !!context.tenant,
      version: context.contextVersion,
      timestamp: new Date().toISOString(),
    });
  }, [context.contextVersion]);

  return context;
};

export default AuthProvider;
