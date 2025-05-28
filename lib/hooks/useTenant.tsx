"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "../supabase";

interface TenantContextType {
  currentTenant: any;
  userTenants: any[];
  loading: boolean;
  error: string | null;
  switchTenant: (tenantId: string) => Promise<void>;
  createTenant: (tenantData: any) => Promise<void>;
  updateTenant: (tenantId: string, updates: any) => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentTenant, setCurrentTenant] = useState(null);
  const [userTenants, setUserTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const switchTenant = async (tenantId: string) => {
    const tenant = userTenants.find((t) => t.id === tenantId);
    if (tenant) {
      setCurrentTenant(tenant);
      if (typeof window !== "undefined") {
        localStorage.setItem("currentTenantId", tenantId);
      }
      console.log("Switched to tenant:", tenant.name);
    }
  };

  const createTenant = async (tenantData: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tenants")
        .insert([tenantData])
        .select();

      if (error) throw error;

      const newTenant = data[0];
      setUserTenants((prev) => [...prev, newTenant]);
      setCurrentTenant(newTenant);
      localStorage.setItem("currentTenantId", newTenant.id);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTenant = async (tenantId: string, updates: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tenants")
        .update(updates)
        .eq("id", tenantId)
        .select();

      if (error) throw error;

      const updatedTenant = data[0];
      setUserTenants((prev) =>
        prev.map((t) => (t.id === tenantId ? updatedTenant : t))
      );
      if (currentTenant?.id === tenantId) {
        setCurrentTenant(updatedTenant);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      // Load user tenants
      setLoading(false);
    }
  }, [user]);

  const value = {
    currentTenant,
    userTenants,
    loading,
    error,
    switchTenant,
    createTenant,
    updateTenant,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
