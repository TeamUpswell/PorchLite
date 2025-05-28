// components/ItemModal.tsx - Add better error handling and debug info
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useProperty } from "@/lib/hooks/useProperty";
import { useInventoryCategories } from "@/lib/hooks/useInventoryCategories";
import { X, Package } from "lucide-react";

interface ItemModalProps {
  isAddingItem: boolean;
  setIsAddingItem: (adding: boolean) => void;
  editingItem?: any;
  setEditingItem?: (item: any) => void;
  refreshItems?: () => void;
}

export default function ItemModal({
  isAddingItem,
  setIsAddingItem,
  editingItem,
  setEditingItem,
  refreshItems,
}: ItemModalProps) {
  const { currentProperty } = useProperty();
  const { categories, loading } = useInventoryCategories();

  // Debug log
  console.log("🔍 ItemModal debug:", {
    categoriesCount: categories.length,
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
    })),
    loading,
    currentProperty: currentProperty?.id,
  });

  // Initialize formData with default values
  const [formData, setFormData] = useState({
    name: "",
    category: "cleaning",
    quantity: 0,
    threshold: 2,
  });

  // Reset form when modal opens/closes or editing item changes
  useEffect(() => {
    if (isAddingItem) {
      if (editingItem) {
        // Editing existing item
        setFormData({
          name: editingItem.name || "",
          category: editingItem.category || categories[0]?.name || "cleaning",
          quantity: editingItem.quantity || 0,
          threshold: editingItem.threshold || 2,
        });
      } else {
        // Adding new item - use first available category
        setFormData({
          name: "",
          category: categories[0]?.name || "cleaning",
          quantity: 0,
          threshold: 2,
        });
      }
    }
  }, [isAddingItem, editingItem, categories]);

  // Close modal and reset
  const closeModal = () => {
    setIsAddingItem(false);
    if (setEditingItem) {
      setEditingItem(null);
    }
    setFormData({
      name: "",
      category: categories[0]?.name || "cleaning",
      quantity: 0,
      threshold: 2,
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Please enter an item name");
      return;
    }

    if (!currentProperty?.id) {
      alert("No property selected");
      return;
    }

    try {
      console.log("💾 Submitting form with data:", formData);

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from("inventory")
          .update({
            name: formData.name.trim(),
            category: formData.category,
            quantity: formData.quantity,
            threshold: formData.threshold,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingItem.id);

        if (error) throw error;
        console.log("✅ Item updated successfully");
      } else {
        // Create new item
        const { error } = await supabase.from("inventory").insert([
          {
            name: formData.name.trim(),
            category: formData.category,
            quantity: formData.quantity,
            threshold: formData.threshold,
            item_type: "custom",
            display_order: 0,
            is_active: true,
            property_id: currentProperty.id,
          },
        ]);

        if (error) throw error;
        console.log("✅ Item created successfully");
      }

      // Refresh the inventory list
      if (refreshItems) {
        refreshItems();
      }

      // Close modal
      closeModal();
    } catch (error) {
      console.error("❌ Error saving item:", error);
      alert(`Failed to save item: ${error.message}`);
    }
  };

  // Don't render if modal is not open
  if (!isAddingItem) return null;

  // Show loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-center">Loading categories...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Package className="h-5 w-5 mr-2 text-blue-600" />
            {editingItem ? "Edit Item" : "Add New Item"}
          </h3>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Item Name */}
          <div>
            <label
              htmlFor="item-name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Item Name
            </label>
            <input
              id="item-name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter item name"
              required
            />
          </div>

          {/* Category with Icon Preview */}
          <div>
            <label
              htmlFor="item-category"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Category
            </label>
            <div className="flex items-center space-x-2">
              {/* Show selected category icon */}
              <span className="text-2xl">
                {categories.find((c) => c.name === formData.category)?.icon || "📋"}
              </span>
              <select
                id="item-category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.icon}{" "}
                      {category.name.charAt(0).toUpperCase() +
                        category.name.slice(1)}
                    </option>
                  ))
                ) : (
                  <option value="cleaning">🧽 Cleaning</option>
                )}
              </select>
            </div>
          </div>

          {/* Debug info in development */}
          {process.env.NODE_ENV === "development" && (
            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
              Categories: {categories.length} | Selected: {formData.category}
            </div>
          )}

          {/* Quantity and Threshold */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="item-quantity"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Current Quantity
              </label>
              <input
                id="item-quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="item-threshold"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Low Stock Threshold
              </label>
              <input
                id="item-threshold"
                type="number"
                min="0"
                value={formData.threshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    threshold: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingItem ? "Update Item" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
