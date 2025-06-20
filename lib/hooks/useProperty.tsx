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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simple refs to track state
  const loadingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const fetchingRef = useRef(false);

  // ✅ REDUCED: Only log critical state changes
  const isDebugEnabled = process.env.NODE_ENV === 'development';
  
  if (isDebugEnabled && Math.random() < 0.1) { // Only log 10% of renders in dev
    console.log("🏠 Property: Provider render", {
      user: user?.id?.slice(0, 8) + '...',
      authLoading,
      currentProperty: currentProperty?.name,
      propertiesCount: userProperties.length,
    });
  }

  const loadUserProperties = useCallback(async (): Promise<void> => {
    const userId = user?.id;

    if (!userId || loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // ✅ REDUCED: Only log start of fetch, not every detail
      if (isDebugEnabled) {
        console.log("🏠 Property: Loading properties for user");
      }

      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select(`
          *,
          property:properties(*)
        `)
        .eq("user_id", userId);

      if (tenantError) throw tenantError;

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

      // ✅ REDUCED: Only log significant changes
      if (isDebugEnabled && properties.length !== userProperties.length) {
        console.log("🏠 Property: Found", properties.length, "properties");
      }

      setUserProperties(properties);
      setTenant(validTenants[0] || null);

      setCurrentProperty((prevCurrent) => {
        const currentStillValid =
          prevCurrent &&
          properties.some((p) => p.id === prevCurrent.id);

        if (!currentStillValid && properties.length > 0) {
          if (isDebugEnabled) {
            console.log("🏠 Property: Set current to:", properties[0].name);
          }
          return properties[0];
        } else if (properties.length === 0) {
          return null;
        }

        return prevCurrent;
      });
    } catch (err) {
      // ✅ KEEP: Always log errors
      console.error("🏠 Property loading error:", err);
      setError(err instanceof Error ? err.message : "Failed to load properties");
      setUserProperties([]);
      setCurrentProperty(null);
      setTenant(null);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [user?.id, userProperties.length]); // Added userProperties.length for comparison

  const cleanupRef = useRef<(() => void)[]>([]);

  const registerCleanup = (cleanup: () => void) => {
    cleanupRef.current.push(cleanup);
  };

  // ✅ REDUCED: Less verbose user effect logging
  useEffect(() => {
    let mounted = true;

    const handleUserChange = async () => {
      if (!initialized) {
        return;
      }

      const newUserId = user?.id || null;

      if (newUserId !== lastUserIdRef.current) {
        // ✅ REDUCED: Only log user changes, not every check
        if (isDebugEnabled) {
          console.log("🏠 Property: User changed", {
            hasUser: !!newUserId,
            hadUser: !!lastUserIdRef.current
          });
        }

        lastUserIdRef.current = newUserId;

        if (newUserId && mounted) {
          await loadUserProperties();
        } else if (mounted) {
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
  }, [user?.id, authLoading, initialized, loadUserProperties]);

  // ✅ REDUCED: Only log cleanup in debug mode
  useEffect(() => {
    return () => {
      if (isDebugEnabled) {
        console.log("🏠 Property: Provider cleanup");
      }
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
  
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  
  return context;
}