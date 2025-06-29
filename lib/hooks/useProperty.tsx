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
import { debugLog, debugError } from "@/lib/utils/debug";

export interface Property {
  id: string;
  name: string;
  address: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  main_photo_url?: string;
  is_active: boolean;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  max_occupancy?: number;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  neighborhood_description?: string;
  wifi_name?: string;
  wifi_password?: string;
  check_in_instructions?: string;
  check_out_instructions?: string;
  house_rules?: string;
  security_info?: string;
  parking_info?: string;
  amenities?: string[];
  tenant_id?: string; // ✅ Add this field
  header_image_url?: string;
  updated_by?: string;
  house_tour_enabled?: boolean;
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
  userPropertiesCount: number;
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
      debugLog("🏠 useProperty: No user ID available");
      return;
    }

    if (loadingRef.current) {
      debugLog("🏠 useProperty: Already loading, skipping...");
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    debugLog("🏠 useProperty: Starting to load properties for user:", user.id);

    try {
      // ✅ First, test basic connection with a simple query
      debugLog("🔍 Testing basic Supabase connection...");
      const { data: testData, error: testError } = await supabase
        .from("properties")
        .select("id")
        .limit(1);

      if (testError) {
        debugError("❌ Basic connection test failed:", testError);
        setError(`Connection failed: ${testError.message}`);
        return;
      }

      debugLog("✅ Basic connection successful");

      // ✅ Now try the actual query with more detailed logging
      debugLog("🔍 useProperty: Querying properties with created_by:", user.id);
      
      const { data: properties, error } = await supabase
        .from("properties")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      debugLog("🔍 Raw query response:", {
        data: properties,
        error,
        dataLength: properties?.length,
        query: `created_by = ${user.id}`,
      });

      if (error) {
        debugLog("❌ useProperty: Error loading properties:", error);
        setError(error.message);
        return;
      }

      debugLog("✅ useProperty: Loaded properties:", properties?.length || 0);
      if (properties?.length) {
        debugLog("🏠 Properties details:", properties.map(p => ({ 
          id: p.id, 
          name: p.name, 
          created_by: p.created_by,
          is_active: p.is_active
        })));
      } else {
        debugLog("📝 No properties found for user. This might be normal for new users.");
      }
      
      setUserProperties(properties || []);
      setHasInitialized(true);
      
    } catch (error: any) {
      debugLog("❌ useProperty: Exception loading properties:", error);
      setError(error.message);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [user?.id]); // ✅ FIXED: Removed currentProperty dependency to prevent loops

  // ✅ Auto-select first property when loaded
  useEffect(() => {
    if (userProperties.length > 0 && !currentProperty && hasInitialized) {
      debugLog(
        "🎯 useProperty: Auto-selecting first property:",
        userProperties[0].name
      );
      setCurrentProperty(userProperties[0]);
    }
  }, [userProperties, currentProperty, hasInitialized]);

  // ✅ Add debugging to see what's happening
  useEffect(() => {
    debugLog("🏠 useProperty Debug:", {
      user: user ? { id: user.id, email: user.email } : null,
      userPropertiesCount: userProperties.length,
      currentProperty: currentProperty
        ? { id: currentProperty.id, name: currentProperty.name }
        : null,
      loading,
      hasInitialized,
      lastUserIdRef: lastUserIdRef.current,
    });
  }, [user, userProperties, currentProperty, loading, hasInitialized]);

  // ✅ Main effect to load properties when user changes
  useEffect(() => {
    if (!user?.id) {
      debugLog("🏠 useProperty: No user yet, resetting state...");
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
      debugLog("🏠 useProperty: User changed or not initialized, loading properties...");
      debugLog("🏠 useProperty: Previous user:", lastUserIdRef.current);
      debugLog("🏠 useProperty: Current user:", newUserId);
      debugLog("🏠 useProperty: Has initialized:", hasInitialized);

      lastUserIdRef.current = newUserId;
      loadUserProperties();
    } else {
      debugLog("🏠 useProperty: User unchanged and initialized, skipping load");
    }
  }, [user?.id, hasInitialized, loadUserProperties]);

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
        debugLog("Could not create tenant_user record:", tenantError);
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
    userPropertiesCount: userProperties.length,
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