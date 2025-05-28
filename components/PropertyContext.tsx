"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { PropertyFormData } from "@/types";
import { getMainProperty } from "@/lib/propertyService";

type PropertyContextType = {
  property: PropertyFormData | null;
  loading: boolean;
  error: Error | null;
  refreshProperty: () => Promise<void>;
};

const PropertyContext = createContext<PropertyContextType | undefined>(
  undefined
);

export function PropertyProvider({ children }: { children: ReactNode }) {
  const [property, setProperty] = useState<PropertyFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function refreshProperty() {
    try {
      setLoading(true);
      setError(null);
      const data = await getMainProperty();
      setProperty(data);
    } catch (err) {
      console.error("Failed to load property:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshProperty();
  }, []);

  return (
    <PropertyContext.Provider
      value={{ property, loading, error, refreshProperty }}
    >
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
