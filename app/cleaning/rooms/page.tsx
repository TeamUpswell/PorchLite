"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
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

export default function RoomManagement() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentProperty } = useProperty();

  const [customRooms, setCustomRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    icon: "Home",
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        if (currentProperty?.id) {
          await fetchCustomRooms(currentProperty.id);
        }
      } catch (error) {
        console.error("Error loading room types:", error);
        toast.error("Failed to load custom rooms");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentProperty]);

  const fetchCustomRooms = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from("cleaning_room_types")
        .select("*")
        .eq("property_id", propertyId)
        .order("name");

      if (error) throw error;
      setCustomRooms(data || []);
    } catch (error) {
      console.error("Error fetching custom rooms:", error);
      toast.error("Failed to load custom rooms");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      await fetchCustomRooms(currentProperty.id);
    } catch (error) {
      console.error("Error saving room:", error);
      toast.error("Failed to save room");
    }
  };

  const handleEdit = (room: any) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      slug: room.slug,
      icon: room.icon,
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (roomId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this room? All associated tasks will also be deleted."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("cleaning_room_types")
        .delete()
        .eq("id", roomId);

      if (error) throw error;

      toast.success("Room deleted successfully");
      await fetchCustomRooms(currentProperty?.id); // ✅ Use currentProperty
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("Failed to delete room");
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link
            href="/cleaning"
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Cleaning Dashboard
          </Link>
        </div>

        {/* ✅ Add property validation: */}
        {!currentProperty ? (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">No Property Selected</h2>
            <p className="text-gray-600">
              Please select a property from your account settings to manage
              rooms.
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold">
                {currentProperty.name} - Room Management
              </h1>

              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      pattern="[a-z0-9_]+"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingRoom(null);
                        setFormData({ name: "", slug: "", icon: "Home" });
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {editingRoom ? "Save Changes" : "Add Room"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                  <div className="p-4 bg-blue-50 border-b border-blue-100">
                    <h2 className="font-medium">Standard Rooms</h2>
                  </div>

                  <ul className="divide-y divide-gray-100">
                    {[
                      "Kitchen",
                      "Living Room",
                      "Master Bedroom",
                      "Guest Bedroom",
                      "Master Bathroom",
                      "Guest Bathroom",
                      "Hallway",
                      "Outdoor Area",
                    ].map((room, index) => (
                      <li
                        key={index}
                        className="p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-full mr-3">
                            <HomeIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <span>{room}</span>
                        </div>
                        <span className="text-xs bg-gray-100 py-1 px-2 rounded">
                          Default
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-4 bg-blue-50 border-b border-blue-100">
                    <h2 className="font-medium">Custom Rooms</h2>
                  </div>

                  {customRooms.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <p>No custom rooms have been added yet</p>
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="mt-3 text-blue-600 hover:text-blue-800"
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
                            <span>{room.name}</span>
                          </div>
                          <div className="flex space-x-2">
                            <ActionButton
                              onClick={() => setEditingRoom(room)}
                              title="Edit room"
                              variant="edit"
                            />
                            <ActionButton
                              onClick={() => handleDelete(room.id)}
                              title="Delete room"
                              variant="delete"
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
