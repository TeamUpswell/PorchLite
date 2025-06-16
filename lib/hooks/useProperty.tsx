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

interface PropertyContextType {
  currentProperty: Property | null;
  tenant?: any; // ✅ Add tenant if you need it
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

export function PropertyProvider({ children }: { children: ReactNode }) {
  const {
    user,
    loading: authLoading,
    initialized: authInitialized,
  } = useAuth();

  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const loadingRef = useRef(false);

  const loadUserProperties = useCallback(async () => {
    if (loadingRef.current || !user?.id) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log("🏠 Property: Loading properties for user:", user.id);

      // Get user's tenant relationships
      const { data: userTenants, error: tenantError } = await supabase
        .from("tenants")
        .select("tenant_id")
        .eq("user_id", user.id);

      if (tenantError) {
        console.warn("⚠️ Tenant lookup error:", tenantError.message);
      }

      const tenantIds = userTenants?.map((t) => t.tenant_id) || [];
      console.log("🔍 Property: User tenant IDs:", tenantIds);

      // Get owned properties
      const { data: ownedProperties, error: ownedError } = await supabase
        .from("properties")
        .select("*")
        .eq("created_by", user.id)
        .eq("is_active", true);

      if (ownedError) {
        throw new Error(`Owned properties error: ${ownedError.message}`);
      }

      // Get tenant properties (only if we have tenant IDs)
      let tenantProperties: Property[] = [];
      if (tenantIds.length > 0) {
        const { data, error: tenantError2 } = await supabase
          .from("properties")
          .select("*")
          .in("tenant_id", tenantIds)
          .eq("is_active", true);

        if (tenantError2) {
          console.warn("⚠️ Tenant properties error:", tenantError2.message);
        } else {
          tenantProperties = data || [];
        }
      }

      // Combine and deduplicate
      const allProperties = [...(ownedProperties || []), ...tenantProperties];

      const uniqueProperties = allProperties.filter(
        (prop, index, self) => index === self.findIndex((p) => p.id === prop.id)
      );

      console.log("✅ Property: Found properties:", uniqueProperties.length);

      setUserProperties(uniqueProperties);

      // Set first property as current if none selected
      if (uniqueProperties.length > 0 && !currentProperty) {
        setCurrentProperty(uniqueProperties[0]);
        console.log(
          "✅ Property: Set current property:",
          uniqueProperties[0].name
        );
      } else if (uniqueProperties.length === 0) {
        setCurrentProperty(null);
      }
    } catch (err) {
      console.error("❌ Property: Error loading properties:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load properties"
      );
    } finally {
      setLoading(false);
      setHasInitialized(true);
      loadingRef.current = false;
    }
  }, [user?.id, currentProperty]);

  const refreshProperties = useCallback(async () => {
    if (user?.id) {
      loadingRef.current = false; // Reset to allow refresh
      await loadUserProperties();
    }
  }, [user?.id, loadUserProperties]);

  useEffect(() => {
    console.log("🏠 Property: Auth state check", {
      authInitialized,
      authLoading,
      hasUser: !!user,
      hasInitialized,
    });

    if (authInitialized && !authLoading && user?.id && !hasInitialized) {
      console.log("🏠 Property: Starting property load");
      loadUserProperties();
    } else if (authInitialized && !authLoading && !user) {
      console.log("🏠 Property: No user, clearing properties");
      setCurrentProperty(null);
      setUserProperties([]);
      setHasInitialized(true);
      setLoading(false);
    }
  }, [
    user?.id,
    authLoading,
    authInitialized,
    hasInitialized,
    loadUserProperties,
  ]);

  // Add 'user' to the dependency array
  useEffect(() => {
    // Your effect logic here
    if (user) {
      // Do something with user
    }
  }, [user]); // ✅ Include 'user' in dependencies

  const value = {
    currentProperty,
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
