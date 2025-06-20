"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";
import { robustSupabaseRequest } from "@/lib/network-helper"; // ✅ Added missing import

type Property = {
  id: string;
  name: string;
};

interface SectionFormProps {
  section?: {
    id: string;
    title: string;
    description: string;
    icon?: string;
    order_index: number;
    property_id?: string;
  } | null;
  onClose: () => void;
  onSaved: () => void; // ✅ Fixed: this should be onSaved, not onSave
}

export default function SectionForm({
  section,
  onClose,
  onSaved, // ✅ Fixed: using correct prop name
}: SectionFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "",
    property_id: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);

  // Load section data if editing
  useEffect(() => {
    if (section) {
      setFormData({
        title: section.title,
        description: section.description || "",
        icon: section.icon || "",
        property_id: section.property_id || "",
      });
    }
  }, [section]);

  useEffect(() => {
    async function loadProperties() {
      // ✅ Updated to use robustSupabaseRequest properly
      const { data, error } = await robustSupabaseRequest(
        () => supabase.from('properties').select('id, name'), // ✅ Only select needed fields
        { timeout: 10000, retries: 2 }
      );
      
      if (data && !error) {
        setProperties(data);
      } else if (error) {
        console.error('Error loading properties:', error);
      }
    }
    loadProperties();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get the next order index if creating a new section
      let orderIndex = 0;
      if (!section) {
        // ✅ Use robustSupabaseRequest for order index query
        const { data } = await robustSupabaseRequest(
          () => supabase
            .from("manual_sections")
            .select("order_index")
            .order("order_index", { ascending: false })
            .limit(1),
          { timeout: 10000, retries: 2 }
        );

        orderIndex = data && data.length > 0 ? data[0].order_index + 1 : 0;
      }

      if (section) {
        // ✅ Update existing section with robustSupabaseRequest
        const { error } = await robustSupabaseRequest(
          () => supabase
            .from("manual_sections")
            .update({
              title: formData.title,
              description: formData.description,
              icon: formData.icon || null,
              property_id: formData.property_id || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", section.id),
          { timeout: 15000, retries: 3 }
        );

        if (error) {
          throw new Error(`Update failed: ${error.message}`);
        }
      } else {
        // ✅ Create new section with robustSupabaseRequest
        const { error } = await robustSupabaseRequest(
          () => supabase.from("manual_sections").insert([
            {
              title: formData.title,
              description: formData.description,
              icon: formData.icon || null,
              property_id: formData.property_id || null,
              order_index: orderIndex,
            },
          ]),
          { timeout: 15000, retries: 3 }
        );

        if (error) {
          throw new Error(`Create failed: ${error.message}`);
        }
      }

      onSaved(); // ✅ Fixed: calling the correct callback
    } catch (error) {
      console.error("Error saving section:", error);
      alert("Failed to save section. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">
            {section ? "Edit Section" : "Add New Section"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
            title="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Section Title*
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., Welcome & Essentials"
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Briefly describe this section"
              rows={3}
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="property-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Property
            </label>
            <select
              id="property-select"
              className="w-full px-3 py-2 border rounded"
              value={formData.property_id || ""}
              onChange={(e) =>
                setFormData({ ...formData, property_id: e.target.value })
              }
              required
            >
              <option value="">Select a property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : section ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}