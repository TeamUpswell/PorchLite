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
      // TEST: Can we query the properties table at all?
      console.log("🧪 Testing basic properties table access...");
      
      // Test 1: Simple count query
      const { count, error: countError } = await supabase
        .from("properties")
        .select("*", { count: 'exact', head: true });

      console.log("🧪 Properties count test:", { count, error: countError });

      // Test 2: Basic select
      const { data: testData, error: testError } = await supabase
        .from("properties")
        .select("id, name")
        .limit(3);

      console.log("🧪 Basic properties test:", {
        data: testData,
        error: testError,
        count: testData?.length,
      });

      // Method 1: Direct properties query using created_by
      console.log("🔍 useProperty: About to query properties with userId:", userId);

      const { data: properties, error: directError } = await supabase
        .from("properties")
        .select("*")
        .or(`created_by.eq.${userId},owner_id.eq.${userId}`) // Try both fields
        .eq("is_active", true);

      console.log("🏠 useProperty: Direct properties query result:", {
        data: properties,
        error: directError,
        dataLength: properties?.length,
        userId: userId,
      });

      // Add detailed error logging
      if (directError) {
        console.error("🚨 useProperty: Direct query error:", directError);
      }

      if (properties?.length) {
        console.log(
          "🏠 useProperty: Found properties via direct query:",
          properties.length,
          "Properties:",
          properties
        );
        setUserProperties(properties);
        setCurrentProperty(properties[0]);
        setLoading(false);
        setHasInitialized(true);
        return;
      }

      console.log(
        "🏠 Direct query returned no results, trying alternative queries..."
      );

      // Try different query approaches
      console.log("🔍 Trying query with just created_by...");
      const { data: createdByProps, error: createdByError } = await supabase
        .from("properties")
        .select("*")
        .eq("created_by", userId);

      console.log("🔍 created_by query result:", {
        data: createdByProps,
        error: createdByError,
      });

      console.log("🔍 Trying query with just owner_id...");
      const { data: ownerProps, error: ownerError } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", userId);

      console.log("🔍 owner_id query result:", {
        data: ownerProps,
        error: ownerError,
      });

      // Use whichever query worked
      const foundProperties =
        createdByProps?.length > 0
          ? createdByProps
          : ownerProps?.length > 0
          ? ownerProps
          : null;

      if (foundProperties?.length) {
        console.log("✅ Found properties via alternative query:", foundProperties.length);
        setUserProperties(foundProperties);
        setCurrentProperty(foundProperties[0]);
        setLoading(false);
        setHasInitialized(true);
        return;
      }

      console.log("🏠 Direct query failed, trying tenant_users approach...");

      // Method 2: Through tenant_users relationship
      const { data: tenantUsers, error: tenantError } = await supabase
        .from("tenant_users")
        .select(
          `
          user_id,
          role,
          status,
          tenant_id,
          tenants!inner (
            id,
            name,
            owner_user_id
          )
        `
        )
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
      const tenantIds = tenantUsers.map((tu) => tu.tenant_id);
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
      // ✅ FIXED: Don't wait for authLoading, just check if we have a user
      if (!user?.id) {
        console.log("🏠 useProperty: No user yet, waiting...");
        if (mounted) {
          setLoading(true); // Keep loading until we get user
        }
        return;
      }

      // ✅ FIXED: We have a user, proceed with loading properties
      const newUserId = user.id;

      if (newUserId !== lastUserIdRef.current) {
        console.log("🏠 useProperty: New user detected, loading properties...");
        lastUserIdRef.current = newUserId;

        if (mounted) {
          await loadUserProperties();
        }
      } else {
        // Same user, but make sure we're not stuck in loading
        if (mounted && loading && !loadingRef.current) {
          console.log(
            "🏠 useProperty: Same user, but stuck loading. Finishing..."
          );
          setLoading(false);
          setHasInitialized(true);
        }
      }
    };

    handleUserChange();

    return () => {
      mounted = false;
    };
  }, [user?.id, loadUserProperties]); // ✅ REMOVED authLoading from dependencies

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
