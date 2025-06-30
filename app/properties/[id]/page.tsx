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
            .order("created_at", { ascending: false }),

          supabase
            .from("inventory")
            .select("id")
            .eq("property_id", property_id),

          supabase
            .from("manual_sections")
            .select("id")
            .eq("property_id", property_id),

          supabase
            .from("manual_items")
            .select("id")
            .eq("property_id", property_id),
        ]);

        // Check and log results
        roomsResult.status === "fulfilled" &&
          console.log("📦 Rooms result:", roomsResult.value);
        reservationsResult.status === "fulfilled" &&
          console.log("📅 Reservations result:", reservationsResult.value);
        inventoryResult.status === "fulfilled" &&
          console.log("📦 Inventory result:", inventoryResult.value);
        manualSectionsResult.status === "fulfilled" &&
          console.log("📚 Manual sections result:", manualSectionsResult.value);
        manualItemsResult.status === "fulfilled" &&
          console.log("📝 Manual items result:", manualItemsResult.value);

        // Calculate stats
        const total_rooms = roomsResult.status === "fulfilled" ? roomsResult.value.length : 0;
        const total_reservations = reservationsResult.status === "fulfilled" ? reservationsResult.value.length : 0;
        const total_inventory = inventoryResult.status === "fulfilled" ? inventoryResult.value.length : 0;
        const total_manual_sections = manualSectionsResult.status === "fulfilled" ? manualSectionsResult.value.length : 0;
        const total_manual_items = manualItemsResult.status === "fulfilled" ? manualItemsResult.value.length : 0;

        // Calculate average rating
        let average_rating = 0;
        if (total_reservations > 0) {
          const ratingsSum = reservationsResult.value.reduce((sum, reservation) => {
            return sum + (reservation.rating || 0);
          }, 0);
          average_rating = ratingsSum / total_reservations;
        }

        // Update property state
        setProperty((prev) => {
          if (!prev) return null;

          return {
            ...prev,
            stats: {
              total_rooms,
              total_reservations,
              total_inventory,
              average_rating,
              total_manual_sections,
            },
          };
        });

        console.log("✅ Property details fetched successfully");
      } catch (error) {
        console.error("Error fetching property details:", error);
        setError("Failed to fetch property details");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [property_id, user?.id, mountedRef, userProperty]
  );

  // Refresh property details on demand
  const handleRefresh = () => {
    fetchPropertyDetails(true);
  };

  // Navigate to property edit page
  const handleEditProperty = () => {
    if (!property) return;
    setCurrentProperty(property);
    router.push(`/properties/${property.id}/edit`);
  };

  // Effect to fetch property details on mount and when property_id changes
  useEffect(() => {
    if (property_id) {
      fetchPropertyDetails();
    }
  }, [property_id, fetchPropertyDetails]);

  // Log current property state
  useEffect(() => {
    if (property) {
      console.log("🏠 Current property state:", property);
    }
  }, [property]);

  // Render loading or error state
  if (loading || isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-200"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Oops! Something went wrong.
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-500 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  return (
    <div className="p-4">
      {/* Property header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            {property.name}
          </h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-500">
              <MapPin className="w-5 h-5 mr-1" />
              <span>{property.address}</span>
            </div>
            <div className="flex items-center text-gray-500">
              <Calendar className="w-5 h-5 mr-1" />
              <span>
                {new Date(property.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={handleEditProperty}
            className="px-4 py-2 bg-green-600 text-white rounded-md shadow-md hover:bg-green-500 transition-colors mr-2"
          >
            <Edit className="w-5 h-5 mr-1 inline-block" />
            Edit Property
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-500 transition-colors"
          >
            <RefreshCw className="w-5 h-5 mr-1 inline-block" />
            Refresh
          </button>
        </div>
      </div>

      {/* Property stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center">
            <Building className="w-6 h-6 text-blue-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">Property Stats</h2>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-gray-600">
              <span>Total Rooms</span>
              <span className="font-medium text-gray-800">
                {property.stats?.total_rooms || 0}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total Reservations</span>
              <span className="font-medium text-gray-800">
                {property.stats?.total_reservations || 0}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total Inventory</span>
              <span className="font-medium text-gray-800">
                {property.stats?.total_inventory || 0}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Average Rating</span>
              <span className="font-medium text-gray-800">
                {property.stats?.average_rating?.toFixed(1) || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Manual sections and items */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center">
            <BookOpen className="w-6 h-6 text-green-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">
              Manual Sections & Items
            </h2>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-gray-600">
              <span>Total Manual Sections</span>
              <span className="font-medium text-gray-800">
                {property.stats?.total_manual_sections || 0}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total Manual Items</span>
              <span className="font-medium text-gray-800">
                {property.stats?.total_manual_items || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white p-4 rounded-lg shadow-md col-span-1 sm:col-span-2 lg:col-span-4">
          <div className="flex items-center">
            <Clock className="w-6 h-6 text-red-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">
              Recent Activity
            </h2>
          </div>
          <div className="mt-2">
            {property.recent_activity && property.recent_activity.length > 0 ? (
              <ul className="space-y-2">
                {property.recent_activity.map((activity) => (
                  <li
                    key={activity.id}
                    className="flex justify-between text-gray-600"
                  >
                    <span>
                      {activity.type === "reservation" && "Reservation"}
                      {activity.type === "inventory" && "Inventory Update"}
                      {activity.type === "manual" && "Manual Update"}
                      {activity.type === "user" && "User Activity"}
                    </span>
                    <span className="font-medium text-gray-800">
                      {new Date(activity.timestamp).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">
                No recent activity found for this property.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Property description and amenities */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-center">
          <Info className="w-6 h-6 text-purple-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-800">
            Property Description
          </h2>
        </div>
        <div className="mt-2">
          <p className="text-gray-700">{property.description}</p>
        </div>
      </div>

      {/* Amenities */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-center">
          <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-800">
            Amenities
          </h2>
        </div>
        <div className="mt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {property.amenities && property.amenities.length > 0 ? (
              property.amenities.map((amenity) => {
                const Icon = AMENITY_ICONS[amenity as keyof typeof AMENITY_ICONS];
                return (
                  <div
                    key={amenity}
                    className="flex items-center text-gray-700"
                  >