"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
  useCallback,
} from "react";
import { useAuth } from "@/components/auth";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

// Use actual database type
type Property = Database["public"]["Tables"]["properties"]["Row"];
type Tenant = Database["public"]["Tables"]["tenants"]["Row"];

interface PropertyContextType {
  currentProperty: Property | null;
  tenant: Tenant | null;
  userProperties: Property[];
  loading: boolean;
  error: string | null;
  hasInitialized: boolean;
  setCurrentProperty: (property: Property | null) => void;
  refreshProperties: () => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(
  undefined
);

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading, status } = useAuth();
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [userProperties, setUserProperties] = useState<Property[]>([]); // Fixed: was 'properties'
  const [tenant, setTenant] = useState<Tenant | null>(null); // Added missing state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const loadingRef = useRef(false);
  const previousUserIdRef = useRef<string | null>(null);

  const loadUserProperties = useCallback(async () => {
    if (loadingRef.current || !user?.id) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log("🏠 [PROD DEBUG] Loading properties for user:", user.id);

      // Get current user from Supabase auth
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();
      console.log("🏠 [PROD DEBUG] Current Supabase user:", {
        userId: currentUser?.id,
        email: currentUser?.email,
        error: userError,
      });

      // Step 1: Get user's tenant IDs from tenant_users table
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", user.id)
        .eq("status", "active"); // Only active memberships

      console.log("🏠 [PROD DEBUG] User tenant data:", {
        tenantData,
        tenantError,
      });

      if (tenantError) {
        throw new Error(`Tenant lookup failed: ${tenantError.message}`);
      }

      if (!tenantData || tenantData.length === 0) {
        console.log("🏠 [PROD DEBUG] User has no tenant memberships");
        setUserProperties([]);
        setCurrentProperty(null);
        setTenant(null);
        return;
      }

      const tenantIds = tenantData.map((t) => t.tenant_id);
      console.log("🏠 [PROD DEBUG] User tenant IDs:", tenantIds);

      // Step 2: Get tenant info (for the first tenant for now)
      const { data: tenantInfo, error: tenantInfoError } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", tenantIds[0])
        .single();

      if (tenantInfoError) {
        console.warn(
          "🏠 [PROD DEBUG] Could not load tenant info:",
          tenantInfoError
        );
      } else {
        setTenant(tenantInfo);
        console.log("🏠 [PROD DEBUG] Loaded tenant:", tenantInfo.name);
      }

      // Step 3: Get properties for those tenants
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .in("tenant_id", tenantIds)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      console.log("🏠 [PROD DEBUG] Properties query result:", {
        count: propertiesData?.length || 0,
        error: propertiesError,
        tenantIds,
      });

      if (propertiesError) {
        throw propertiesError;
      }

      setUserProperties(propertiesData || []);

      // Set first property as current if none selected
      if (propertiesData && propertiesData.length > 0) {
        // Try to restore previously selected property
        const storedPropertyId = localStorage.getItem("currentPropertyId");
        const storedProperty = storedPropertyId
          ? propertiesData.find((p) => p.id === storedPropertyId)
          : null;

        const propertyToSet = storedProperty || propertiesData[0];
        setCurrentProperty(propertyToSet);

        console.log("✅ Property: Set current property:", propertyToSet.name);
      } else {
        setCurrentProperty(null);
        console.log("🏠 Property: No properties found for user's tenants");
      }
    } catch (err) {
      console.error("❌ [PROD DEBUG] Property loading error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load properties"
      );
    } finally {
      setLoading(false);
      setHasInitialized(true);
      loadingRef.current = false;
    }
  }, [user?.id]);

  const refreshProperties = useCallback(async () => {
    if (user?.id) {
      loadingRef.current = false; // Reset to allow refresh
      await loadUserProperties();
    }
  }, [user?.id, loadUserProperties]);

  // Save current property to localStorage when it changes
  useEffect(() => {
    if (currentProperty?.id) {
      localStorage.setItem("currentPropertyId", currentProperty.id);
    }
  }, [currentProperty]);

  // 🔧 CRITICAL FIX: Reset hasInitialized when user changes
  useEffect(() => {
    const currentUserId = user?.id || null;
    const previousUserId = previousUserIdRef.current;

    console.log("🏠 Property: User change detected", {
      previousUserId,
      currentUserId,
      hasInitialized,
    });

    // If user ID changed, reset initialization state
    if (previousUserId !== currentUserId) {
      console.log("🏠 Property: User changed, resetting initialization");
      setHasInitialized(false);
      setCurrentProperty(null);
      setUserProperties([]);
      setTenant(null);
      loadingRef.current = false;
      previousUserIdRef.current = currentUserId;
    }
  }, [user?.id, hasInitialized]);

  // Fixed: Use hasInitialized instead of isInitialized
  useEffect(() => {
    console.log("🏠 Property: Auth state check", {
      hasUser: !!user,
      hasInitialized,
      isLoading,
      authStatus: status,
    });

    // Don't do anything if we're in a loading/transitional state
    if (isLoading || status === "INITIAL_SESSION") {
      return;
    }

    if (!user) {
      console.log("🏠 Property: No user, clearing properties");
      setCurrentProperty(null);
      setUserProperties([]);
      setTenant(null);
      setHasInitialized(true);
      return;
    }

    if (!hasInitialized) {
      console.log("🏠 Property: Starting property load for user:", user.id);
      loadUserProperties();
    }
  }, [user, hasInitialized, isLoading, status, loadUserProperties]);

  const value = {
    currentProperty,
    tenant,
    userProperties,
    loading,
    error,
    hasInitialized,
    setCurrentProperty,
    refreshProperties,
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
}

// Single useProperty hook that uses the context
export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error("useProperty must be used within a PropertyProvider");
  }
  return context;
};
