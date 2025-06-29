"use client";

import { useState, useEffect } from "react";
import { Building, Plus, Edit, Eye } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import { debugLog, debugError } from "@/lib/utils/debug";
import PropertyEditModal from "@/components/properties/PropertyEditModal";

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  description: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  max_occupancy: number;
  is_active: boolean;
}

export default function AccountPropertiesPage() {
  const { user, loading, initialized } = useAuth();
  const { userPropertiesCount } = useProperty();
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Load properties
  useEffect(() => {
    if (user && initialized) {
      loadProperties();
    }
  }, [user, initialized]);

  const loadProperties = async () => {
    try {
      setPropertiesLoading(true);
      debugLog('🏠 Loading properties for user:', user?.id);

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        debugError('❌ Error loading properties:', error);
        return;
      }

      setProperties(data || []);
      debugLog('✅ Properties loaded:', data?.length);
    } catch (err) {
      debugError('❌ Properties load error:', err);
    } finally {
      setPropertiesLoading(false);
    }
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setShowEditModal(true);
  };

  const handlePropertyUpdated = () => {
    loadProperties(); // Reload properties after update
    setShowEditModal(false);
    setEditingProperty(null);
  };

  const handleViewProperty = (property: Property) => {
    router.push(`/properties/${property.id}`);
  };

  // Auth check at page level
  useEffect(() => {
    if (!loading && initialized && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, initialized, router]);

  // Show loading while auth initializes
  if (loading || !initialized) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect if no user
  if (!user) {
    return null;
  }

  const activeProperties = properties.filter(p => p.is_active).length;

  return (
    <StandardPageLayout>
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Building className="h-6 w-6 mr-2 text-blue-600" />
          <span className="text-lg text-gray-600">
            {properties.length} properties in your account
          </span>
        </div>
        <button 
          onClick={() => router.push('/account/properties/new')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {properties.length}
          </div>
          <p className="text-gray-600">Total Properties</p>
        </div>
        <div className="bg-white rounded-lg border p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {activeProperties}
          </div>
          <p className="text-gray-600">Active Properties</p>
        </div>
        <div className="bg-white rounded-lg border p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {properties.filter(p => {
              const monthAgo = new Date();
              monthAgo.setMonth(monthAgo.getMonth() - 1);
              return new Date(p.created_at) > monthAgo;
            }).length}
          </div>
          <p className="text-gray-600">Added This Month</p>
        </div>
      </div>

      {/* Properties List */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            All Properties
          </h2>
        </div>

        <div className="p-6">
          {propertiesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No properties found</p>
              <button 
                onClick={() => router.push('/account/properties/new')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Your First Property
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">
                            {property.name}
                          </h3>
                          {!property.is_active && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">
                          {property.address}
                          {property.city && `, ${property.city}`}
                          {property.state && `, ${property.state}`}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {property.property_type} • {property.bedrooms} bed • {property.bathrooms} bath
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewProperty(property)}
                        className="flex items-center px-3 py-1 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </button>
                      <button 
                        onClick={() => handleEditProperty(property)}
                        className="flex items-center px-3 py-1 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-50"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Property Modal */}
      {showEditModal && editingProperty && (
        <PropertyEditModal
          property={editingProperty}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingProperty(null);
          }}
          onSave={handlePropertyUpdated}
        />
      )}
    </StandardPageLayout>
  );
}
