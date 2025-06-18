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
  latitude?: number;
  longitude?: number;
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
  const { user, loading: authLoading, initialized } = useAuth();
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple refs to track state
  const loadingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  console.log("🏠 Property: Provider render", {
    user: user?.id,
    authLoading,
    initialized,
    currentProperty: currentProperty?.id,
    userPropertiesCount: userProperties.length,
    loading,
  });

  // ✅ FIXED: Include user.id dependency and use functional updates
  const loadUserProperties = useCallback(async (): Promise<void> => {
    const userId = user?.id;

    console.log("🏠 Property: loadUserProperties called", {
      userId,
      isLoading: loadingRef.current,
    });

    if (!userId || loadingRef.current) {
      console.log(
        "🏠 Property: Skipping load",
        { userId, isLoading: loadingRef.current }
      );
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log("🏠 Property: Starting fetch for user:", userId);

      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select(`
          *,
          property:properties(*)
        `)
        .eq("user_id", userId);

      if (tenantError) throw tenantError;

      console.log("🏠 Property: Tenants response:", tenantData);

      const properties: Property[] = [];
      const validTenants: Tenant[] = [];

      if (tenantData) {
        tenantData.forEach((tenantRecord) => {
          if (tenantRecord.property) {
            let propertyData = tenantRecord.property;

            if (Array.isArray(propertyData)) {
              if (propertyData.length === 0) return;
              propertyData = propertyData[0];
            }

            if (propertyData?.id && propertyData?.name) {
              properties.push(propertyData as Property);
              validTenants.push({
                id: tenantRecord.id,
                property_id: tenantRecord.property_id,
                user_id: tenantRecord.user_id,
                role: tenantRecord.role,
                created_at: tenantRecord.created_at,
              });
            }
          }
        });
      }

      console.log("🏠 Property: Processed properties:", properties);

      // ✅ FIXED: Update state in batch and use functional updates
      setUserProperties(properties);
      setTenant(validTenants[0] || null);

      // ✅ FIXED: Use functional update to avoid stale closure
      setCurrentProperty((prevCurrent) => {
        console.log("🏠 Property: Setting current property", {
          prevCurrent: prevCurrent?.id,
          availableProperties: properties.map((p) => p.id),
        });

        // If no current property or current property not in list, set first one
        const currentStillValid =
          prevCurrent &&
          properties.some((p) => p.id === prevCurrent.id);

        if (!currentStillValid && properties.length > 0) {
          console.log("🏠 Property: Setting first property as current:", properties[0]);
          return properties[0];
        } else if (properties.length === 0) {
          console.log("🏠 Property: No properties found, clearing current");
          return null;
        }

        console.log("🏠 Property: Keeping existing current property");
        return prevCurrent;
      });
    } catch (err) {
      console.error("🏠 Property loading error:", err);
      setError(err instanceof Error ? err.message : "Failed to load properties");
      setUserProperties([]);
      setCurrentProperty(null);
      setTenant(null);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [user?.id]); // ✅ FIXED: Include user.id dependency

  // ✅ ADD: Cleanup ref
  const cleanupRef = useRef<(() => void)[]>([]);

  // ✅ ADD: Register cleanup function
  const registerCleanup = (cleanup: () => void) => {
    cleanupRef.current.push(cleanup);
  };

  // ✅ MODIFY: User effect with proper cleanup
  useEffect(() => {
    let mounted = true;

    const handleUserChange = async () => {
      console.log("🏠 Property: User effect triggered", {
        userId: user?.id || null,
        lastUserId: lastUserIdRef.current,
        authLoading,
        initialized,
      });

      if (!initialized) {
        console.log("🏠 Property: Auth not ready, waiting...");
        return;
      }

      const newUserId = user?.id || null;

      if (newUserId !== lastUserIdRef.current) {
        console.log("🏠 Property: User changed, loading properties", {
          from: lastUserIdRef.current,
          to: newUserId,
        });

        lastUserIdRef.current = newUserId;

        if (newUserId && mounted) {
          await loadUserProperties(newUserId);
        } else if (mounted) {
          // Clear data when no user
          setUserProperties([]);
          setCurrentProperty(null);
          setLoading(false);
        }
      }
    };

    handleUserChange();

    return () => {
      mounted = false;
    };
  }, [user?.id, authLoading, initialized]);

  // ✅ ADD: Component cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("🏠 Property: Provider unmounting, running cleanup...");
      cleanupRef.current.forEach((cleanup) => {
        try {
          cleanup();
        } catch (error) {
          console.error("🏠 Property: Cleanup error:", error);
        }
      });
      cleanupRef.current = [];
    };
  }, []);

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