"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "@/components/auth";
import { supabase, debugSupabaseConfig } from "@/lib/supabase";
import { debugLog, debugError } from "@/lib/utils/debug";

const isDev = process.env.NODE_ENV === "development";

interface PropertyContextType {
  currentProperty: any;
  currentTenant: any;
  userProperties: any[];
  userTenants: any[];
  loading: boolean;
  error: string | null;
  hasInitialized: boolean;
  setCurrentProperty: (property: any) => void;
  setCurrentTenant: (tenant: any) => void;
  switchProperty: (propertyId: string) => Promise<void>;
  updateProperty: (propertyId: string, updates: any) => Promise<{ error: any }>;
  refreshProperty: () => Promise<void>;
  updateCurrentProperty: (
    propertyId: string,
    updates: Partial<any>
  ) => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(
  undefined
);

export function PropertyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [userProperties, setUserProperties] = useState([]);
  const [userTenants, setUserTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const loadUserData = async () => {
    if (!user?.id) {
      console.log("❌ No user ID - exiting loadUserData");
      return;
    }

    console.log("🔍 === WORKING FRESH CLIENT VERSION ===");
    setLoading(true);
    setError(null);

    try {
      // Create fresh client (this works!)
      const { createClient } = await import("@supabase/supabase-js");

      const supabaseUrl = "https://hkrgfqpshdoroimlulzw.supabase.co";
      const supabaseKey =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrcmdmcXBzaGRvcm9pbWx1bHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTk3MTMsImV4cCI6MjA2MjMzNTcxM30.Wt84o_Xcvdqp48qZVqYEmMLBY8VTvTsPBTysN3LvRm0";

      const freshClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      console.log("🆕 Fresh client created successfully");

      // Get user properties with fresh client
      const { data: userProperties, error: propertiesError } = await freshClient
        .from("properties")
        .select("*")
        .eq("created_by", user.id);

      console.log("🏠 Fresh client properties result:", {
        count: userProperties?.length,
        data: userProperties,
        error: propertiesError,
      });

      if (propertiesError) {
        throw new Error(`Properties query failed: ${propertiesError.message}`);
      }

      // Check what state setters are actually available in your hook
      console.log("🔍 Available setters check:", {
        hasSetProperties: typeof setProperties !== "undefined",
        hasSetCurrentProperty: typeof setCurrentProperty !== "undefined",
        hasSetData: typeof setData !== "undefined",
        hasSetProperty: typeof setProperty !== "undefined",
      });

      // Try different possible setter names
      if (typeof setProperties !== "undefined") {
        console.log("✅ Using setProperties");
        setProperties(userProperties || []);
      } else if (typeof setData !== "undefined") {
        console.log("✅ Using setData");
        setData(userProperties || []);
      } else {
        console.log("❌ No properties setter found - will set manually in context");
      }

      if (
        typeof setCurrentProperty !== "undefined" &&
        userProperties &&
        userProperties.length > 0
      ) {
        setCurrentProperty(userProperties[0]);
        console.log("✅ SUCCESS! Set current property:", userProperties[0].name);
      } else if (userProperties && userProperties.length > 0) {
        console.log("✅ Property found but no setter:", userProperties[0].name);
      }

      console.log("🎉 === FRESH CLIENT SUCCESS - DATA LOADED ===");
    } catch (error) {
      console.error("💥 Error:", error);
      setError(`Failed to load properties: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🔧 FIX: Remove circular dependency by only depending on user.id
  useEffect(() => {
    loadUserData();
  }, [user?.id]); // 🔧 FIX: Only depend on user.id, not hasInitialized

  // Enhanced currentTenant with proper structure and better logging
  const enhancedCurrentTenant = useMemo(() => {
    debugLog("🔍 Enhanced tenant calculation:", {
      hasProperty: !!currentProperty,
      hasTenant: !!currentTenant,
      propertyId: currentProperty?.id,
      tenantId: currentTenant?.id,
    });

    if (!currentProperty || !currentTenant) {
      debugLog("🔍 No enhanced tenant: missing property or tenant", {
        hasProperty: !!currentProperty,
        hasTenant: !!currentTenant,
      });
      return null;
    }

    const enhanced = {
      id: currentTenant.id,
      user_id: currentTenant.user_id,
      property_id: currentProperty.id,
      role: currentTenant.role,
      tenant_id: currentTenant.tenant_id,
    };

    debugLog("✅ Enhanced tenant created:", enhanced);
    return enhanced;
  }, [currentProperty, currentTenant]);

  // Property management methods
  const switchProperty = useCallback(
    async (propertyId: string) => {
      const property = userProperties.find((p) => p.id === propertyId);
      if (property) {
        setCurrentProperty(property);
        localStorage.setItem("currentPropertyId", propertyId);
        debugLog("✅ Switched to property:", property.name);
      }
    },
    [userProperties]
  );

  const updateProperty = useCallback(
    async (propertyId: string, updates: any) => {
      const { error } = await supabase
        .from("properties")
        .update(updates)
        .eq("id", propertyId);

      if (!error) {
        setCurrentProperty((prev) =>
          prev?.id === propertyId ? { ...prev, ...updates } : prev
        );
        setUserProperties((prev) =>
          prev.map((prop) =>
            prop.id === propertyId ? { ...prop, ...updates } : prop
          )
        );
      }

      return { error };
    },
    []
  );

  const refreshProperty = useCallback(async () => {
    if (!currentProperty?.id) return;

    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", currentProperty.id)
      .single();

    if (data && !error) {
      setCurrentProperty(data);
    }
  }, [currentProperty?.id]);

  const updateCurrentProperty = useCallback(
    async (propertyId: string, updates: Partial<any>) => {
      setCurrentProperty((prev) =>
        prev?.id === propertyId ? { ...prev, ...updates } : prev
      );
      setUserProperties((prev) =>
        prev.map((prop) =>
          prop.id === propertyId ? { ...prop, ...updates } : prop
        )
      );
    },
    []
  );

  const value = useMemo(
    () => ({
      currentProperty,
      currentTenant: enhancedCurrentTenant,
      userProperties,
      userTenants,
      loading,
      error,
      hasInitialized,
      setCurrentProperty,
      setCurrentTenant,
      switchProperty,
      updateProperty,
      refreshProperty,
      updateCurrentProperty,
    }),
    [
      currentProperty,
      enhancedCurrentTenant,
      userProperties,
      userTenants,
      loading,
      error,
      hasInitialized,
      switchProperty,
      updateProperty,
      refreshProperty,
      updateCurrentProperty,
    ]
  );

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error("useProperty must be used within a PropertyProvider");
  }
  return context;
}
