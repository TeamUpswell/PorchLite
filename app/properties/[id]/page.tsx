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

import StandardPageLayout from "@/components/layout/StandardPageLayout";
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
            .select("id, name, created_at")
            .eq("property_id", property_id)
            .eq("is_active", true)
            .order("created_at", { ascending: false }),

          supabase
            .from("manual_sections")
            .select("id, title, created_at")
            .eq("property_id", property_id)
            .order("created_at", { ascending: false }),

          supabase
            .from("manual_items")
            .select("id, title, created_at, section_id")
            .eq("property_id", property_id)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        if (!mountedRef.current) {
          console.log("⚠️ Component unmounted, aborting");
          return;
        }

        // Calculate stats
        const rooms =
          roomsResult.status === "fulfilled"
            ? roomsResult.value.data || []
            : [];
        const reservations =
          reservationsResult.status === "fulfilled"
            ? reservationsResult.value.data || []
            : [];
        const inventory =
          inventoryResult.status === "fulfilled"
            ? inventoryResult.value.data || []
            : [];
        const manualSections =
          manualSectionsResult.status === "fulfilled"
            ? manualSectionsResult.value.data || []
            : [];
        const manualItems =
          manualItemsResult.status === "fulfilled"
            ? manualItemsResult.value.data || []
            : [];

        const stats: PropertyStats = {
          total_rooms: rooms.length,
          total_reservations: reservations.length,
          total_inventory: inventory.length,
          total_manual_sections: manualSections.length,
          average_rating:
            reservations.length > 0
              ? reservations
                  .filter((r) => r.rating !== null)
                  .reduce(
                    (sum, r, _, arr) => sum + (r.rating || 0) / arr.length,
                    0
                  )
              : 0,
        };

        // Generate recent activity
        const recentActivity: PropertyDetails["recent_activity"] = [];

        // Add recent reservations
        reservations.slice(0, 2).forEach((reservation) => {
          recentActivity.push({
            id: `reservation-${reservation.id}`,
            type: "reservation",
            description: "New reservation created",
            timestamp: reservation.created_at,
            metadata: { id: reservation.id },
          });
        });

        // Add recent inventory
        inventory.slice(0, 2).forEach((item) => {
          recentActivity.push({
            id: `inventory-${item.id}`,
            type: "inventory",
            description: `Inventory item "${item.name}" added`,
            timestamp: item.created_at,
            metadata: { id: item.id, name: item.name },
          });
        });

        // Add recent manual items
        manualItems.slice(0, 2).forEach((item) => {
          recentActivity.push({
            id: `manual-${item.id}`,
            type: "manual",
            description: `Manual item "${item.title}" created`,
            timestamp: item.created_at,
            metadata: {
              id: item.id,
              title: item.title,
              section_id: item.section_id,
            },
          });
        });

        // Sort by timestamp and take most recent
        recentActivity.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Mock amenities based on property type or add to database later
        const amenities = ["Wifi", "Parking", "Kitchen", "Laundry"];

        const propertyDetails: PropertyDetails = {
          ...userProperty,
          stats,
          amenities,
          recent_activity: recentActivity.slice(0, 5),
        };

        console.log("✅ Property details loaded successfully");
        setProperty(propertyDetails);

        if (showRefreshFeedback) {
          toast.success("Property details refreshed");
        }
      } catch (error) {
        console.error("❌ Error fetching property details:", error);
        if (mountedRef.current) {
          const errorMessage = "Failed to load property details";
          setError(errorMessage);

          if (showRefreshFeedback) {
            toast.error(errorMessage);
          }
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [property_id, user?.id, userProperty]
  );

  // Main loading effect
  useEffect(() => {
    if (isInitializing) {
      return;
    }

    if (!user?.id) {
      console.log("⏳ Waiting for user...");
      if (mountedRef.current) {
        setLoading(false);
      }
      return;
    }

    if (!property_id) {
      console.log("⚠️ No property ID provided");
      if (mountedRef.current) {
        setLoading(false);
        setError("No property ID provided");
      }
      return;
    }

    if (!hasLoadedRef.current) {
      console.log("🔄 Loading property details for the first time");
      hasLoadedRef.current = true;
      fetchPropertyDetails();
    }
  }, [user?.id, property_id, isInitializing, fetchPropertyDetails]);

  // Set as current property handler
  const handleSetAsCurrent = useCallback(() => {
    if (property && !isCurrentProperty) {
      setCurrentProperty(property);
      toast.success(`Switched to ${property.name}`);
    }
  }, [property, isCurrentProperty, setCurrentProperty]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    if (!refreshing) {
      fetchPropertyDetails(true);
    }
  }, [refreshing, fetchPropertyDetails]);

  // Retry handler
  const handleRetry = useCallback(() => {
    if (property_id && user?.id) {
      hasLoadedRef.current = false;
      setError(null);
      fetchPropertyDetails();
    }
  }, [property_id, user?.id, fetchPropertyDetails]);

  // Navigation handler
  const handleBack = useCallback(() => {
    router.push("/properties");
  }, [router]);

  // Loading state
  if (isInitializing || loading) {
    return (
      <StandardPageLayout
        title="Property Details"
        subtitle="Loading property information..."
      >
        <StandardCard>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600">
                {isInitializing
                  ? "⏳ Initializing..."
                  : "🏠 Loading property details..."}
              </p>
            </div>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (!user) {
    return null; // Auth will redirect
  }

  // Error state
  if (error) {
    return (
      <StandardPageLayout
        title="Property Details"
        subtitle="Error loading property"
      >
        <StandardCard>
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {error.includes("not found")
                ? "Property Not Found"
                : "Error Loading Property"}
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
              <button
                onClick={handleBack}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Properties
              </button>
            </div>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (!property) {
    return (
      <StandardPageLayout
        title="Property Details"
        subtitle="Property not found"
      >
        <StandardCard>
          <div className="text-center py-8">
            <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Property Not Found
            </h3>
            <p className="text-gray-600 mb-4">
              The property you're looking for doesn't exist or you don't have
              access to it.
            </p>
            <button
              onClick={handleBack}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Properties
            </button>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout
      title={property.name}
      subtitle={`Property details • ${
        property.address || "No address specified"
      }`}
      breadcrumb={[
        { label: "Properties", href: "/properties" },
        { label: property.name },
      ]}
    >
      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw
                className={`h-3 w-3 mr-1 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            {!isCurrentProperty && (
              <button
                onClick={handleSetAsCurrent}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Set as Current
              </button>
            )}
            <Link
              href={`/properties/${property.id}/edit`}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </div>
        </div>

        {/* Property Header */}
        <StandardCard
          headerActions={
            <div className="flex items-center gap-2">
              {isCurrentProperty && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Home className="h-3 w-3 mr-1" />
                  Current Property
                </span>
              )}
            </div>
          }
        >
          <div className="flex items-start space-x-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <Building className="h-12 w-12 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {property.name}
              </h1>

              {property.address && (
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="break-words">
                    {property.address}
                    {property.city && `, ${property.city}`}
                    {property.state && `, ${property.state}`}
                    {property.zip && ` ${property.zip}`}
                  </span>
                </div>
              )}

              {property.description && (
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {property.description}
                </p>
              )}

              <div className="flex flex-wrap items-center text-gray-500 text-sm gap-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    Created{" "}
                    {new Date(property.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {property.updated_at !== property.created_at && (
                  <div className="flex items-center">
                    <span>
                      Updated{" "}
                      {new Date(property.updated_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </StandardCard>

        {/* Property Stats */}
        <StandardCard>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Property Overview
            </h3>
            <p className="text-sm text-gray-500">Key metrics and information</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Bed className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {property.stats?.total_rooms || 0}
              </div>
              <p className="text-gray-600 text-sm">Rooms</p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600 mb-1">
                {property.stats?.total_reservations || 0}
              </div>
              <p className="text-gray-600 text-sm">Reservations</p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Package className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {property.stats?.total_inventory || 0}
              </div>
              <p className="text-gray-600 text-sm">Inventory Items</p>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Building className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {property.stats?.total_manual_sections || 0}
              </div>
              <p className="text-gray-600 text-sm">Manual Sections</p>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {property.stats?.average_rating
                  ? property.stats.average_rating.toFixed(1)
                  : "N/A"}
              </div>
              <p className="text-gray-600 text-sm">Avg Rating</p>
            </div>
          </div>
        </StandardCard>

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <StandardCard>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Amenities
              </h3>
              <p className="text-sm text-gray-500">
                Available features and services
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {property.amenities.map((amenity, index) => {
                const IconComponent =
                  AMENITY_ICONS[amenity as keyof typeof AMENITY_ICONS] ||
                  Package;
                return (
                  <div
                    key={index}
                    className="flex items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <IconComponent className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">
                      {amenity}
                    </span>
                  </div>
                );
              })}
            </div>
          </StandardCard>
        )}

        {/* Recent Activity */}
        {property.recent_activity && property.recent_activity.length > 0 && (
          <StandardCard>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Recent Activity
              </h3>
              <p className="text-sm text-gray-500">
                Latest updates and changes
              </p>
            </div>
            <div className="space-y-4">
              {property.recent_activity.map((activity) => {
                const getActivityIcon = () => {
                  switch (activity.type) {
                    case "reservation":
                      return Calendar;
                    case "inventory":
                      return Package;
                    case "manual":
                      return Building;
                    case "user":
                      return Users;
                    default:
                      return Activity;
                  }
                };

                const getActivityColor = () => {
                  switch (activity.type) {
                    case "reservation":
                      return "text-blue-600 bg-blue-100";
                    case "inventory":
                      return "text-green-600 bg-green-100";
                    case "manual":
                      return "text-purple-600 bg-purple-100";
                    case "user":
                      return "text-orange-600 bg-orange-100";
                    default:
                      return "text-gray-600 bg-gray-100";
                  }
                };

                const ActivityIcon = getActivityIcon();
                const colorClass = getActivityColor();

                return (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className={`p-1 rounded-full ${colorClass}`}>
                      <ActivityIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </StandardCard>
        )}

        {/* Quick Actions */}
        <StandardCard>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Quick Actions
            </h3>
            <p className="text-sm text-gray-500">Manage your property</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              href={`/properties/${property.id}/rooms`}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow group"
            >
              <Bed className="h-8 w-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-gray-900 mb-1">Manage Rooms</h3>
              <p className="text-sm text-gray-600">
                View and manage rooms for this property
              </p>
            </Link>

            <Link
              href="/inventory"
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow group"
            >
              <Package className="h-8 w-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-gray-900 mb-1">View Inventory</h3>
              <p className="text-sm text-gray-600">
                Check inventory items for this property
              </p>
            </Link>

            <Link
              href="/reservations"
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow group"
            >
              <Calendar className="h-8 w-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-gray-900 mb-1">
                View Reservations
              </h3>
              <p className="text-sm text-gray-600">
                See upcoming and past reservations
              </p>
            </Link>

            <Link
              href="/manual"
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow group"
            >
              <Building className="h-8 w-8 text-orange-600 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-gray-900 mb-1">
                Property Manual
              </h3>
              <p className="text-sm text-gray-600">
                Access property documentation and guides
              </p>
            </Link>
          </div>
        </StandardCard>
      </div>
    </StandardPageLayout>
  );
}
