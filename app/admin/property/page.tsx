"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import {
  Building,
  Plus,
  Edit,
  Trash2,
  Users,
  Settings,
  MapPin,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";

interface Property {
  id: string;
  name: string;
  address?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface PropertyStats {
  totalRooms: number;
  totalReservations: number;
  totalUsers: number;
  lastActivity: string;
}

export default function AdminPropertyPage() {
  const { user } = useAuth();
  const { currentProperty, properties, setCurrentProperty } = useProperty();
  const [loading, setLoading] = useState(true);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [propertyStats, setPropertyStats] = useState<
    Record<string, PropertyStats>
  >({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    async function fetchPropertyData() {
      try {
        setLoading(true);

        // Fetch all properties
        const { data: propertiesData, error: propertiesError } = await supabase
          .from("properties")
          .select("*")
          .order("created_at", { ascending: false });

        if (propertiesError) throw propertiesError;

        setAllProperties(propertiesData || []);

        // Fetch stats for each property
        const stats: Record<string, PropertyStats> = {};
        for (const property of propertiesData || []) {
          // Get room count
          const { count: roomCount } = await supabase
            .from("rooms")
            .select("*", { count: "exact", head: true })
            .eq("property_id", property.id);

          // Get reservation count
          const { count: reservationCount } = await supabase
            .from("reservations")
            .select("*", { count: "exact", head: true })
            .eq("property_id", property.id);

          // Get user count (simplified - you might have a different user-property relationship)
          const { count: userCount } = await supabase
            .from("user_properties")
            .select("*", { count: "exact", head: true })
            .eq("property_id", property.id);

          stats[property.id] = {
            totalRooms: roomCount || 0,
            totalReservations: reservationCount || 0,
            totalUsers: userCount || 0,
            lastActivity: property.updated_at,
          };
        }

        setPropertyStats(stats);
      } catch (error) {
        console.error("Error loading property data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPropertyData();
  }, []);

  const handleDeleteProperty = async (propertyId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this property? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", propertyId);

      if (error) throw error;

      // Update local state
      setAllProperties((prev) => prev.filter((p) => p.id !== propertyId));

      // If the deleted property was the current one, clear it
      if (currentProperty?.id === propertyId) {
        setCurrentProperty(null);
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      alert("Failed to delete property");
    }
  };

  const totalProperties = allProperties.length;
  const totalRooms = Object.values(propertyStats).reduce(
    (sum, stats) => sum + stats.totalRooms,
    0
  );
  const totalReservations = Object.values(propertyStats).reduce(
    (sum, stats) => sum + stats.totalReservations,
    0
  );
  const totalUsers = Object.values(propertyStats).reduce(
    (sum, stats) => sum + stats.totalUsers,
    0
  );

  return (
    <StandardPageLayout
      title="Property Management"
      subtitle="Manage properties and their settings"
      headerIcon={<Building className="h-6 w-6 text-blue-600" />}
      headerActions={
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </button>
      }
    >
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StandardCard className="text-center" hover>
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {totalProperties}
          </div>
          <p className="text-gray-600 text-sm">Total Properties</p>
        </StandardCard>

        <StandardCard className="text-center" hover>
          <div className="text-2xl font-bold text-green-600 mb-1">
            {totalRooms}
          </div>
          <p className="text-gray-600 text-sm">Total Rooms</p>
        </StandardCard>

        <StandardCard className="text-center" hover>
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {totalReservations}
          </div>
          <p className="text-gray-600 text-sm">Total Reservations</p>
        </StandardCard>

        <StandardCard className="text-center" hover>
          <div className="text-2xl font-bold text-orange-600 mb-1">
            {totalUsers}
          </div>
          <p className="text-gray-600 text-sm">Total Users</p>
        </StandardCard>
      </div>

      {/* Current Property Info */}
      {currentProperty && (
        <StandardCard
          title="Current Property"
          subtitle="Currently selected property"
          className="mb-6"
          headerActions={
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          }
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Building className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {currentProperty.name}
                </h3>
                {currentProperty.address && (
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{currentProperty.address}</span>
                  </div>
                )}
                {currentProperty.description && (
                  <p className="text-gray-600 text-sm">
                    {currentProperty.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Link
                href={`/admin/property/${currentProperty.id}/settings`}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="Property Settings"
              >
                <Settings className="h-4 w-4" />
              </Link>
              <Link
                href={`/admin/property/${currentProperty.id}/edit`}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="Edit Property"
              >
                <Edit className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Current Property Stats */}
          {propertyStats[currentProperty.id] && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-blue-600">
                    {propertyStats[currentProperty.id].totalRooms}
                  </div>
                  <p className="text-xs text-gray-600">Rooms</p>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-600">
                    {propertyStats[currentProperty.id].totalReservations}
                  </div>
                  <p className="text-xs text-gray-600">Reservations</p>
                </div>
                <div>
                  <div className="text-lg font-semibold text-purple-600">
                    {propertyStats[currentProperty.id].totalUsers}
                  </div>
                  <p className="text-xs text-gray-600">Users</p>
                </div>
              </div>
            </div>
          )}
        </StandardCard>
      )}

      {/* All Properties List */}
      <StandardCard
        title="All Properties"
        subtitle={`${allProperties.length} properties in the system`}
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : allProperties.length > 0 ? (
          <div className="space-y-4">
            {allProperties.map((property) => {
              const stats = propertyStats[property.id];
              const isCurrentProperty = currentProperty?.id === property.id;

              return (
                <div
                  key={property.id}
                  className={`border rounded-lg p-4 transition-all ${
                    isCurrentProperty
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-200 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isCurrentProperty ? "bg-blue-100" : "bg-gray-100"
                        }`}
                      >
                        <Building
                          className={`h-5 w-5 ${
                            isCurrentProperty
                              ? "text-blue-600"
                              : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900">
                            {property.name}
                          </h3>
                          {isCurrentProperty && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Current
                            </span>
                          )}
                        </div>

                        {property.address && (
                          <div className="flex items-center text-gray-600 mb-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="text-sm">{property.address}</span>
                          </div>
                        )}

                        {property.description && (
                          <p className="text-gray-600 text-sm mb-2">
                            {property.description}
                          </p>
                        )}

                        {/* Property Stats */}
                        {stats && (
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{stats.totalRooms} rooms</span>
                            <span>{stats.totalReservations} reservations</span>
                            <span>{stats.totalUsers} users</span>
                            <span>
                              Updated{" "}
                              {new Date(
                                stats.lastActivity
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {!isCurrentProperty && (
                        <button
                          onClick={() => setCurrentProperty(property)}
                          className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                        >
                          Select
                        </button>
                      )}

                      <Link
                        href={`/admin/property/${property.id}/edit`}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>

                      <button
                        onClick={() => handleDeleteProperty(property.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                        disabled={isCurrentProperty}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Building className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p>No properties found</p>
            <p className="text-sm mt-1 mb-4">
              Create your first property to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Property
            </button>
          </div>
        )}
      </StandardCard>

      {/* Create Property Modal */}
      {showCreateModal && (
        <CreatePropertyModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newProperty) => {
            setAllProperties((prev) => [newProperty, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}
    </StandardPageLayout>
  );
}

// Create Property Modal Component
function CreatePropertyModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (property: Property) => void;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("properties")
        .insert([
          {
            name: name.trim(),
            address: address.trim() || null,
            description: description.trim() || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      onCreated(data);
    } catch (error) {
      console.error("Error creating property:", error);
      alert("Failed to create property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Create New Property
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter property name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter property address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter property description"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating..." : "Create Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
