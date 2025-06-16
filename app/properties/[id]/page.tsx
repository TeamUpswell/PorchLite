"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import Link from "next/link";

import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

type Property = Database["public"]["Tables"]["properties"]["Row"];

interface PropertyDetails extends Property {
  total_rooms?: number;
  total_reservations?: number;
  total_inventory?: number;
  average_rating?: number;
  amenities?: string[];
  recent_activity?: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const { user, loading: authLoading } = useAuth();
  const { currentProperty, userProperties, setCurrentProperty } = useProperty();

  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPropertyDetails() {
      if (!propertyId || !user) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch the property
        const { data: propertyData, error: propertyError } = await supabase
          .from("properties")
          .select("*")
          .eq("id", propertyId)
          .single();

        if (propertyError) throw propertyError;

        // Verify user has access to this property
        if (propertyData.created_by !== user.id) {
          setError("You don't have access to this property");
          return;
        }

        // Fetch additional details in parallel
        const [roomsResult, reservationsResult, inventoryResult] =
          await Promise.allSettled([
            supabase
              .from("cleaning_rooms")
              .select("id")
              .eq("property_id", propertyId),

            supabase
              .from("reservations")
              .select("id, rating")
              .eq("property_id", propertyId),

            supabase
              .from("inventory")
              .select("id")
              .eq("property_id", propertyId)
              .eq("is_active", true),
          ]);

        // Calculate stats
        const totalRooms =
          roomsResult.status === "fulfilled"
            ? roomsResult.value.data?.length || 0
            : 0;

        const reservations =
          reservationsResult.status === "fulfilled"
            ? reservationsResult.value.data || []
            : [];
        const totalReservations = reservations.length;

        const ratings = reservations
          .map((r) => r.rating)
          .filter((rating): rating is number => rating !== null);
        const averageRating =
          ratings.length > 0
            ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
            : 0;

        const totalInventory =
          inventoryResult.status === "fulfilled"
            ? inventoryResult.value.data?.length || 0
            : 0;

        // Mock amenities and recent activity for now
        const amenities = ["Wifi", "Parking", "Kitchen", "Laundry"];
        const recentActivity = [
          {
            type: "reservation",
            description: "New reservation created",
            timestamp: new Date(
              Date.now() - 2 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            type: "inventory",
            description: "Inventory updated",
            timestamp: new Date(
              Date.now() - 5 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        ];

        setProperty({
          ...propertyData,
          total_rooms: totalRooms,
          total_reservations: totalReservations,
          total_inventory: totalInventory,
          average_rating: averageRating,
          amenities,
          recent_activity: recentActivity,
        });
      } catch (error) {
        console.error("Error fetching property details:", error);
        setError("Failed to load property details");
      } finally {
        setLoading(false);
      }
    }

    fetchPropertyDetails();
  }, [propertyId, user]);

  const handleSetAsCurrent = () => {
    if (property) {
      setCurrentProperty(property);
    }
  };

  const isCurrentProperty = currentProperty?.id === propertyId;

  if (authLoading || loading) {
    return (
      <StandardPageLayout>
        <StandardCard>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading property details...</span>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <StandardPageLayout>
        <StandardCard>
          <div className="text-center py-8">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Error Loading Property
            </h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <button
                onClick={() => router.push("/properties")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
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
      <StandardPageLayout>
        <StandardCard>
          <div className="text-center py-8">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Property Not Found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              The property you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have access to it.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push("/properties")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
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

  return (
    <StandardPageLayout>
      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/properties")}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </button>

          <div className="flex items-center space-x-2">
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
            isCurrentProperty && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Current Property
              </span>
            )
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
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{property.address}</span>
                </div>
              )}

              {property.description && (
                <p className="text-gray-600 mb-4">{property.description}</p>
              )}

              <div className="flex items-center text-gray-500 text-sm">
                <Calendar className="h-4 w-4 mr-1" />
                <span>
                  Created {new Date(property.created_at).toLocaleDateString()}
                </span>
                {property.updated_at !== property.created_at && (
                  <>
                    <span className="mx-2">•</span>
                    <span>
                      Updated{" "}
                      {new Date(property.updated_at).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </StandardCard>

        {/* Property Stats */}
        <StandardCard
          title="Property Overview"
          subtitle="Key metrics and information"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Bed className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {property.total_rooms || 0}
              </div>
              <p className="text-gray-600 text-sm">Rooms</p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600 mb-1">
                {property.total_reservations || 0}
              </div>
              <p className="text-gray-600 text-sm">Reservations</p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Package className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {property.total_inventory || 0}
              </div>
              <p className="text-gray-600 text-sm">Inventory Items</p>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {property.average_rating
                  ? property.average_rating.toFixed(1)
                  : "N/A"}
              </div>
              <p className="text-gray-600 text-sm">Avg Rating</p>
            </div>
          </div>
        </StandardCard>

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <StandardCard
            title="Amenities"
            subtitle="Available features and services"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {property.amenities.map((amenity, index) => (
                <div
                  key={index}
                  className="flex items-center p-3 bg-gray-50 rounded-lg"
                >
                  {amenity === "Wifi" && (
                    <Wifi className="h-5 w-5 text-blue-600 mr-2" />
                  )}
                  {amenity === "Parking" && (
                    <Car className="h-5 w-5 text-green-600 mr-2" />
                  )}
                  {amenity === "Kitchen" && (
                    <Package className="h-5 w-5 text-purple-600 mr-2" />
                  )}
                  {amenity === "Laundry" && (
                    <Bath className="h-5 w-5 text-orange-600 mr-2" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {amenity}
                  </span>
                </div>
              ))}
            </div>
          </StandardCard>
        )}

        {/* Recent Activity */}
        {property.recent_activity && property.recent_activity.length > 0 && (
          <StandardCard
            title="Recent Activity"
            subtitle="Latest updates and changes"
          >
            <div className="space-y-4">
              {property.recent_activity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="p-1 bg-blue-100 rounded-full">
                    {activity.type === "reservation" && (
                      <Calendar className="h-4 w-4 text-blue-600" />
                    )}
                    {activity.type === "inventory" && (
                      <Package className="h-4 w-4 text-green-600" />
                    )}
                    {activity.type === "user" && (
                      <Users className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()} at{" "}
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </StandardCard>
        )}

        {/* Quick Actions */}
        <StandardCard title="Quick Actions" subtitle="Manage your property">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
        </StandardCard>
      </div>
    </StandardPageLayout>
  );
}
