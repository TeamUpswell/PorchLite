"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
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
  const { user, loading: authLoading } = useAuth();
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent duplicate fetches
  const loadingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  const loadUserProperties = useCallback(async (): Promise<void> => {
    const userId = user?.id;

    if (!userId || loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select(
          `
          *,
          property:properties(*)
        `
        )
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

      setUserProperties(properties);
      setTenant(validTenants[0] || null);

      // Set current property if none selected or current is invalid
      setCurrentProperty((prevCurrent) => {
        const currentStillValid =
          prevCurrent && properties.some((p) => p.id === prevCurrent.id);

        if (!currentStillValid && properties.length > 0) {
          return properties[0];
        } else if (properties.length === 0) {
          return null;
        }

        return prevCurrent;
      });
    } catch (err) {
      console.error("Property loading error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load properties"
      );
      setUserProperties([]);
      setCurrentProperty(null);
      setTenant(null);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [user?.id]);

  // Load properties when user changes
  useEffect(() => {
    let mounted = true;

    const handleUserChange = async () => {
      if (authLoading || !user?.id) {
        if (!authLoading && mounted) {
          setLoading(false);
        }
        return;
      }

      const newUserId = user.id;

      if (newUserId !== lastUserIdRef.current) {
        lastUserIdRef.current = newUserId;

        if (mounted) {
          await loadUserProperties();
        }
      }
    };

    handleUserChange();

    return () => {
      mounted = false;
    };
  }, [user?.id, authLoading, loadUserProperties]);

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

      await supabase.from("tenants").insert([
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
      const { error } = await supabase.from("properties").delete().eq("id", id);

      if (error) throw error;

      if (currentProperty?.id === id) {
        setCurrentProperty(null);
      }

      await loadUserProperties();
    },
    [currentProperty?.id, loadUserProperties]
  );

  const value = {
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
