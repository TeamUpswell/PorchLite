"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Building,
  MapPin,
  Calendar,
  Users,
  Package,
  Star,
  Edit,
  ArrowLeft,
  Phone,
  Mail,
  Bed,
  Bath,
  Wifi,
  Car,
  AlertTriangle,
  RefreshCw,
  Home,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

type Property = Database["public"]["Tables"]["properties"]["Row"];

interface PropertyStats {
  total_rooms: number;
  total_reservations: number;
  total_inventory: number;
  average_rating: number;
  total_manual_sections: number;
}

interface PropertyDetails extends Property {
  stats?: PropertyStats;
  amenities?: string[];
  recent_activity?: Array<{
    id: string;
    type: "reservation" | "inventory" | "manual" | "user";
    description: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
}

const AMENITY_ICONS = {
  Wifi: Wifi,
  Parking: Car,
  Kitchen: Package,
  Laundry: Bath,
  Pool: Bath,
  Gym: Activity,
  "Air Conditioning": Activity,
  Heating: Activity,
} as const;

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const property_id = params.id as string;

  const { user, loading: authLoading } = useAuth();
  const {
    currentProperty,
    userProperties,
    setCurrentProperty,
    loading: propertyLoading,
  } = useProperty();

  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Refs for optimization
  const mountedRef = useRef(true);
  const hasLoadedRef = useRef(false);

  // Component cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Memoized loading state
  const isInitializing = useMemo(() => {
    return authLoading || propertyLoading;
  }, [authLoading, propertyLoading]);

  // Check if current property matches
  const isCurrentProperty = useMemo(() => {
    return currentProperty?.id === property_id;
  }, [currentProperty?.id, property_id]);

  // Find property in user's properties
  const userProperty = useMemo(() => {
    return userProperties.find((p) => p.id === property_id);
  }, [userProperties, property_id]);

  // Fetch property details
  const fetchPropertyDetails = useCallback(
    async (showRefreshFeedback = false) => {
      if (!property_id || !user?.id || !mountedRef.current) {
        return;
      }

      try {
        if (showRefreshFeedback) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        console.log("🏠 Fetching property details for:", property_id);

        // First check if user has access to this property
        if (!userProperty) {
          console.log("❌ Property not found in user's properties");
          setError("Property not found or you don't have access to it");
          return;
        }

        // Fetch additional stats in parallel
        const [
          roomsResult,
          reservationsResult,
          inventoryResult,
          manualSectionsResult,
          manualItemsResult,
        ] = await Promise.allSettled([
          supabase
            .from("cleaning_rooms")
            .select("id")
            .eq("property_id", property_id),

          supabase
            .from("reservations")
            .select("id, rating, created_at")
            .eq("property_id", property_id)
            .order("created_at",