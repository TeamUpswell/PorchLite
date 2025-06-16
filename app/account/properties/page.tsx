"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { canManageProperties } from "@/lib/utils/roles";
import { supabase } from "@/lib/supabase";
import PageContainer from "@/components/layout/PageContainer";
import Header from "@/components/layout/Header";
import StandardCard from "@/components/ui/StandardCard";
import {
  Building,
  Settings,
  MapPin,
  Edit,
  Trash2,
  Plus,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { CreatePattern } from "@/components/ui/FloatingActionPresets";

interface Property {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  main_photo_url?: string | null;
  contact_info?: string | null;
  created_at: string;
  updated_at: string;
}

export default function PropertiesPage() {
  const { user, loading: authLoading } = useAuth();
  const { userProperties, loading: propertyLoading } = useProperty();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasAccess = canManageProperties(user);

  useEffect(() => {
    if (!authLoading) {
      if (userProperties && userProperties.length > 0) {
        setProperties(userProperties);
        setLoading(false);
      } else if (!propertyLoading) {
        setProperties([]);
        setLoading(false);
      }
    }
  }, [userProperties, propertyLoading, authLoading]);

  // Handler for add property
  const handleAddProperty = () => {
    // TODO: Implement add property modal or navigation
  };

  const handleEditProperty = (propertyId: string) => {
    // TODO: Navigate to edit page or open edit modal
    console.log("Edit property:", propertyId);
  };

  const handleDeleteProperty = (propertyId: string) => {
    // TODO: Implement delete confirmation and deletion
    console.log("Delete property:", propertyId);
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="p-6">
        <Header />
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading...</span>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="p-6">
        <Header />
        <PageContainer>
          <StandardCard>
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Access Denied
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You don&apos;t have permission to manage properties.
              </p>
              <div className="text-xs text-gray-400 mt-4 p-2 bg-gray-50 rounded">
                <p>Role: {user?.user_metadata?.role || "undefined"}</p>
              </div>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  const isLoading = propertyLoading || loading;

  if (isLoading) {
    return (
      <div className="p-6">
        <Header />
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
      <Header />
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

          {/* Property Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StandardCard>
              <div className="text-center p-4">
                <Building className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {properties.length}
                </div>
                <div className="text-sm text-gray-600">Total Properties</div>
              </div>
            </StandardCard>
            <StandardCard>
              <div className="text-center p-4">
                <Settings className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {properties.filter((p) => p.address).length}
                </div>
                <div className="text-sm text-gray-600">With Addresses</div>
              </div>
            </StandardCard>
            <StandardCard>
              <div className="text-center p-4">
                <MapPin className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {properties.filter((p) => p.latitude && p.longitude).length}
                </div>
                <div className="text-sm text-gray-600">Geo-Located</div>
              </div>
            </StandardCard>
          </div>

          {/* Properties List */}
          {properties.length > 0 ? (
            <div className="grid gap-6">
              {properties.map((property) => (
                <StandardCard key={property.id} hover>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Building className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {property.name}
                          </h3>
                          <div className="text-xs text-gray-400">
                            ID: {property.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>

                      {property.description && (
                        <p className="text-gray-600 mb-3 text-sm">
                          {property.description}
                        </p>
                      )}

                      {property.address && (
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span>
                            {property.address}
                            {property.city && `, ${property.city}`}
                            {property.state && `, ${property.state}`}
                            {property.zip && ` ${property.zip}`}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-gray-400 mt-3">
                        <span>
                          Created:{" "}
                          {new Date(property.created_at).toLocaleDateString()}
                        </span>
                        <span>
                          Updated:{" "}
                          {new Date(property.updated_at).toLocaleDateString()}
                        </span>
                        {property.latitude && property.longitude && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                            GPS Located
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditProperty(property.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit Property"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProperty(property.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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
                  You haven&apos;t added any properties yet. Get started by adding
                  your first property.
                </p>
                <button
                  onClick={handleAddProperty}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Property
                </button>
                <div className="text-sm text-gray-400 bg-gray-50 rounded-lg p-4 mt-6">
                  <p className="mb-2">
                    💡 <strong>Coming Soon:</strong>
                  </p>
                  <ul className="text-left space-y-1">
                    <li>• Property creation wizard</li>
                    <li>• Bulk property import</li>
                    <li>• Property templates</li>
                    <li>• Advanced property settings</li>
                  </ul>
                </div>
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
