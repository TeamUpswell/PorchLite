"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import {
  User as UserIcon,
  Settings as CogIcon,
  Users as UserGroupIcon,
  LogOut,
  ChevronDown,
  Home as HomeIcon,
  Calendar as CalendarIcon,
  Building,
  MapPin,
  Phone,
  Calendar,
  CheckSquare,
  BookOpen,
  Package,
  Users,
  ExternalLink,
  Edit,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import StandardCard from "@/components/ui/StandardCard";
import GoogleMapComponent from "@/components/GoogleMapComponent";

interface Property {
  id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  main_photo_url?: string;
  contact_info?: string;
  created_at: string;
  updated_at: string;
}

interface PropertyStats {
  totalReservations: number;
  totalTasks: number;
  totalManualItems: number;
  totalInventoryItems: number;
  lastActivity: string;
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const { currentProperty, setCurrentProperty } = useProperty();
  const [property, setProperty] = useState<Property | null>(null);
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPropertyDetails() {
      if (!id || !user) return;

      try {
        // Fetch property details
        const { data: propertyData, error: propertyError } = await supabase
          .from("properties")
          .select("*")
          .eq("id", id)
          .single();

        if (propertyError) throw propertyError;
        setProperty(propertyData);

        // Fetch property statistics in parallel
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
          lastActivity: propertyData.updated_at,
        });
      } catch (err) {
        console.error("Error fetching property details:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load property"
        );
      }
    }

    fetchPropertyDetails();
  }, [id, user]);

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

  const isCurrentProperty = currentProperty?.id === property?.id;

  return (
    <div className="p-6">
      <Header title="Property Details" />
      <PageContainer>
        <div className="space-y-6">
          <StandardCard
            title="Property Information"
            subtitle="View and manage property details"
          >
            {/* Move all existing property detail content here */}
            <div className="space-y-6">
              {/* Your existing property detail JSX goes here */}
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
                {/* Property Image */}
                <div>
                  {property.main_photo_url ? (
                    <img
                      src={property.main_photo_url}
                      alt={property.name}
                      className="w-full h-64 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = "/images/placeholder-property.jpg";
                      }}
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Building className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No image available</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Property Information */}
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
                      <p className="text-gray-500 italic">No address provided</p>
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

                  {property.contact_info && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Contact Information
                      </h3>
                      <div className="flex items-start">
                        <Phone className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                        <p className="text-gray-700">{property.contact_info}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </StandardCard>

          {/* Property Location - Google Map */}
          {property.latitude && property.longitude && (
            <StandardCard title="Location">
              <div className="h-64 w-full">
                <GoogleMapComponent
                  latitude={property.latitude}
                  longitude={property.longitude}
                  address={property.address}
                  zoom={16}
                  className="border border-gray-200 rounded-lg"
                />
              </div>
            </StandardCard>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
