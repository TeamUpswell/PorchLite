"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { useAuth } from "@/components/auth";
import { supabase } from "@/lib/supabase";

interface Property {
  id: string;
  name: string;
  address?: string;
  created_by: string;
  created_at: string;
  [key: string]: any;
}

interface PropertyContextType {
  currentProperty: Property | null;
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
  const { user, loading: authLoading } = useAuth();
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const loadingRef = useRef(false);

  const loadUserProperties = async (userId: string) => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log("🏠 Property: Loading properties for user:", userId);

      // Get user's tenant relationships
      const { data: userTenants, error: tenantError } = await supabase
        .from("tenants")
        .select("tenant_id")
        .eq("user_id", userId);

      const tenantIds = userTenants?.map((t) => t.tenant_id) || [];
      console.log("🔍 Property: User tenant IDs:", tenantIds);

      // Get owned properties
      const { data: ownedProperties, error: ownedError } = await supabase
        .from("properties")
        .select("*")
        .eq("created_by", userId);

      // Get tenant properties
      const { data: tenantProperties, error: tenantError2 } = await supabase
        .from("properties")
        .select("*")
        .in("id", tenantIds);

      if (ownedError) {
        throw new Error(`Owned properties error: ${ownedError.message}`);
      }

      // Combine and deduplicate
      const allProperties = [
        ...(ownedProperties || []),
        ...(tenantProperties || []),
      ];

      const uniqueProperties = allProperties.filter(
        (prop, index, self) => index === self.findIndex((p) => p.id === prop.id)
      );

      console.log("✅ Property: Found properties:", uniqueProperties.length);

      setUserProperties(uniqueProperties);

      if (uniqueProperties.length > 0 && !currentProperty) {
        setCurrentProperty(uniqueProperties[0]);
        console.log(
          "✅ Property: Set current property:",
          uniqueProperties[0].name
        );
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
  };

  const refreshProperties = async () => {
    if (user?.id) {
      loadingRef.current = false; // Reset to allow refresh
      await loadUserProperties(user.id);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.id && !hasInitialized) {
      loadUserProperties(user.id);
    } else if (!user && !authLoading) {
      // User logged out
      setCurrentProperty(null);
      setUserProperties([]);
      setHasInitialized(true);
      setLoading(false);
    }
  }, [user, authLoading, hasInitialized]);

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

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error("useProperty must be used within a PropertyProvider");
  }
  return context;
};
