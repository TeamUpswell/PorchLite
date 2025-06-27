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

  hasInitialized: boolean; // Add this line
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
  const [hasInitialized, setHasInitialized] = useState(false); // Add this line

  // Refs to prevent duplicate fetches
  const loadingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  const loadUserProperties = useCallback(async (): Promise<void> => {
    const userId = user?.id;

    if (!userId || loadingRef.current) {
      console.log("🏠 useProperty: Skipping load", {
        userId: !!userId,
        loading: loadingRef.current,
      });
      return;
    }

    console.log(
      "🏠 useProperty: Starting to load properties for user:",
      userId
    );
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Method 1: Direct properties query using created_by
      const { data: properties, error: directError } = await supabase
        .from("properties")
        .select("*")
        .eq("created_by", userId) // ✅ This field exists in properties table
        .eq("is_active", true);

      console.log("🏠 useProperty: Direct properties query result:", {
        data: properties,
        error: directError,
      });

      if (properties?.length) {
        console.log("🏠 useProperty: Found properties via direct query:", properties.length);
        setUserProperties(properties);
        setCurrentProperty(properties[0]);
        setLoading(false);
        setHasInitialized(true);
        return;
      }

      console.log("🏠 Direct query failed, trying tenant_users approach...");

      // Method 2: Through tenant_users relationship
      const { data: tenantUsers, error: tenantError } = await supabase
        .from("tenant_users")
        .select(`
          user_id,
          role,
          status,
          tenant_id,
          tenants!inner (
            id,
            name,
            owner_user_id
          )
        `)
        .eq("user_id", userId)
        .eq("status", "active");

      console.log("🏠 useProperty: Tenant user query result:", {
        data: tenantUsers,
        error: tenantError,
      });

      if (tenantError) {
        throw tenantError;
      }

      if (!tenantUsers?.length) {
        console.log("🏠 useProperty: No tenant users found");
        setUserProperties([]);
        setCurrentProperty(null);
        setLoading(false);
        setHasInitialized(true);
        return;
      }

      // Get properties for the user's tenants
      const tenantIds = tenantUsers.map(tu => tu.tenant_id);
      console.log("🏠 useProperty: Found tenant IDs:", tenantIds);

      const { data: tenantProperties, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .in("tenant_id", tenantIds)
        .eq("is_active", true);

      if (propertiesError) {
        throw propertiesError;
      }

      const finalProperties = tenantProperties || [];
      console.log("🏠 useProperty: Final properties:", finalProperties.length);

      setUserProperties(finalProperties);
      setCurrentProperty(finalProperties[0] || null);
      setLoading(false);
      setHasInitialized(true);

    } catch (error) {
      console.error("🏠 useProperty: Property loading error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load properties"
      );
      setUserProperties([]);
      setCurrentProperty(null);
      setTenant(null);
      setLoading(false);
      setHasInitialized(true);
    } finally {
      loadingRef.current = false;
      console.log("🏠 useProperty: Loading complete");
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
        .insert([{ ...property, user_id: user.id }]) // Use user_id instead of owner_id
        .select()
        .single();

      if (error) throw error;

      // Create tenant_user record if that table exists
      try {
        await supabase.from("tenant_users").insert([
          {
            user_id: user.id,
            role: "owner",
            // Add tenant_id if required by your schema
          },
        ]);
      } catch (tenantError) {
        console.log("Could not create tenant_user record:", tenantError);
        // Don't throw here, the property was created successfully
      }

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
    hasInitialized, // Add this line
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
