"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useAuth } from "@/components/auth";
import { supabase } from "../supabase";

interface PropertyContextType {
  currentProperty: any;
  currentTenant: any;
  userProperties: any[];
  userTenants: any[];
  loading: boolean;
  error: string | null;
  setCurrentProperty: (property: any) => void;
  setCurrentTenant: (tenant: any) => void;
  switchProperty: (propertyId: string) => Promise<void>;
  updateProperty: (propertyId: string, updates: any) => Promise<{ error: any }>;
  refreshProperty: () => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(
  undefined
);

export function PropertyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentProperty, setCurrentProperty] = useState(null);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [userProperties, setUserProperties] = useState([]);
  const [userTenants, setUserTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);

  const loadUserTenants = useCallback(async () => {
    if (!user?.id || isLoadingTenants) {
      console.log("🔍 No user or already loading, skipping tenant load");
      return [];
    }

    setIsLoadingTenants(true);
    try {
      console.log("🔍 Loading tenants for user:", user.id);

      // Get tenant user relationships first
      const { data: tenantUsers, error: tenantUserError } = await supabase
        .from("tenant_users")
        .select("tenant_id, role")
        .eq("user_id", user.id);

      if (tenantUserError) {
        console.error("❌ Error loading tenant users:", tenantUserError);
        setUserTenants([]);
        return [];
      }

      if (!tenantUsers || tenantUsers.length === 0) {
        console.log("🔍 No tenant associations found");
        setUserTenants([]);
        return [];
      }

      // Get tenant details
      const tenantIds = tenantUsers.map((tu) => tu.tenant_id);
      const { data: tenants, error: tenantError } = await supabase
        .from("tenants")
        .select("*")
        .in("id", tenantIds);

      if (tenantError) {
        console.error("❌ Error loading tenants:", tenantError);
        setUserTenants([]);
        return [];
      }

      console.log("✅ Loaded tenants:", tenants);
      setUserTenants(tenants || []);

      // Set first tenant as current if none selected and tenants exist
      if (tenants && tenants.length > 0 && !currentTenant) {
        const firstTenant = tenants[0];
        console.log("✅ Setting first tenant as current:", firstTenant);
        setCurrentTenant(firstTenant);
        localStorage.setItem("currentTenantId", firstTenant.id);
        return firstTenant;
      }

      return tenants && tenants.length > 0 ? tenants[0] : null;
    } catch (err) {
      console.error("❌ Failed to load tenants:", err);
      setError(err.message);
      return null;
    } finally {
      setIsLoadingTenants(false);
    }
  }, [user?.id, isLoadingTenants, currentTenant]);

  const loadProperties = useCallback(async (tenant = null) => {
    const activeTenant = tenant || currentTenant;

    if (!activeTenant?.id || isLoadingProperties) {
      console.log("❌ No current tenant or already loading, skipping property load");
      return;
    }

    setIsLoadingProperties(true);
    try {
      console.log("🔍 Loading properties for tenant:", activeTenant.id);
      setLoading(true);

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("tenant_id", activeTenant.id);

      if (error) {
        console.error("❌ Error loading properties:", error);
        setError(error.message);
        return;
      }

      console.log("✅ Loaded properties:", data);
      setUserProperties(data || []);

      // Set first property as current if none selected
      if (data && data.length > 0 && !currentProperty) {
        console.log("✅ Setting first property as current:", data[0]);
        setCurrentProperty(data[0]);
        localStorage.setItem("currentPropertyId", data[0].id);
      }
    } catch (err) {
      console.error("❌ Failed to load properties:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsLoadingProperties(false);
    }
  }, [currentTenant, isLoadingProperties, currentProperty]);

  const switchProperty = async (propertyId: string) => {
    const property = userProperties.find((p) => p.id === propertyId);
    if (property) {
      setCurrentProperty(property);
      localStorage.setItem("currentPropertyId", propertyId);
      console.log("✅ Switched to property:", property);
    }
  };

  const updateProperty = async (propertyId: string, updates: any) => {
    const { error } = await supabase
      .from("properties")
      .update(updates)
      .eq("id", propertyId);

    if (!error) {
      setCurrentProperty((prev) => (prev ? { ...prev, ...updates } : null));
    }

    return { error };
  };

  const refreshProperty = async () => {
    if (currentProperty?.id) {
      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("id", currentProperty.id)
        .single();

      if (data) {
        setCurrentProperty(data);
      }
    }
  };

  // SINGLE useEffect for loading data when user changes
  useEffect(() => {
    if (user?.id) {
      const loadData = async () => {
        setLoading(true);
        const tenant = await loadUserTenants();
        if (tenant) {
          await loadProperties(tenant);
        }
        setLoading(false);
      };
      loadData();
    } else {
      setUserTenants([]);
      setUserProperties([]);
      setCurrentTenant(null);
      setCurrentProperty(null);
      setLoading(false);
    }
  }, [user?.id]);

  // SINGLE useEffect for loading properties when tenant changes
  useEffect(() => {
    if (currentTenant?.id && !isLoadingProperties) {
      loadProperties();
    }
  }, [currentTenant?.id]);

  const value = {
    currentProperty,
    currentTenant,
    userProperties,
    userTenants,
    loading,
    error,
    setCurrentProperty,
    setCurrentTenant,
    switchProperty,
    updateProperty,
    refreshProperty,
  };

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
