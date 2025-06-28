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
  created_by: string; // ✅ Changed from owner_id to match your DB
  latitude?: number;
  longitude?: number;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean; // ✅ Added since you filter on this
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
  hasInitialized: boolean;
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
  const [hasInitialized, setHasInitialized] = useState(false);

  // Refs to prevent duplicate fetches
  const loadingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  const loadUserProperties = useCallback(async () => {
    if (!user?.id) {
      console.log("🏠 useProperty: No user ID available");
      return;
    }

    if (loadingRef.current) {
      console.log("🏠 useProperty: Already loading, skipping...");
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    console.log("🏠 useProperty: Starting to load properties for user:", user.id);

    try {
      console.log("🔍 useProperty: Querying properties with created_by:", user.id);
      
      // ✅ Simplified query without Promise.race timeout
      const { data: properties, error } = await supabase
        .from("properties")
        .select("*")
        .eq("created_by", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.log("❌ useProperty: Error loading properties:", error);
        setError(error.message);
        return;
      }

      console.log("✅ useProperty: Loaded properties:", properties?.length || 0);
      setUserProperties(properties || []);
      
      // ✅ REMOVED: Don't auto-select here, let the effect handle it
      setHasInitialized(true);
      
    } catch (error: any) {
      console.log("❌ useProperty: Exception loading properties:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [user?.id]); // ✅ FIXED: Removed currentProperty dependency to prevent loops

  // ✅ Auto-select first property when loaded
  useEffect(() => {
    if (userProperties.length > 0 && !currentProperty && hasInitialized) {
      console.log("🎯 useProperty: Auto-selecting first property:", userProperties[0].name);
      setCurrentProperty(userProperties[0]);
    }
  }, [userProperties, currentProperty, hasInitialized]);

  // ✅ Main effect to load properties when user changes
  useEffect(() => {
    if (!user?.id) {
      console.log("🏠 useProperty: No user yet, resetting state...");
      setUserProperties([]);
      setCurrentProperty(null);
      setHasInitialized(false);
      setLoading(false);
      lastUserIdRef.current = null;
      return;
    }

    const newUserId = user.id;

    // Only load if user changed or not initialized
    if (newUserId !== lastUserIdRef.current || !hasInitialized) {
      console.log("🏠 useProperty: User changed or not initialized, loading properties...");
      lastUserIdRef.current = newUserId;
      loadUserProperties();
    }
  }, [user?.id, hasInitialized]); // ✅ Removed loadUserProperties from deps to prevent loops

  const createProperty = useCallback(
    async (
      property: Omit<Property, "id" | "created_at" | "updated_at">
    ): Promise<Property> => {
      if (!user?.id) throw new Error("Must be logged in to create property");

      // ✅ Fixed: Use created_by instead of user_id to match your schema
      const { data, error } = await supabase
        .from("properties")
        .insert([{ ...property, created_by: user.id }])
        .select()
        .single();

      if (error) throw error;

      // Create tenant_user record if that table exists
      try {
        await supabase.from("tenant_users").insert([
          {
            user_id: user.id,
            role: "owner",
            property_id: data.id, // ✅ Added property_id
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
    hasInitialized,
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