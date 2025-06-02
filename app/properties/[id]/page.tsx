"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import {
  Building,
  MapPin,
  Edit,
  Calendar,
  Users,
  CheckSquare,
  BookOpen,
  Package,
  Settings,
  Phone,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

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

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { currentProperty, setCurrentProperty } = useProperty();
  const [property, setProperty] = useState<Property | null>(null);
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPropertyDetails() {
      if (!id || !user) return;

      try {
        setLoading(true);

        // Fetch property details
        const { data: propertyData, error: propertyError } = await supabase
          .from("properties")
          .select("*")
          .eq("id", id)
          .single();

        if (propertyError) throw propertyError;
        setProperty(propertyData);

        // Fetch property statistics in parallel
        const [reservations, tasks, manualSections, inventory] = await Promise.all([
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
            .from("inventory_items")
            .select("id", { count: "exact" })
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
        setError(err instanceof Error ? err.message : "Failed to load property");
      } finally {
        setLoading(false);
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
      <StandardPageLayout
        title="Loading Property..."
        headerIcon={<Building className="h-6 w-6 text-blue-600" />}
      >
        <StandardCard>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading property details...</span>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (error || !property) {
    return (
      <StandardPageLayout
        title="Property Not Found"
        headerIcon={<Building className="h-6 w-6 text-red-600" />}
      >
        <StandardCard>
          <div className="text-center py-8">
            <Building className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Property Not Found
            </h3>
            <p className="text-gray-500 mb-4">
              {error || "The requested property could not be found."}
            </p>
            <Link
              href="/account/properties"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Properties
            </Link>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  const isCurrentProperty = currentProperty?.id === property.id;

  return (
    <StandardPageLayout
      title={property.name}
      subtitle="Property Details"
      headerIcon={<Building className="h-6 w-6 text-blue-600" />}
      breadcrumb={[
        { label: "Account", href: "/account" },
        { label: "Properties", href: "/account/properties" },
        { label: property.name },
      ]}
      headerActions={
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
      }
    >
      <div className="space-y-6">
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
        <StandardCard title="Property Overview">
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
                  <p className="text-gray-700 whitespace-pre-wrap">{property.description}</p>
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
        </StandardCard>

        {/* Property Statistics */}
        {stats && (
          <StandardCard title="Property Overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Link
                href="/calendar"
                className="text-center hover:bg-gray-50 p-4 rounded-lg transition-colors group"
              >
                <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalReservations}
                </div>
                <div className="text-sm text-gray-600">Reservations</div>
              </Link>

              <Link
                href="/tasks"
                className="text-center hover:bg-gray-50 p-4 rounded-lg transition-colors group"
              >
                <CheckSquare className="h-8 w-8 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalTasks}
                </div>
                <div className="text-sm text-gray-600">Tasks</div>
              </Link>

              <Link
                href="/manual"
                className="text-center hover:bg-gray-50 p-4 rounded-lg transition-colors group"
              >
                <BookOpen className="h-8 w-8 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalManualItems}
                </div>
                <div className="text-sm text-gray-600">Manual Sections</div>
              </Link>

              <Link
                href="/inventory"
                className="text-center hover:bg-gray-50 p-4 rounded-lg transition-colors group"
              >
                <Package className="h-8 w-8 text-orange-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalInventoryItems}
                </div>
                <div className="text-sm text-gray-600">Inventory Items</div>
              </Link>
            </div>
          </StandardCard>
        )}

        {/* Quick Actions */}
        <StandardCard title="Quick Actions">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/calendar"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors group"
            >
              <Calendar className="h-6 w-6 text-blue-600 mr-3 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-medium text-gray-900">Manage Calendar</div>
                <div className="text-sm text-gray-500">View and manage reservations</div>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
            </Link>

            <Link
              href="/tasks"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-green-300 transition-colors group"
            >
              <CheckSquare className="h-6 w-6 text-green-600 mr-3 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-medium text-gray-900">Manage Tasks</div>
                <div className="text-sm text-gray-500">Create and track tasks</div>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
            </Link>

            <Link
              href="/manual"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-purple-300 transition-colors group"
            >
              <BookOpen className="h-6 w-6 text-purple-600 mr-3 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-medium text-gray-900">Property Manual</div>
                <div className="text-sm text-gray-500">Instructions and guides</div>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
            </Link>

            <Link
              href="/inventory"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-orange-300 transition-colors group"
            >
              <Package className="h-6 w-6 text-orange-600 mr-3 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-medium text-gray-900">Inventory</div>
                <div className="text-sm text-gray-500">Track items and supplies</div>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
            </Link>

            <Link
              href="/contacts"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-teal-300 transition-colors group"
            >
              <Users className="h-6 w-6 text-teal-600 mr-3 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-medium text-gray-900">Contacts</div>
                <div className="text-sm text-gray-500">Manage property contacts</div>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
            </Link>

            <Link
              href={`/account/properties/${property.id}/settings`}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors group"
            >
              <Settings className="h-6 w-6 text-gray-600 mr-3 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-medium text-gray-900">Settings</div>
                <div className="text-sm text-gray-500">Property configuration</div>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
            </Link>
          </div>
        </StandardCard>
      </div>
    </StandardPageLayout>
  );
}
