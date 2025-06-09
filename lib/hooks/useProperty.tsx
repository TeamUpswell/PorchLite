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
  updateCurrentProperty: (propertyId: string, updates: Partial<any>) => Promise<void>;
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

  // ✅ SIMPLIFIED APPROACH - PROPERTY OWNERSHIP MODEL
  useEffect(() => {
    async function loadUserData() {
      if (!user) {
        console.log("🔍 No user - clearing all data");
        setUserTenants([]);
        setUserProperties([]);
        setCurrentTenant(null);
        setCurrentProperty(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      console.log("🔍 Loading data for user:", user.id);

      try {
        console.log("🔍 Starting property lookup for user:", user.id);

        // ✅ Get ALL properties user has access to (owned OR via tenant)
        const { data: allProperties, error: allPropsError } = await supabase
          .from("properties")
          .select("*")
          .or(`created_by.eq.${user.id},tenant_id.in.(select tenant_id from tenant_users where user_id eq ${user.id})`)
          .order("name");

        if (allPropsError) {
          console.error("❌ Complex query failed, trying simpler approach:", allPropsError);
          
          // ✅ Fallback: Check owned properties first
          const { data: ownedProps, error: ownedError } = await supabase
            .from("properties")
            .select("*")
            .eq("created_by", user.id)
            .order("name");
          
          if (ownedError) {
            console.error("❌ Owned properties error:", ownedError);
            throw ownedError;
          }
          
          console.log("✅ Found owned properties:", ownedProps);
          
          if (ownedProps && ownedProps.length > 0) {
            // User owns properties directly
            const ownerTenant = {
              id: `owner-${user.id}`,
              user_id: user.id,
              role: 'owner', // Use 'owner' for property creators
              tenant_id: ownedProps[0].tenant_id, // Include the tenant_id if it exists
              tenant: { id: ownedProps[0].tenant_id, name: 'Property Owner' }
            };

            setUserTenants([ownerTenant]);
            setCurrentTenant(ownerTenant);
            setUserProperties(ownedProps);
            setCurrentProperty(ownedProps[0]);

            console.log("✅ Set up as property owner:", {
              tenant: ownerTenant,
              property: ownedProps[0]
            });
            return;
          }
          
          // ✅ If no owned properties, try tenant lookup
          const { data: tenantUsers, error: tenantError } = await supabase
            .from("tenant_users")
            .select("tenant_id, role")
            .eq("user_id", user.id);
          
          if (!tenantError && tenantUsers && tenantUsers.length > 0) {
            console.log("✅ Found tenant relationships:", tenantUsers);
            
            for (const tu of tenantUsers) {
              const { data: tenantProps, error: tenantPropsError } = await supabase
                .from("properties")
                .select("*")
                .eq("tenant_id", tu.tenant_id)
                .order("name");
                
              if (!tenantPropsError && tenantProps && tenantProps.length > 0) {
                const tenantEntry = {
                  id: tu.tenant_id,
                  user_id: user.id,
                  role: tu.role,
                  tenant_id: tu.tenant_id,
                  tenant: { id: tu.tenant_id, name: 'Tenant Member' }
                };

                setUserTenants([tenantEntry]);
                setCurrentTenant(tenantEntry);
                setUserProperties(tenantProps);
                setCurrentProperty(tenantProps[0]);

                console.log("✅ Set up via tenant relationship:", {
                  tenant: tenantEntry,
                  property: tenantProps[0]
                });
                return;
              }
            }
          }
          
          // No properties found
          throw new Error("No accessible properties found");
        }

        console.log("✅ Found properties via complex query:", allProperties);
        
        if (allProperties && allProperties.length > 0) {
          // Determine user's role for the first property
          const firstProperty = allProperties[0];
          let userRole = 'guest';
          let tenantId = firstProperty.tenant_id;
          
          // Check if user owns the property
          if (firstProperty.created_by === user.id) {
            userRole = 'owner';
          } else {
            // Check tenant relationship
            const { data: tenantUser } = await supabase
              .from("tenant_users")
              .select("role")
              .eq("user_id", user.id)
              .eq("tenant_id", firstProperty.tenant_id)
              .single();
              
            if (tenantUser) {
              userRole = tenantUser.role;
            }
          }
          
          const tenant = {
            id: userRole === 'owner' ? `owner-${user.id}` : tenantId,
            user_id: user.id,
            role: userRole,
            tenant_id: tenantId,
            tenant: { id: tenantId, name: userRole === 'owner' ? 'Property Owner' : 'Tenant Member' }
          };

          setUserTenants([tenant]);
          setCurrentTenant(tenant);
          setUserProperties(allProperties);
          setCurrentProperty(firstProperty);

          console.log("✅ Set up with complex query result:", {
            tenant,
            property: firstProperty
          });
        } else {
          throw new Error("No properties found");
        }

      } catch (error: any) {
        console.error("❌ Error loading user data:", error);
        setError(error?.message || "Failed to load user data");
        setUserTenants([]);
        setUserProperties([]);
        setCurrentTenant(null);
        setCurrentProperty(null);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [user?.id]);

  // ✅ Enhanced currentTenant with proper structure
  const enhancedCurrentTenant = useMemo(() => {
    if (!currentProperty || !currentTenant) {
      console.log("🔍 No enhanced tenant: missing property or tenant", {
        hasProperty: !!currentProperty,
        hasTenant: !!currentTenant
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
    
    console.log("✅ Enhanced tenant:", enhanced);
    return enhanced;
  }, [currentProperty, currentTenant]);

  // ✅ Property management methods
  const switchProperty = useCallback(async (propertyId: string) => {
    const property = userProperties.find((p) => p.id === propertyId);
    if (property) {
      setCurrentProperty(property);
      localStorage.setItem("currentPropertyId", propertyId);
      console.log("✅ Switched to property:", property.name);
    }
  }, [userProperties]);

  const updateProperty = useCallback(async (propertyId: string, updates: any) => {
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
  }, []);

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

  const updateCurrentProperty = useCallback(async (propertyId: string, updates: Partial<any>) => {
    setCurrentProperty(prev => 
      prev?.id === propertyId ? { ...prev, ...updates } : prev
    );
    setUserProperties(prev => prev.map(prop => 
      prop.id === propertyId ? { ...prop, ...updates } : prop
    ));
  }, []);

  const value = useMemo(() => ({
    currentProperty,
    currentTenant: enhancedCurrentTenant,
    userProperties,
    userTenants,
    loading,
    error,
    setCurrentProperty,
    setCurrentTenant,
    switchProperty,
    updateProperty,
    refreshProperty,
    updateCurrentProperty,
  }), [
    currentProperty,
    enhancedCurrentTenant,
    userProperties,
    userTenants,
    loading,
    error,
    switchProperty,
    updateProperty,
    refreshProperty,
    updateCurrentProperty,
  ]);

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
