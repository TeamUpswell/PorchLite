"use client";

import { useState, useEffect } from "react";
import { Building, Plus, Edit, Eye } from "lucide-react";
import StandardCard from "@/components/ui/StandardCard";
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
  created_at: string;
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
      <StandardCard>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading properties...</span>
        </div>
      </StandardCard>
    );
  }

  // Redirect if no user
  if (!user) {
    return null;
  }

  const activeProperties = properties.filter(p => p.is_active).length;
  const thisMonthProperties = properties.filter(p => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return new Date(p.created_at) > monthAgo;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <StandardCard
        title="Property Management"
        subtitle="Manage all your properties in one place"
        headerActions={
          <div className="flex items-center gap-4">
            <div className="flex items-center text-sm text-gray-600">
              <Building className="h-4 w-4 mr-1" />
              {properties.length} total properties
            </div>
            <button 
              onClick={() => router.push('/account/properties/new')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StandardCard className="text-center p-6">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {properties.length}
          </div>
          <p className="text-gray-600">Total Properties</p>
          <p className="text-xs text-gray-500 mt-1">
            All properties in your account
          </p>
        </StandardCard>

        <StandardCard className="text-center p-6">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {activeProperties}
          </div>
          <p className="text-gray-600">Active Properties</p>
          <p className="text-xs text-gray-500 mt-1">
            Currently available for use
          </p>
        </StandardCard>

        <StandardCard className="text-center p-6">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {thisMonthProperties}
          </div>
          <p className="text-gray-600">Added This Month</p>
          <p className="text-xs text-gray-500 mt-1">
            Recent property additions
          </p>
        </StandardCard>
      </div>

      {/* Properties List */}
      <StandardCard
        title="All Properties"
        subtitle={`${properties.length} properties • ${activeProperties} active`}
        headerActions={
          properties.length > 0 && (
            <button 
              onClick={() => router.push('/account/properties/new')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add Another
            </button>
          )
        }
      >
        {propertiesLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600">Loading properties...</p>
            </div>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Properties Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by adding your first property to manage with PorchLite.
            </p>
            <button 
              onClick={() => router.push('/account/properties/new')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Property
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((property) => (
              <div
                key={property.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <Building className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {property.name}
                        </h3>
                        {property.is_active ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm truncate">
                        {property.address}
                        {property.city && `, ${property.city}`}
                        {property.state && `, ${property.state}`}
                        {property.zip && ` ${property.zip}`}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-gray-500 capitalize">
                          {property.property_type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {property.bedrooms} bed
                        </span>
                        <span className="text-xs text-gray-500">
                          {property.bathrooms} bath
                        </span>
                        <span className="text-xs text-gray-500">
                          Max {property.max_occupancy} guests
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    <button 
                      onClick={() => handleViewProperty(property)}
                      className="flex items-center px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                    <button 
                      onClick={() => handleEditProperty(property)}
                      className="flex items-center px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </StandardCard>

      {/* Quick Actions Card */}
      {properties.length > 0 && (
        <StandardCard
          title="Quick Actions"
          subtitle="Common property management tasks"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/account/properties/new')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
            >
              <Plus className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Add Property</div>
                <div className="text-sm text-gray-500">Create a new property</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/inventory')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
            >
              <Building className="h-5 w-5 text-gray-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Manage Inventory</div>
                <div className="text-sm text-gray-500">Update property items</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/account')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
            >
              <Eye className="h-5 w-5 text-gray-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Account Settings</div>
                <div className="text-sm text-gray-500">Manage your account</div>
              </div>
            </button>
          </div>
        </StandardCard>
      )}

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
    </div>
  );
}