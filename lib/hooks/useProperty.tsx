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
  const [isInitializing, setIsInitializing] = useState(false);

  console.log("🔍 PropertyProvider state:", {
    user: user?.email,
    loading,
    hasInitialized,
    currentProperty: currentProperty?.name,
    userPropertiesCount: userProperties.length,
    error,
  });

  const ensureValidSession = useCallback(async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;
      if (!session) throw new Error("No active session");

      // Check if token is close to expiry (within 5 minutes)
      if (session.expires_at) {
        const expiryTime = session.expires_at * 1000;
        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;

        if (timeUntilExpiry < 300000) {
          console.log("🔄 Refreshing session before query...");
          const { data: refreshed, error: refreshError } =
            await supabase.auth.refreshSession();
          if (refreshError) throw refreshError;
          return refreshed.session;
        }
      }

      return session;
    } catch (error) {
      console.error("Session validation error:", error);
      throw error;
    }
  }, []);

  const loadUserData = useCallback(async () => {
    if (!user?.id) {
      console.log("❌ No user ID - exiting loadUserData");
      setLoading(false);
      setHasInitialized(true);
      return;
    }

    console.log("🔍 Starting property lookup for user:", user.id);
    setLoading(true);
    setError(null);

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Query timeout")), 10000)
      );

      const queryPromise = supabase
        .from("properties")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      const response = await Promise.race([queryPromise, timeoutPromise]);

      console.log("🏠 Raw response:", response);

      if (response.error) {
        console.error("🚨 Query error:", response.error);
        throw new Error(`Properties query failed: ${response.error.message}`);
      }

      const propertiesData = response.data || [];
      console.log("✅ Got properties data:", propertiesData.length, "items");

      setUserProperties(propertiesData);

      if (propertiesData.length > 0) {
        const selectedProperty = propertiesData[0];
        setCurrentProperty(selectedProperty);
        console.log("✅ SUCCESS! Set current property:", selectedProperty.name);
      } else {
        console.log("📭 No properties found for user");
        setCurrentProperty(null);
      }

      setHasInitialized(true);
    } catch (error: any) {
      console.error("💥 Property loading error:", error);
      setError(`Failed to load properties: ${error.message}`);
      setHasInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [user?.id, ensureValidSession]);

  useEffect(() => {
    if (user && !hasInitialized && !isInitializing) {
      setIsInitializing(true);
      loadUserData().finally(() => setIsInitializing(false));
    }
  }, [user, hasInitialized, isInitializing, loadUserData]);

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

  // Add this useEffect as an emergency override
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading && hasInitialized === false) {
        console.log("🔧 EMERGENCY: Force setting loading to false");
        setLoading(false);
        setHasInitialized(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [loading, hasInitialized]);

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
