"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import { supabase } from "@/lib/supabase";
import { Building, MapPin, Phone, Edit } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import StandardCard from "@/components/ui/StandardCard";
import GoogleMapComponent from "@/components/GoogleMapComponent";
import { PropertyGuard } from "@/components/ui/PropertyGuard";
import Image from "next/image";
import { Database } from "@/lib/database.types";

// Use the actual database type instead of custom interface
type Property = Database["public"]["Tables"]["properties"]["Row"];

interface PropertyStats {
  totalReservations: number;
  totalTasks: number;
  totalManualItems: number;
  totalInventoryItems: number;
  lastActivity: string;
}

const getImageUrl = (imagePath: string | null) => {
  if (!imagePath) return "/images/default-property.jpg";

  // If it's already a full URL, return it
  if (imagePath.startsWith("http")) return imagePath;

  // Get public URL from Supabase Storage
  const { data } = supabase.storage
    .from("property-images")
    .getPublicUrl(imagePath);

  return data.publicUrl;
};

export default function PropertyDetailPage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const { currentProperty, setCurrentProperty, userProperties } = useProperty(); // ✅ Use context
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Find the property from context instead of fetching
  const property = userProperties.find((p) => p.id === id) || null;

  useEffect(() => {
    if (!property) {
      setError("Property not found");
      return;
    }

    // Only fetch stats, not the property itself
    async function fetchPropertyStats() {
      try {
        const [reservations, tasks, manualSections, inventory] =
          await Promise.all([
            supabase
              .from("reservations")
              .select("id", { count: "exact" })
              .eq("property_id", id),
            supabase
              .from("tasks")
              .select("id", { count: "exact" })
              .eq("property_id", id),
            supabase
              .from("manual_sections")
              .select("id", { count: "exact" })
              .eq("property_id", id),
            supabase
              .from("inventory")
              .select("id, name, quantity")
              .eq("property_id", id),
          ]);

        setStats({
          totalReservations: reservations.count || 0,
          totalTasks: tasks.count || 0,
          totalManualItems: manualSections.count || 0,
          totalInventoryItems: inventory.count || 0,
          lastActivity: property?.updated_at || new Date().toISOString(),
        });
      } catch (err) {
        console.error("Error fetching property stats:", err);
        setError(err instanceof Error ? err.message : "Failed to load stats");
      }
    }

    fetchPropertyStats();
  }, [id, property]);

  const handleSetAsCurrent = async () => {
    if (property) {
      try {
        setCurrentProperty(property);
        toast.success(`${property.name} is now your active property`);
      } catch (error) {
        toast.error("Failed to set as current property");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Auth will redirect
  }

  // 🛡️ GUARD CLAUSE - Fixed
  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  const isCurrentProperty = currentProperty?.id === property?.id;

  return (
    <PropertyGuard>
      <div className="p-6 min-h-screen bg-gray-50">
        <Header />
        <PageContainer>
          <div className="space-y-6">
            <StandardCard
              title="Property Information"
              subtitle="View and manage property details"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Building className="h-6 w-6 text-blue-600" />
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        {property.name}
                      </h1>
                      <p className="text-gray-600">Property Details</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {!isCurrentProperty && (
                      <button
                        onClick={handleSetAsCurrent}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Set as Current
                      </button>
                    )}
                    <Link
                      href={`/properties/${property.id}/edit`}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </div>
                </div>

                {/* Current Property Badge */}
                {isCurrentProperty && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-green-700 font-medium">
                        This is your currently active property
                      </span>
                    </div>
                  </div>
                )}

                {/* Property Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Property Image - Fixed to use correct field */}
                  <div>
                    {property.header_image_url && (
                      <Image
                        src={getImageUrl(property.header_image_url)}
                        alt={property.name}
                        width={400}
                        height={300}
                        className="w-full h-48 object-cover rounded-lg"
                        priority
                      />
                    )}
                  </div>

                  {/* Property Information - Fixed to use correct fields */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Location
                      </h3>
                      {property.address ? (
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                          <div>
                            <p className="text-gray-900">{property.address}</p>
                            {(property.city || property.state) && (
                              <p className="text-gray-600">
                                {property.city}
                                {property.city && property.state && ", "}
                                {property.state} {property.zip}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">
                          No address provided
                        </p>
                      )}
                    </div>

                    {property.description && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Description
                        </h3>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {property.description}
                        </p>
                      </div>
                    )}

                    {/* Property Type & Details */}
                    {property.property_type && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Property Type
                        </h3>
                        <p className="text-gray-700">
                          {property.property_type}
                        </p>
                      </div>
                    )}

                    {/* Bedrooms & Bathrooms */}
                    {(property.bedrooms || property.bathrooms) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          {property.bedrooms && (
                            <p className="text-gray-700">
                              Bedrooms: {property.bedrooms}
                            </p>
                          )}
                          {property.bathrooms && (
                            <p className="text-gray-700">
                              Bathrooms: {property.bathrooms}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </StandardCard>

            {/* Property Location - Google Map */}
            {property?.latitude && property?.longitude && (
              <StandardCard title="Location">
                <div className="h-64 w-full">
                  <GoogleMapComponent
                    latitude={property.latitude}
                    longitude={property.longitude}
                    address={property.address || property.name}
                    zoom={16}
                    className="border border-gray-200 rounded-lg"
                  />
                </div>
              </StandardCard>
            )}
          </div>
        </PageContainer>
      </div>
    </PropertyGuard>
  );
}
