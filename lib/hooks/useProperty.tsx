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
import { supabase } from "../supabase";
import { debugLog, debugError } from "@/lib/utils/debug";

const isDev = process.env.NODE_ENV === "development";

interface PropertyContextType {
  currentProperty: any;
  currentTenant: any;
  userProperties: any[];
  userTenants: any[];
  loading: boolean;
  error: string | null;
  hasInitialized: boolean; // ✅ ONLY ADD THIS
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
  const [currentProperty, setCurrentProperty] = useState(null);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [userProperties, setUserProperties] = useState([]);
  const [userTenants, setUserTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false); // ✅ ONLY ADD THIS

  // Add loading guards to prevent duplicate calls
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);

  // ✅ SIMPLIFIED APPROACH - PROPERTY OWNERSHIP MODEL
  useEffect(() => {
    async function loadUserData() {
      if (!user) {
        debugLog("🔍 No user - clearing all data");
        setCurrentProperty(null);
        setCurrentTenant(null);
        setUserTenants([]);
        setUserProperties([]);
        setLoading(false);
        setError(null);
        setHasInitialized(true); // ✅ ONLY ADD THIS
        return;
      }

      setLoading(true);
      setError(null);
      if (isDev) {
        debugLog("🔍 Loading data for user:", user.id);
        debugLog("🔍 Starting property lookup for user:", user.id);
      }

      try {
        // Add session check
        const {
          data: { session },
        } = await supabase.auth.getSession();
        debugLog("🔍 Current session:", session?.user?.id);

        // Get user's tenant IDs first
        const { data: userTenants, error: tenantError } = await supabase
          .from("tenant_users")
          .select("tenant_id")
          .eq("user_id", user.id)
          .eq("status", "active");

        if (tenantError) {
          debugError("❌ Error fetching tenant IDs:", tenantError);
        }

        const tenantIds = userTenants?.map((t) => t.tenant_id) || [];

        debugLog("🔍 User tenant IDs:", tenantIds);
        debugLog("🔍 User ID:", user.id);

        // Get properties created by user
        const { data: ownedProperties, error: ownedError } = await supabase
          .from("properties")
          .select(
            `
            *,
            tenants (
              id,
              name
            )
          `
          )
          .eq("created_by", user.id);

        debugLog("🔍 Owned properties query result:", {
          ownedProperties,
          ownedError,
        });

        if (ownedError) throw ownedError;

        let tenantProperties = [];

        // Get properties from user's tenants (if any)
        if (tenantIds.length > 0) {
          const { data: props, error: tenantError } = await supabase
            .from("properties")
            .select(
              `
              *,
              tenants (
                id,
                name
              )
            `
            )
            .in("tenant_id", tenantIds)
            .neq("created_by", user.id);

          debugLog("🔍 Tenant properties query result:", {
            props,
            tenantError,
          });

          if (tenantError) throw tenantError;
          tenantProperties = props || [];
        }

        // Combine and deduplicate properties
        const allProperties = [...(ownedProperties || []), ...tenantProperties];
        debugLog("🔍 All properties before deduplication:", allProperties);

        const uniqueProperties = allProperties.filter(
          (prop, index, self) =>
            index === self.findIndex((p) => p.id === prop.id)
        );

        const properties = uniqueProperties.sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        debugLog("✅ Final properties after processing:", properties);

        if (properties && properties.length > 0) {
          const firstProperty = properties[0];

          // Set properties array first
          setUserProperties(properties);

          // Create tenant object
          let tenantObj;
          const inferredTenant = properties.find(
            (p) => p.created_by !== user.id
          );

          if (inferredTenant) {
            tenantObj = {
              id: inferredTenant.tenant_id,
              user_id: user.id,
              role: "member",
              tenant_id: inferredTenant.tenant_id,
              tenant: {
                id: inferredTenant.tenant_id,
                name: "Inferred Tenant",
              },
            };
            debugLog("✅ Inferred tenant from property:", tenantObj);
          } else {
            tenantObj = {
              id: `owner-${user.id}`,
              user_id: user.id,
              role: "owner",
              tenant_id: firstProperty.tenant_id,
              tenant: {
                id: firstProperty.tenant_id,
                name: "Property Owner",
              },
            };
            debugLog("✅ Set up as property owner:", tenantObj);
          }

          // Set tenant first, then property to ensure both are available
          setCurrentTenant(tenantObj);
          setUserTenants([tenantObj]);

          // Use setTimeout to ensure state updates are processed
          setTimeout(() => {
            setCurrentProperty(firstProperty);
            debugLog("✅ Property and tenant both set:", {
              property: firstProperty.name,
              tenant: tenantObj.tenant.name,
            });
          }, 0);
        } else {
          // ✅ ONLY CHANGE THIS - DON'T THROW ERROR ON FIRST LOAD
          if (hasInitialized) {
            throw new Error("No properties found");
          } else {
            debugLog("🔍 No properties found for user");
          }
        }
      } catch (error: any) {
        debugError("❌ Error loading user data:", error);
        // ✅ ONLY CHANGE THIS - DON'T SHOW ERROR ON FIRST LOAD
        if (hasInitialized) {
          setError(error?.message || "Failed to load user data");
        }
        setUserTenants([]);
        setUserProperties([]);
        setCurrentTenant(null);
        setCurrentProperty(null);
      } finally {
        setLoading(false);
        setHasInitialized(true); // ✅ ONLY ADD THIS
      }
    }

    loadUserData();
  }, [user?.id, hasInitialized]); // ✅ ONLY ADD hasInitialized TO DEPENDENCY

  // ✅ Enhanced currentTenant with proper structure and better logging
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

  // ✅ Property management methods
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

  const loadUserTenants = useCallback(async () => {
    if (!user?.id || isLoadingTenants || isLoadingProperties) return;

    setIsLoadingTenants(true);
    try {
      // Your existing logic
    } finally {
      setIsLoadingTenants(false);
    }
  }, [user?.id, isLoadingTenants, isLoadingProperties]);

  const value = useMemo(
    () => ({
      currentProperty,
      currentTenant: enhancedCurrentTenant,
      userProperties,
      userTenants,
      loading,
      error,
      hasInitialized, // ✅ ONLY ADD THIS
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
      hasInitialized, // ✅ ONLY ADD THIS
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
