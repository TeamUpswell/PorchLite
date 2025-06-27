"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import { supabase } from "@/lib/supabase";
import { useProperty } from "@/lib/hooks/useProperty";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Home as HomeIcon,
  Check,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { ActionButton } from "@/components/ui/Icons";
import Link from "next/link";

// Types
interface CustomRoom {
  id: string;
  name: string;
  slug: string;
  icon: string;
  property_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface FormData {
  name: string;
  slug: string;
  icon: string;
}

// Default icon options for rooms
const ICON_OPTIONS = [
  "Home",
  "Utensils",
  "Bath",
  "Bed",
  "Sofa",
  "Car",
  "Warehouse",
  "Trees",
];

// Standard rooms list
const STANDARD_ROOMS = [
  "Kitchen",
  "Living Room",
  "Master Bedroom",
  "Guest Bedroom",
  "Master Bathroom",
  "Guest Bathroom",
  "Hallway",
  "Outdoor Area",
];

export default function CleaningRoomsPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();

  const [customRooms, setCustomRooms] = useState<CustomRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<CustomRoom | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    slug: "",
    icon: "Home",
  });

  // Refs to prevent multiple fetches and track component mount
  const fetchingRef = useRef(false);
  const hasFetchedRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  // Memoize loading states
  const isLoading = useMemo(() => {
    return authLoading || propertyLoading;
  }, [authLoading, propertyLoading]);

  // Component cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Optimized fetch function
  const fetchCustomRooms = useCallback(async (property_id: string) => {
    // Prevent duplicate fetches
    if (fetchingRef.current || hasFetchedRef.current === property_id) {
      return;
    }

    fetchingRef.current = true;
    hasFetchedRef.current = property_id;

    try {
      console.log("🏠 Fetching custom rooms for property:", property_id);
      setLoading(true);

      const { data, error } = await supabase
        .from("cleaning_room_types")
        .select("*")
        .eq("property_id", property_id)
        .order("name");

      if (error) throw error;

      if (mountedRef.current) {
        console.log("✅ Custom rooms loaded:", data?.length || 0);
        setCustomRooms(data || []);
      }
    } catch (error) {
      console.error("❌ Error fetching custom rooms:", error);
      if (mountedRef.current) {
        toast.error("Failed to load custom rooms");
        setCustomRooms([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, []);

  // Single useEffect with proper dependencies
  useEffect(() => {
    if (isLoading || !currentProperty?.id) {
      if (!isLoading) {
        setLoading(false);
      }
      return;
    }

    console.log("🏠 Property loaded, fetching custom rooms");
    fetchCustomRooms(currentProperty.id);
  }, [currentProperty?.id, isLoading, fetchCustomRooms]);

  // Reset fetch tracking when property changes
  useEffect(() => {
    if (currentProperty?.id !== hasFetchedRef.current) {
      hasFetchedRef.current = null;
      fetchingRef.current = false;
    }
  }, [currentProperty?.id]);

  // Memoized form handlers
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;

      // Auto-generate slug if name is being changed
      if (name === "name") {
        const slug = value.toLowerCase().replace(/[^a-z0-9]/g, "_");
        setFormData((prev) => ({
          ...prev,
          name: value,
          slug,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!user || !currentProperty) {
        toast.error("You must be logged in and have a property selected");
        return;
      }

      if (!formData.name || !formData.slug) {
        toast.error("Name and identifier are required");
        return;
      }

      try {
        setLoading(true);

        if (editingRoom) {
          // Update existing room
          const { error } = await supabase
            .from("cleaning_room_types")
            .update({
              name: formData.name,
              slug: formData.slug,
              icon: formData.icon,
              updated_at: new Date().toISOString(),
            })
            .eq("id", editingRoom.id);

          if (error) throw error;
          toast.success("Room updated successfully");
        } else {
          // Create new room
          const { error } = await supabase.from("cleaning_room_types").insert([
            {
              property_id: currentProperty.id,
              name: formData.name,
              slug: formData.slug,
              icon: formData.icon,
              created_by: user.id,
            },
          ]);

          if (error) throw error;
          toast.success("Room added successfully");
        }

        // Reset form and refetch rooms
        setFormData({ name: "", slug: "", icon: "Home" });
        setShowAddForm(false);
        setEditingRoom(null);

        // Refresh data by resetting cache
        hasFetchedRef.current = null;
        fetchingRef.current = false;
        await fetchCustomRooms(currentProperty.id);
      } catch (error) {
        console.error("Error saving room:", error);
        toast.error("Failed to save room");
      } finally {
        setLoading(false);
      }
    },
    [user, currentProperty, formData, editingRoom, fetchCustomRooms]
  );

  const handleEdit = useCallback((room: CustomRoom) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      slug: room.slug,
      icon: room.icon,
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleDelete = useCallback(
    async (roomId: string) => {
      if (
        !confirm(
          "Are you sure you want to delete this room? All associated tasks will also be deleted."
        )
      ) {
        return;
      }

      try {
        setLoading(true);

        const { error } = await supabase
          .from("cleaning_room_types")
          .delete()
          .eq("id", roomId);

        if (error) throw error;

        toast.success("Room deleted successfully");

        // Refresh data by resetting cache
        if (currentProperty?.id) {
          hasFetchedRef.current = null;
          fetchingRef.current = false;
          await fetchCustomRooms(currentProperty.id);
        }
      } catch (error) {
        console.error("Error deleting room:", error);
        toast.error("Failed to delete room");
      } finally {
        setLoading(false);
      }
    },
    [currentProperty?.id, fetchCustomRooms]
  );

  const resetForm = useCallback(() => {
    setShowAddForm(false);
    setEditingRoom(null);
    setFormData({ name: "", slug: "", icon: "Home" });
  }, []);

  // Memoized standard rooms list
  const standardRoomsList = useMemo(
    () =>
      STANDARD_ROOMS.map((room, index) => (
        <li key={index} className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-full mr-3">
              <HomeIcon className="h-4 w-4 text-blue-600" />
            </div>
            <span>{room}</span>
          </div>
          <span className="text-xs bg-gray-100 py-1 px-2 rounded">Default</span>
        </li>
      )),
    []
  );

  // Loading states
  if (isLoading) {
    return (
      <div className="p-6">
        <Header title="Cleaning Rooms" />
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">⏳ Loading cleaning rooms...</p>
              </div>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-6">
      <Header title="Cleaning Rooms" />
      <PageContainer>
        <div className="space-y-6">
          <StandardCard
            title="Room Management"
            subtitle="Manage room-specific cleaning tasks"
          >
            <div className="space-y-6">
              {/* Back link */}
              <div className="mb-6">
                <Link
                  href="/cleaning"
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Cleaning Dashboard
                </Link>
              </div>

              {/* Property validation */}
              {!currentProperty ? (
                <div className="text-center py-8">
                  <h2 className="text-xl font-semibold mb-2">
                    No Property Selected
                  </h2>
                  <p className="text-gray-600">
                    Please select a property from your account settings to
                    manage rooms.
                  </p>
                </div>
              ) : (
                <>
                  {/* Header with add button */}
                  <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">
                      {currentProperty.name} - Room Management
                    </h1>

                    {!showAddForm && (
                      <button
                        onClick={() => setShowAddForm(true)}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Custom Room
                      </button>
                    )}
                  </div>

                  {/* Add/Edit Form */}
                  {showAddForm && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                      <h2 className="text-lg font-medium mb-4">
                        {editingRoom ? "Edit Room" : "Add New Room"}
                      </h2>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Room Name *
                          </label>
                          <input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            placeholder="e.g., Game Room"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="slug"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Room Identifier * (auto-generated)
                          </label>
                          <input
                            id="slug"
                            name="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            pattern="[a-z0-9_]+"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            placeholder="e.g., game_room"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Only use lowercase letters, numbers and underscores
                          </p>
                        </div>

                        <div>
                          <label
                            htmlFor="icon"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Icon
                          </label>
                          <select
                            id="icon"
                            name="icon"
                            value={formData.icon}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            {ICON_OPTIONS.map((icon) => (
                              <option key={icon} value={icon}>
                                {icon}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={resetForm}
                            disabled={loading}
                            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {loading ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                              </div>
                            ) : editingRoom ? (
                              "Save Changes"
                            ) : (
                              "Add Room"
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Standard Rooms */}
                  <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <div className="p-4 bg-blue-50 border-b border-blue-100">
                      <h2 className="font-medium">Standard Rooms</h2>
                    </div>
                    <ul className="divide-y divide-gray-100">
                      {standardRoomsList}
                    </ul>
                  </div>

                  {/* Custom Rooms */}
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-4 bg-blue-50 border-b border-blue-100">
                      <h2 className="font-medium">
                        Custom Rooms ({customRooms.length})
                      </h2>
                    </div>

                    {loading ? (
                      <div className="p-6 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-gray-600">Loading custom rooms...</p>
                      </div>
                    ) : customRooms.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <p>No custom rooms have been added yet</p>
                        <button
                          onClick={() => setShowAddForm(true)}
                          className="mt-3 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Add your first custom room
                        </button>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {customRooms.map((room) => (
                          <li
                            key={room.id}
                            className="p-4 flex items-center justify-between"
                          >
                            <div className="flex items-center">
                              <div className="p-2 bg-blue-100 rounded-full mr-3">
                                <HomeIcon className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <span className="font-medium">{room.name}</span>
                                <p className="text-sm text-gray-500">
                                  ID: {room.slug}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <ActionButton
                                onClick={() => handleEdit(room)}
                                title="Edit room"
                                variant="edit"
                                disabled={loading}
                              />
                              <ActionButton
                                onClick={() => handleDelete(room.id)}
                                title="Delete room"
                                variant="delete"
                                disabled={loading}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          </StandardCard>
        </div>
      </PageContainer>
    </div>
  );
}
