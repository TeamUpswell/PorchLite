"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase";
import { debug } from "@/lib/debug"; // Add this import
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
  session: Session | null;
  isLoading: boolean;
  property: Property | null;
  tenant: Tenant | null;
  contextVersion: number;
  userRole: string | null;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ data?: any; error?: any }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ data?: any; error?: any }>;
  signOut: () => Promise<void>;
  hasPermission: (requiredRole: string) => boolean;
  canAccess: (feature: string) => boolean;
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
  // 🔧 ADD THIS LINE - Make sure loading state exists
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
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
      console.log("🔍 Checking initial auth session..."); // Use console.log instead

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.log("❌ Error getting session:", error.message);
        return;
      }

      if (session?.user) {
        console.log("✅ Found existing session for:", session.user.email);
        setSession(session);
        setUser(session.user);
        await loadUserData(session.user.id);
      } else {
        console.log("🔍 No existing session found - user needs to log in");
        // 🔥 FIX: Set loading to false and let the app redirect to login
        setIsLoading(false);
        setUser(null);
        setSession(null);
        setProperty(null);
        setTenant(null);
      }
    } catch (error) {
      console.log("❌ Auth initialization error:", error);
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
        setProperty(selectedProperty);

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

        setTenant(enhancedTenant);

        // 🔥 ADD THIS - Set the user role based on tenant role
        setUserRole(isOwner ? "manager" : "family"); // or whatever role mapping you want
      } else {
        debugLog("⚠️ No properties found for user");
        // 🔥 ADD THIS - Set a default role even when no properties
        setUserRole("guest");
      }
    } catch (error) {
      debugLog("❌ Error loading property data:", error);
      // 🔥 ADD THIS - Set fallback role on error
      setUserRole("guest");
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
      console.log("🔍 Session data:", session);
      console.log("🔍 User data:", session?.user);

      if (session?.user) {
        console.log("✅ Setting user in AuthProvider:", session.user.email);
        setSession(session);
        setUser(session.user);
        setContextVersion((prev) => prev + 1);

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          await loadUserData(session.user.id);
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

  // In components/auth/index.tsx - Add session refresh logic:
  const checkAndRefreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        return null;
      }
      
      // If session exists but is close to expiry, refresh it
      if (session && session.expires_at) {
        const expiryTime = session.expires_at * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;
        
        // Refresh if expiring in next 5 minutes
        if (timeUntilExpiry < 300000) { 
          console.log('🔄 Session close to expiry, refreshing...');
          const { data: refreshedSession } = await supabase.auth.refreshSession();
          return refreshedSession.session;
        }
      }
      
      return session;
    } catch (error) {
      console.error('Session refresh error:', error);
      return null;
    }
  }, []);

  // Call this before setting user
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔍 Checking initial auth session...');
      setLoading(true); // ✅ Ensure loading starts true
      
      try {
        const session = await checkAndRefreshSession();
        
        if (session?.user) {
          console.log('✅ Valid session found:', session.user.email);
          setUser(session.user);
        } else {
          console.log('❌ No valid session');
          setUser(null); // ✅ Explicitly set to null
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setUser(null); // ✅ Explicitly set to null on error
      } finally {
        setLoading(false);
        setHasInitialized(true); // ✅ Always set this
      }
    };

    initializeAuth();
  }, [checkAndRefreshSession]);

  // ✅ ADD these missing functions before the value object:
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        return { error };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Sign in error:", error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("Sign up error:", error);
        return { error };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Sign up error:", error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();

      // Clear all state
      setUser(null);
      setSession(null);
      setProperty(null);
      setTenant(null);
      setContextVersion((prev) => prev + 1);

      // Optional: redirect to sign in page
      // router.push('/auth/signin');
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (requiredRole: string) => {
    if (!userRole) return false;

    // Simple role hierarchy - adjust as needed
    const roleHierarchy: Record<string, number> = {
      guest: 1,
      tenant: 2,
      manager: 3,
      owner: 4,
      admin: 5,
    };

    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  };

  const canAccess = (feature: string) => {
    if (!userRole) return false;

    // Simple feature permissions - adjust as needed
    const featurePermissions: Record<string, string[]> = {
      dashboard: ["tenant", "manager", "owner", "admin"],
      inventory: ["manager", "owner", "admin"],
      reservations: ["tenant", "manager", "owner", "admin"],
      tasks: ["manager", "owner", "admin"],
      settings: ["owner", "admin"],
    };

    const allowedRoles = featurePermissions[feature] || [];
    return allowedRoles.includes(userRole);
  };

  // ✅ Now your value object will work:
  const value = {
    user,
    loading, // 🔧 Make sure to include loading in the value
    signIn,
    signUp,
    signOut,
    hasPermission,
    canAccess,
    session,
    isLoading,
    property,
    tenant,
    contextVersion,
    userRole,
    checkAndRefreshSession,
    hasInitialized,
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

  return context;
};

export default AuthProvider;
