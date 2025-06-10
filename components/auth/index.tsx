"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
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
  // ✅ CRITICAL FIX: ALL HOOKS FIRST
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  // Add this to force re-renders when context changes
  const [contextVersion, setContextVersion] = useState(0);

  const router = useRouter();

  // ✅ FIXED: Initialize auth without early errors
  const initializeAuth = async () => {
    try {
      console.log("🔍 Checking initial auth session...");
      const {
        data: { session: initialSession },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("❌ Auth session error:", error);
        // Don't throw error immediately - set fallback state
        setIsLoading(false);
        return;
      }

      if (initialSession?.user) {
        console.log("✅ Found existing session for:", initialSession.user.email);
        setSession(initialSession);
        setUser(initialSession.user);

        // Load user data without blocking
        loadUserData(initialSession.user.id);
      } else {
        console.log("🔍 No existing session found");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("❌ Auth initialization error:", error);
      // Don't show toast error during initialization
      setIsLoading(false);
    }
  };

  const loadUserData = async (userId: string) => {
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
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FIXED: Effect with proper error handling
  useEffect(() => {
    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state changed:", event);

      if (session?.user) {
        setSession(session);
        setUser(session.user);
        setContextVersion((prev) => prev + 1);

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          loadUserData(session.user.id);
        }
      } else {
        console.log("🔍 No user - clearing all data");
        setSession(null);
        setUser(null);
        setProperty(null);
        setTenant(null);
        setIsLoading(false);
        setContextVersion((prev) => prev + 1);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ✅ NO EARLY RETURNS - Render with loading state instead
  const value = {
    user,
    session,
    isLoading,
    property,
    tenant,
    contextVersion,
    // ... your methods
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
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
