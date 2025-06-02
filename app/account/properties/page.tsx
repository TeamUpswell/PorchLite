"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { Building, Settings, MapPin, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { CreatePattern } from "@/components/ui/FloatingActionPresets";

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

export default function PropertySettingsPage() {
  const { user } = useAuth();
  const { currentTenant, userProperties, propertyLoading } = useProperty();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManageProperties = () => {
    if (!user) return false;

    const role = user.user_metadata?.role;

    const allowedRoles = ["owner", "admin", "manager"];
    return allowedRoles.includes(role?.toLowerCase());
  };

  const hasAccess = canManageProperties();

  useEffect(() => {
    if (userProperties && userProperties.length > 0) {
      setProperties(userProperties);
      setLoading(false);
    } else if (!propertyLoading) {
      setProperties([]);
      setLoading(false);
    }
  }, [userProperties, propertyLoading]);

  if (!hasAccess) {
    return (
      <StandardPageLayout
        title="Property Settings"
        headerIcon={<Building className="h-6 w-6 text-blue-600" />}
      >
        <StandardCard>
          <div className="p-8 text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Access Restricted
            </h3>
            <p className="text-gray-500 mb-4">
              You don't have permission to manage property settings.
            </p>
            <div className="text-xs text-gray-400 mt-4 p-2 bg-gray-50 rounded">
              <p>Debug: Role = {user?.user_metadata?.role || "undefined"}</p>
              <p>User ID = {user?.id || "undefined"}</p>
            </div>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  const isLoading = propertyLoading || loading;

  // ADD: Handler for add property
  const handleAddProperty = () => {
    // TODO: Implement add property modal or navigation
    console.log("Add property clicked");
  };

  return (
    <>
      <StandardPageLayout
        title="Property Settings"
        subtitle="Manage your vacation home properties"
        headerIcon={<Building className="h-6 w-6 text-blue-600" />}
      >
        <div className="space-y-6">
          {/* Header without Add Button */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white">Your Properties</h2>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <StandardCard>
              <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Loading properties...</p>
              </div>
            </StandardCard>
          ) : error ? (
            <StandardCard>
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Error Loading Properties
                </h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            </StandardCard>
          ) : properties.length > 0 ? (
            /* Properties Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <StandardCard key={property.id} className="overflow-hidden">
                  <div className="p-0">
                    {/* Property Image */}
                    {property.main_photo_url ? (
                      <div className="h-48 bg-gray-200">
                        <img
                          src={property.main_photo_url}
                          alt={property.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              "/images/placeholder-property.jpg";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gray-100 flex items-center justify-center">
                        <Building className="h-12 w-12 text-gray-400" />
                      </div>
                    )}

                    {/* Property Info */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg mb-1">
                            {property.name}
                          </h3>
                          {property.address && (
                            <p className="text-sm text-gray-500 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {property.address}
                              {property.city && `, ${property.city}`}
                              {property.state && `, ${property.state}`}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {property.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {property.description}
                        </p>
                      )}

                      <div className="flex justify-between items-center">
                        <Link
                          href={`/properties/${property.id}`}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View Details →
                        </Link>
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <Settings className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </StandardCard>
              ))}
            </div>
          ) : (
            /* Empty State */
            <StandardCard>
              <div className="p-8 text-center">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Properties Yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Get started by adding your first vacation home or property
                </p>
                {/* REMOVED: Add Property button from empty state */}
              </div>
            </StandardCard>
          )}
        </div>
      </StandardPageLayout>

      {/* Floating Action Button */}
      <CreatePattern onClick={handleAddProperty} label="Add Property" />
    </>
  );
}
