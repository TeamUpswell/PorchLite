"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { supabase } from "@/lib/supabase";
import { debug } from "@/lib/debug";
import type { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { debugLog, debugError } from "@/lib/utils/debug";

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

interface Profile {
  id: string;
  full_name?: string;
  phone_number?: string;
  email?: string;
  avatar_url?: string;
  address?: string;
  show_in_contacts?: boolean;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  property: Property | null;
  tenant: Tenant | null;
  contextVersion: number;
  userRole: string | null;
  loading: boolean;
  hasInitialized: boolean;
  profileData: Profile | null;
  profileLoading: boolean;
  checkAndRefreshSession: () => Promise<Session | null>;
  signIn: (email: string, password: string) => Promise<{ data?: any; error?: any }>;
  signUp: (email: string, password: string) => Promise<{ data?: any; error?: any }>;
  signOut: () => Promise<void>;
  hasPermission: (requiredRole: string) => boolean;
  canAccess: (feature: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ✅ SINGLE SOURCE OF TRUTH for loading states
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [contextVersion, setContextVersion] = useState(0);

  // ✅ PREVENT infinite loops
  const initializationRef = useRef(false);
  
  const router = useRouter();

  const fetchUserProfile = useCallback(async (userId: string) => {
    if (profileLoading || (profileData?.id === userId)) {
      return;
    }

    setProfileLoading(true);
    try {
      console.log("🔍 Fetching user profile for:", userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.log("⚠️ No profile found or error:", error.message);
        setProfileData({
          id: userId,
          email: user?.email || '',
        });
      } else {
        console.log("✅ Profile cached:", data);
        setProfileData(data);
      }
    } catch (error) {
      console.error("❌ Error fetching profile:", error);
      setProfileData({
        id: userId,
        email: user?.email || '',
      });
    } finally {
      setProfileLoading(false);
    }
  }, [profileLoading, profileData?.id, user?.email]);

  const loadUserData = async (userId: string) => {
    try {
      debugLog("🔍 Starting property lookup for user:", userId);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        debugLog("❌ No session available");
        return;
      }

      debugLog("🔍 Current session:", session.user?.id);

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

      const { data: ownedProperties, error: ownedError } = await supabase
        .from("properties")
        .select("*")
        .eq("created_by", userId);

      debugLog("🔍 Owned properties query result:", {
        ownedProperties,
        ownedError,
      });

      const { data: tenantProperties, error: tenantPropsError } = await supabase
        .from("properties")
        .select("*")
        .in("id", tenantIds);

      debugLog("🔍 Tenant properties query result:", {
        props: tenantProperties,
        tenantError: tenantPropsError,
      });

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
        setUserRole(isOwner ? "manager" : "family");
      } else {
        debugLog("⚠️ No properties found for user");
        setUserRole("guest");
      }
    } catch (error) {
      debugLog("❌ Error loading property data:", error);
      setUserRole("guest");
    }
  };

  const checkAndRefreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Session check error:", error);
        return null;
      }

      if (session && session.expires_at) {
        const expiryTime = session.expires_at * 1000;
        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;

        if (timeUntilExpiry < 300000) {
          console.log("🔄 Session close to expiry, refreshing...");
          const { data: refreshedSession } = await supabase.auth.refreshSession();
          return refreshedSession.session;
        }
      }

      return session;
    } catch (error) {
      console.error("Session refresh error:", error);
      return null;
    }
  }, []);

  // ✅ SINGLE useEffect for initialization
  useEffect(() => {
    if (initializationRef.current) {
      console.log("🛑 Auth already initialized, skipping");
      return;
    }

    initializationRef.current = true;
    console.log("🔍 Initializing auth...");

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.log("❌ Error getting session:", error.message);
          setUser(null);
        } else if (session?.user) {
          console.log("✅ Found existing session for:", session.user.email);
          setSession(session);
          setUser(session.user);
          await fetchUserProfile(session.user.id);
          await loadUserData(session.user.id);
        } else {
          console.log("🔍 No existing session found - user needs to log in");
          setUser(null);
          setSession(null);
          setProperty(null);
          setTenant(null);
          setProfileData(null);
        }
      } catch (error) {
        console.error("❌ Auth initialization error:", error);
        setUser(null);
      } finally {
        // ✅ CRITICAL: Always mark as complete
        setLoading(false);
        setHasInitialized(true);
        console.log("✅ Auth initialization complete");
      }
    };

    // ✅ Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔄 Auth state changed:", event);
        console.log("🔍 Session data:", session);
        console.log("🔍 User data:", session?.user);

        if (session?.user) {
          console.log("✅ Setting user in AuthProvider:", session.user.email);
          setSession(session);
          setUser(session.user);
          setContextVersion((prev) => prev + 1);

          await fetchUserProfile(session.user.id);

          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            await loadUserData(session.user.id);
          }
        } else {
          console.log("🔍 No user - clearing all data");
          setSession(null);
          setUser(null);
          setProperty(null);
          setTenant(null);
          setProfileData(null);
          setContextVersion((prev) => prev + 1);
        }
      }
    );

    // Initialize
    initializeAuth();

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []); // ✅ Empty dependencies - run ONLY once

  const signIn = async (email: string, password: string) => {
    try {
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
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
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
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();

      setUser(null);
      setSession(null);
      setProperty(null);
      setTenant(null);
      setProfileData(null);
      setContextVersion((prev) => prev + 1);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const hasPermission = (requiredRole: string) => {
    if (!userRole) return false;

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

  const value = {
    user,
    session,
    isLoading: loading, // ✅ Use single loading state
    property,
    tenant,
    contextVersion,
    userRole,
    loading,
    hasInitialized,
    profileData,
    profileLoading,
    checkAndRefreshSession,
    signIn,
    signUp,
    signOut,
    hasPermission,
    canAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export default AuthProvider;
