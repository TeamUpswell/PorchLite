"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useAuth } from "@/components/auth";
import { supabase } from "@/lib/supabase";
import { debugLog } from "@/lib/utils/debug";

// Add missing Property interface
interface Property {
  id: string;
  name: string;
  address?: string;
  created_by: string;
  created_at: string;
  [key: string]: any;
}

interface Tenant {
  id: string;
  user_id: string;
  property_id: string;
  role: string;
  tenant_id: string;
  [key: string]: any;
}

interface PropertyContextType {
  currentProperty: Property | null;
  currentTenant: Tenant | null;
  userProperties: Property[];
  userTenants: Tenant[];
  loading: boolean;
  error: string | null;
  hasInitialized: boolean;
  setCurrentProperty: (property: Property | null) => void;
  setCurrentTenant: (tenant: Tenant | null) => void;
  switchProperty: (propertyId: string) => Promise<void>;
  updateProperty: (propertyId: string, updates: any) => Promise<{ error: any }>;
  refreshProperty: () => Promise<void>;
  updateCurrentProperty: (
    propertyId: string,
    updates: Partial<Property>
  ) => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(
  undefined
);

export function PropertyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [userTenants, setUserTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // ✅ ADD: Prevent multiple simultaneous calls
  const loadingRef = useRef(false);
  const lastErrorTime = useRef(0);
  const mountedRef = useRef(true);

  console.log("🔍 PropertyProvider state:", {
    user: user?.email,
    loading,
    hasInitialized,
    currentProperty: currentProperty?.name,
    userPropertiesCount: userProperties.length,
    error,
  });

  // ✅ REMOVE: ensureValidSession (causing unnecessary complexity)

  // ✅ FIXED: Stable loadUserData with proper error handling
  const loadUserData = useCallback(async () => {
    if (!user?.id) {
      console.log("❌ No user ID - exiting loadUserData");
      setLoading(false);
      setHasInitialized(true);
      return;
    }

    // ✅ Prevent simultaneous calls
    if (loadingRef.current) {
      console.log("🛑 loadUserData already in progress");
      return;
    }

    // ✅ Check error cooldown
    if (error && Date.now() - lastErrorTime.current < 10000) {
      console.log("🛑 Recent error, cooling down...");
      return;
    }

    loadingRef.current = true;
    console.log("🔍 Starting property lookup for user:", user.id);

    try {
      setLoading(true);
      setError(null);

      // ✅ Shorter timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Request timeout after 8 seconds")),
          8000
        )
      );

      const queryPromise = supabase
        .from("properties")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      console.log("📡 Executing Supabase query...");
      const response = await Promise.race([queryPromise, timeoutPromise]);

      // ✅ Check if component is still mounted
      if (!mountedRef.current) return;

      console.log("🏠 Raw Supabase response:", response);

      if (response.error) {
        throw new Error(`Query failed: ${response.error.message}`);
      }

      const propertiesData = response.data || [];
      console.log("✅ Properties found:", propertiesData.length);

      setUserProperties(propertiesData);

      if (propertiesData.length > 0) {
        const selectedProperty = propertiesData[0];
        setCurrentProperty(selectedProperty);
        console.log("✅ Set current property:", selectedProperty.name);
      } else {
        console.log("📭 No properties found");
        setCurrentProperty(null);
      }
    } catch (error: any) {
      console.error("💥 Property loading failed:", error);
      lastErrorTime.current = Date.now(); // ✅ Track error time

      // ✅ Set error but don't fail completely
      setError(`Failed to load properties: ${error.message}`);
      setUserProperties([]);
      setCurrentProperty(null);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setHasInitialized(true);
      }
      loadingRef.current = false; // ✅ Reset loading flag
    }
  }, [user?.id]); // ✅ REMOVED error from dependencies

  // ✅ FIXED: useEffect with proper dependencies
  useEffect(() => {
    console.log(
      "🔄 useProperty useEffect triggered. User:",
      user?.id,
      "HasInitialized:",
      hasInitialized,
      "LoadingRef:",
      loadingRef.current
    );

    const conditions = {
      hasUser: !!user?.id,
      notInitialized: !hasInitialized,
      notLoadingRef: !loadingRef.current,
      shouldLoad: user?.id && !hasInitialized && !loadingRef.current,
    };

    console.log("🔄 Conditions:", conditions);

    // ✅ FIX: Use loadingRef instead of loading state
    if (user?.id && !hasInitialized && !loadingRef.current) {
      console.log("🚀 Calling loadUserData...");
      loadUserData();
    } else {
      console.log("🛑 Not calling loadUserData - conditions not met");
    }
  }, [user?.id, hasInitialized, loadUserData]); // ✅ Remove 'loading' from dependencies

  // ✅ Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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

  const switchProperty = useCallback(
    async (propertyId: string) => {
      const property = userProperties.find((p) => p.id === propertyId);
      if (property) {
        setCurrentProperty(property);
        localStorage.setItem("currentPropertyId", propertyId);
        console.log("✅ Switched to property:", property.name);
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
    async (propertyId: string, updates: Partial<Property>) => {
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

  // ✅ REMOVED: Emergency timeout (no longer needed)

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
