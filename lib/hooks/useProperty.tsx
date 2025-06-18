"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "@/components/auth";
import { supabase } from "@/lib/supabase";

interface Property {
  id: string;
  name: string;
  address: string;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
}

interface Tenant {
  id: string;
  property_id: string;
  user_id: string;
  role: "owner" | "manager" | "tenant" | "cleaner";
  created_at?: string;
}

interface PropertyContextType {
  currentProperty: Property | null;
  userProperties: Property[];
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  setCurrentProperty: (property: Property | null) => void;
  loadUserProperties: () => Promise<void>;
  createProperty: (
    property: Omit<Property, "id" | "created_at" | "updated_at">
  ) => Promise<Property>;
  updateProperty: (id: string, updates: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(
  undefined
);

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, initialized } = useAuth(); // ✅ FIXED: Use correct auth properties
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track initialization state to prevent loops
  const hasInitialized = useRef(false);
  const lastUserId = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  console.log("🏠 Property: Provider render", {
    user: user?.id,
    authLoading,
    initialized,
    hasInitialized: hasInitialized.current,
    lastUserId: lastUserId.current,
    isLoading: isLoadingRef.current,
    currentProperty: currentProperty?.id,
    userPropertiesCount: userProperties.length,
  });

  const loadUserProperties = useCallback(async (): Promise<void> => {
    if (!user?.id || isLoadingRef.current) {
      console.log(
        "🏠 Property: Skipping load - no user or already loading",
        {
          userId: user?.id,
          isLoading: isLoadingRef.current,
        }
      );
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log("🏠 [PROD DEBUG] Loading properties for user:", user.id);

      // Get user's properties through tenants table
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select(`
          *,
          property:properties(*)
        `)
        .eq("user_id", user.id);

      if (tenantError) {
        console.error("🏠 Property: Error loading tenants:", tenantError);
        throw tenantError;
      }

      console.log("🏠 [PROD DEBUG] Tenants response:", tenantData);

      // Log each tenant record to see the structure
      if (tenantData) {
        tenantData.forEach((tenant, index) => {
          console.log(`🏠 [DETAILED] Tenant ${index}:`, {
            id: tenant.id,
            property_id: tenant.property_id,
            user_id: tenant.user_id,
            role: tenant.role,
            property: tenant.property,
            propertyType: typeof tenant.property,
            propertyKeys: tenant.property ? Object.keys(tenant.property) : "none",
          });
        });
      }

      // ✅ FIXED: Better property extraction with proper null/empty array handling
      const properties: Property[] = [];
      const validTenants: Tenant[] = [];

      if (tenantData) {
        tenantData.forEach((tenantRecord, index) => {
          console.log(`🏠 [PROCESSING] Processing tenant ${index}:`, tenantRecord);

          // Check if property exists
          if (tenantRecord.property) {
            console.log(`🏠 [PROCESSING] Property found for tenant ${index}:`, tenantRecord.property);

            let propertyData = tenantRecord.property;

            // ✅ FIXED: Handle arrays properly - check if empty first
            if (Array.isArray(propertyData)) {
              console.log(`🏠 [PROCESSING] Property is array, length: ${propertyData.length}`);
              
              if (propertyData.length === 0) {
                console.log(`🏠 [PROCESSING] Empty property array for tenant ${index}, skipping`);
                return; // ✅ Skip this tenant entirely
              }
              
              propertyData = propertyData[0];
              console.log(`🏠 [PROCESSING] Taking first property from array:`, propertyData);
            }

            // ✅ FIXED: Validate the property has required fields AND exists
            if (propertyData && 
                typeof propertyData === 'object' && 
                propertyData.id && 
                propertyData.name) {
              console.log(`🏠 [PROCESSING] Valid property found:`, propertyData);
              properties.push(propertyData as Property);
              validTenants.push({
                id: tenantRecord.id,
                property_id: tenantRecord.property_id,
                user_id: tenantRecord.user_id,
                role: tenantRecord.role,
                created_at: tenantRecord.created_at,
              });
            } else {
              console.log(`🏠 [PROCESSING] Invalid property data for tenant ${index}:`, propertyData);
            }
          } else {
            console.log(`🏠 [PROCESSING] No property for tenant ${index}`);
          }
        });
      }

      console.log("🏠 [PROD DEBUG] Processed properties:", properties);
      console.log("🏠 [PROD DEBUG] Valid tenants:", validTenants);

      setUserProperties(properties);

      // Set current tenant info if available
      if (validTenants.length > 0) {
        setTenant(validTenants[0]);
      } else {
        setTenant(null); // ✅ FIXED: Clear tenant if no valid ones
      }

      // ✅ FIXED: Better current property logic
      if (properties.length > 0) {
        // If no current property is set, or current property is not in the list, set the first one
        const currentPropertyStillValid = currentProperty && 
          properties.some(p => p.id === currentProperty.id);
        
        if (!currentPropertyStillValid) {
          console.log("🏠 Property: Setting first property as current:", properties[0]);
          setCurrentProperty(properties[0]);
        }
      } else {
        console.log("🏠 Property: No valid properties found, clearing current property");
        setCurrentProperty(null);
      }
    } catch (err) {
      console.error("🏠 Property: Error loading properties:", err);
      setError(err instanceof Error ? err.message : "Failed to load properties");
      
      // ✅ FIXED: Clear state on error
      setUserProperties([]);
      setCurrentProperty(null);
      setTenant(null);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [user?.id, currentProperty]);

  // ✅ FIXED: Initialize properties when user changes (but prevent loops)
  useEffect(() => {
    const currentUserId = user?.id || null;

    console.log("🏠 Property: User effect triggered", {
      currentUserId,
      lastUserId: lastUserId.current,
      authLoading,
      initialized,
      hasInitialized: hasInitialized.current,
    });

    // ✅ FIXED: Wait for auth to be initialized, not just loading
    if (authLoading || !initialized) {
      console.log("🏠 Property: Auth not ready, waiting...");
      return;
    }

    // If user logged out, clear everything
    if (!currentUserId) {
      console.log("🏠 Property: No user, clearing properties");
      setCurrentProperty(null);
      setUserProperties([]);
      setTenant(null);
      setError(null);
      hasInitialized.current = false;
      lastUserId.current = null;
      return;
    }

    // Only load if user actually changed
    if (currentUserId !== lastUserId.current) {
      console.log("🏠 Property: User changed, loading properties", {
        from: lastUserId.current,
        to: currentUserId,
      });

      lastUserId.current = currentUserId;
      hasInitialized.current = true;
      loadUserProperties();
    } else {
      console.log("🏠 Property: Same user, skipping load");
    }
  }, [user?.id, authLoading, initialized, loadUserProperties]); // ✅ FIXED: Use initialized instead of status

  const createProperty = useCallback(
    async (
      property: Omit<Property, "id" | "created_at" | "updated_at">
    ): Promise<Property> => {
      if (!user?.id) throw new Error("Must be logged in to create property");

      const { data, error } = await supabase
        .from("properties")
        .insert([{ ...property, owner_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      // Also create tenant entry for the owner
      await supabase
        .from("tenants")
        .insert([
          {
            property_id: data.id,
            user_id: user.id,
            role: "owner",
          },
        ]);

      await loadUserProperties();
      return data;
    },
    [user?.id, loadUserProperties]
  );

  const updateProperty = useCallback(
    async (id: string, updates: Partial<Property>): Promise<void> => {
      const { error } = await supabase
        .from("properties")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      await loadUserProperties();
    },
    [loadUserProperties]
  );

  const deleteProperty = useCallback(
    async (id: string): Promise<void> => {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", id);

      if (error) throw error;

      if (currentProperty?.id === id) {
        setCurrentProperty(null);
      }

      await loadUserProperties();
    },
    [currentProperty?.id, loadUserProperties]
  );

  const contextValue: PropertyContextType = {
    currentProperty,
    userProperties,
    tenant,
    loading,
    error,
    setCurrentProperty,
    loadUserProperties,
    createProperty,
    updateProperty,
    deleteProperty,
  };

  return (
    <PropertyContext.Provider value={contextValue}>
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