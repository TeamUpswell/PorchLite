"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header";
import StandardCard from "@/components/ui/StandardCard";
import { Building, Settings, MapPin, Edit, Trash2, Plus } from "lucide-react";
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

export default function PropertiesPage() {
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

  // ADD: Handler for add property
  const handleAddProperty = () => {
    // TODO: Implement add property modal or navigation
    console.log("Add property clicked");
  };

  const handleEditProperty = (propertyId: string) => {
    // TODO: Navigate to edit page or open edit modal
    console.log("Edit property:", propertyId);
  };

  const handleDeleteProperty = (propertyId: string) => {
    // TODO: Implement delete confirmation and deletion
    console.log("Delete property:", propertyId);
  };

  if (!hasAccess) {
    return (
      <div className="p-6">
        <Header title="Property Settings" />
        <PageContainer>
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center space-x-3">
              <Building className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Property Settings
                </h1>
                <p className="text-gray-600">Access restricted</p>
              </div>
            </div>

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
                  <p>
                    Debug: Role = {user?.user_metadata?.role || "undefined"}
                  </p>
                  <p>User ID = {user?.id || "undefined"}</p>
                </div>
              </div>
            </StandardCard>
          </div>
        </PageContainer>
      </div>
    );
  }

  const isLoading = propertyLoading || loading;

  if (isLoading) {
    return (
      <div className="p-6">
        <Header title="Property Settings" />
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading properties...</span>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Header title="Property Settings" />
      <PageContainer>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Property Settings
                </h1>
                <p className="text-gray-600">
                  Manage your properties and settings
                </p>
              </div>
            </div>
            <button
              onClick={handleAddProperty}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </button>
          </div>

          {/* Properties List */}
          {properties.length > 0 ? (
            <div className="grid gap-6">
              {properties.map((property) => (
                <StandardCard key={property.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <Building className="h-6 w-6 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {property.name}
                        </h3>
                      </div>

                      {property.description && (
                        <p className="text-gray-600 mb-3">
                          {property.description}
                        </p>
                      )}

                      {property.address && (
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>
                            {property.address}
                            {property.city && `, ${property.city}`}
                            {property.state && `, ${property.state}`}
                            {property.zip && ` ${property.zip}`}
                          </span>
                        </div>
                      )}

                      <div className="text-xs text-gray-400">
                        Created:{" "}
                        {new Date(property.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditProperty(property.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit Property"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProperty(property.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete Property"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </StandardCard>
              ))}
            </div>
          ) : (
            <StandardCard>
              <div className="text-center py-12">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Properties Found
                </h3>
                <p className="text-gray-500 mb-6">
                  You haven't added any properties yet. Get started by adding
                  your first property.
                </p>
                <button
                  onClick={handleAddProperty}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Property
                </button>
              </div>
            </StandardCard>
          )}

          {/* Floating Action Button Alternative */}
          <CreatePattern
            href="#"
            label="Add Property"
            onClick={handleAddProperty}
          />
        </div>
      </PageContainer>
    </div>
  );
}
