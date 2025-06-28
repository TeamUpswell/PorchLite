"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useProperty } from "@/lib/hooks/useProperty";
import { useInventoryCategories } from "@/lib/hooks/useInventoryCategories";
import {
  X,
  Plus,
  Edit3,
  Trash2,
  Save,
  Package,
  Tag,
  Settings,
} from "lucide-react";

interface ManageItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryHook: any;
}

export default function ManageItemsModal({
  isOpen,
  onClose,
  inventoryHook,
}: ManageItemsModalProps) {
  const { currentProperty } = useProperty();
  const { categories, addCategory, updateCategory, deleteCategory } =
    useInventoryCategories();

  const [activeTab, setActiveTab] = useState("categories");

  // Category management state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: "", icon: "📋" });

  // Emoji suggestions organized by category type
  const emojiSuggestions = {
    pets: ["🐕", "🐱", "🐠", "🐦", "🐹", "🐰"],
    cleaning: ["🧽", "🧹", "🧼", "🫧", "🧴", "🧻"],
    kitchen: ["🍽️", "🥄", "🔪", "🧊", "☕", "🍳"],
    bathroom: ["🚿", "🛁", "🪥", "🧻", "🧴", "🚽"],
    office: ["📄", "📋", "📎", "✏️", "📝", "💻"],
    tech: ["💡", "🔌", "📺", "🎮", "📱", "🔋"],
    outdoor: ["🌿", "🪴", "🌺", "🌳", "☀️", "🌙"],
    safety: ["🔒", "🔑", "🚨", "🛡️", "🧯", "⚠️"],
    general: ["📋", "📦", "🏷️", "⭐", "🎯", "🔧"],
  };

  // Get emoji suggestions based on category name
  const getSmartEmojiSuggestions = (categoryName: string) => {
    const name = categoryName.toLowerCase();

    if (name.includes("pet") || name.includes("dog") || name.includes("cat")) {
      return emojiSuggestions.pets;
    } else if (
      name.includes("clean") ||
      name.includes("soap") ||
      name.includes("wash")
    ) {
      return emojiSuggestions.cleaning;
    } else if (
      name.includes("kitchen") ||
      name.includes("food") ||
      name.includes("cook")
    ) {
      return emojiSuggestions.kitchen;
    } else if (
      name.includes("bath") ||
      name.includes("shower") ||
      name.includes("toilet")
    ) {
      return emojiSuggestions.bathroom;
    } else if (
      name.includes("office") ||
      name.includes("paper") ||
      name.includes("desk")
    ) {
      return emojiSuggestions.office;
    } else if (
      name.includes("tech") ||
      name.includes("electronic") ||
      name.includes("gadget")
    ) {
      return emojiSuggestions.tech;
    } else if (
      name.includes("outdoor") ||
      name.includes("garden") ||
      name.includes("plant")
    ) {
      return emojiSuggestions.outdoor;
    } else if (
      name.includes("safety") ||
      name.includes("security") ||
      name.includes("lock")
    ) {
      return emojiSuggestions.safety;
    } else {
      return emojiSuggestions.general;
    }
  };

  // Category management functions
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      alert("Please enter a category name");
      return;
    }

    console.log("🆕 Adding category:", newCategory);
    const result = await addCategory(newCategory.name, newCategory.icon);

    if (result.success) {
      console.log("✅ Category added successfully");
      setNewCategory({ name: "", icon: "📋" });
      setShowAddCategory(false);
      if (inventoryHook.refreshItems) {
        inventoryHook.refreshItems();
      }
    } else {
      console.error("❌ Failed to add category:", result.error);
      alert(`Failed to add category: ${result.error}`);
    }
  };

  const handleUpdateCategory = async (categoryId: string, updates: any) => {
    const result = await updateCategory(categoryId, updates);
    if (result.success) {
      setEditingCategory(null);
      if (inventoryHook.refreshItems) {
        inventoryHook.refreshItems();
      }
    } else {
      alert(`Failed to update category: ${result.error}`);
    }
  };

  const handleDeleteCategory = async (
    categoryId: string,
    categoryName: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete "${categoryName}"?\n\nAll items in this category will be moved to "Other".`
      )
    ) {
      return;
    }

    const result = await deleteCategory(categoryId);
    if (result.success) {
      if (inventoryHook.refreshItems) {
        inventoryHook.refreshItems();
      }
    } else {
      alert(`Failed to delete category: ${result.error}`);
    }
  };

  const startEditingCategory = (category: any) => {
    setEditingCategory({
      ...category,
      editName: category.name,
      editIcon: category.icon,
    });
  };

  const cancelEditingCategory = () => {
    setEditingCategory(null);
  };

  const saveEditingCategory = async () => {
    if (!editingCategory.editName.trim()) {
      alert("Please enter a category name");
      return;
    }

    await handleUpdateCategory(editingCategory.id, {
      name: editingCategory.editName.trim(),
      icon: editingCategory.editIcon,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header with tabs */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab("categories")}
              className={`flex items-center text-lg font-semibold px-3 py-2 rounded-lg transition-colors ${
                activeTab === "categories"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <Tag className="h-4 w-4 mr-2" />
              Manage Categories
            </button>
            <button
              onClick={() => setActiveTab("items")}
              className={`flex items-center text-lg font-semibold px-3 py-2 rounded-lg transition-colors ${
                activeTab === "items"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <Package className="h-4 w-4 mr-2" />
              Manage Items
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {activeTab === "categories" && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Category Management
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add custom categories for your property. System categories
                  cannot be edited or deleted.
                </p>

                {/* Add Category Form */}
                {showAddCategory ? (
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Add New Category
                    </h4>
                    <div className="space-y-4">
                      {/* Category Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category Name
                        </label>
                        <input
                          type="text"
                          value={newCategory.name}
                          onChange={(e) =>
                            setNewCategory((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Pet Supplies, Electronics"
                        />
                      </div>

                      {/* Icon Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Choose Icon
                        </label>

                        {/* Manual Icon Input */}
                        <div className="flex items-center space-x-3 mb-3">
                          <label className="text-sm text-gray-600">
                            Custom:
                          </label>
                          <input
                            type="text"
                            value={newCategory.icon}
                            onChange={(e) =>
                              setNewCategory((prev) => ({
                                ...prev,
                                icon: e.target.value,
                              }))
                            }
                            className="w-16 px-2 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                            placeholder="🐕"
                            maxLength={2}
                          />
                          <span className="text-sm text-gray-500">
                            Or choose from suggestions below
                          </span>
                        </div>

                        {/* Smart Emoji Suggestions */}
                        {newCategory.name && (
                          <div>
                            <label className="block text-sm text-gray-600 mb-2">
                              Suggested for "{newCategory.name}":
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {getSmartEmojiSuggestions(newCategory.name).map(
                                (emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() =>
                                      setNewCategory((prev) => ({
                                        ...prev,
                                        icon: emoji,
                                      }))
                                    }
                                    className={`w-10 h-10 text-lg border rounded-lg hover:bg-blue-50 transition-colors ${
                                      newCategory.icon === emoji
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-300"
                                    }`}
                                    title={`Use ${emoji}`}
                                  >
                                    {emoji}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* General Suggestions */}
                        <div className="mt-4">
                          <label className="block text-sm text-gray-600 mb-2">
                            Popular icons:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {emojiSuggestions.general.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() =>
                                  setNewCategory((prev) => ({
                                    ...prev,
                                    icon: emoji,
                                  }))
                                }
                                className={`w-10 h-10 text-lg border rounded-lg hover:bg-gray-50 transition-colors ${
                                  newCategory.icon === emoji
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-300"
                                }`}
                                title={`Use ${emoji}`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCategory(false);
                          setNewCategory({ name: "", icon: "📋" });
                        }}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        disabled={!newCategory.name.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Add Category
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddCategory(true)}
                    className="mb-6 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Category
                  </button>
                )}

                {/* Categories List */}
                <div className="space-y-3">
                  {categories && categories.length > 0 ? (
                    categories.map((category) => (
                      <div
                        key={category.id}
                        className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                          category.is_system
                            ? "bg-blue-50 border-blue-200"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {editingCategory?.id === category.id ? (
                          // Edit mode
                          <div className="flex items-center space-x-3 flex-1">
                            <input
                              type="text"
                              value={editingCategory.editIcon}
                              onChange={(e) =>
                                setEditingCategory((prev) => ({
                                  ...prev,
                                  editIcon: e.target.value,
                                }))
                              }
                              className="w-12 px-2 py-1 text-center border border-gray-300 rounded text-lg"
                              maxLength={2}
                            />
                            <input
                              type="text"
                              value={editingCategory.editName}
                              onChange={(e) =>
                                setEditingCategory((prev) => ({
                                  ...prev,
                                  editName: e.target.value,
                                }))
                              }
                              className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={saveEditingCategory}
                                className="p-1 text-green-600 hover:text-green-800"
                                title="Save changes"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={cancelEditingCategory}
                                className="p-1 text-gray-600 hover:text-gray-800"
                                title="Cancel editing"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{category.icon}</span>
                              <div>
                                <span className="font-medium text-gray-900 capitalize">
                                  {category.name}
                                </span>
                                {category.is_system && (
                                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                    System
                                  </span>
                                )}
                              </div>
                            </div>

                            {!category.is_system && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => startEditingCategory(category)}
                                  className="p-1 text-blue-600 hover:text-blue-800"
                                  title="Edit category"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteCategory(
                                      category.id,
                                      category.name
                                    )
                                  }
                                  className="p-1 text-red-600 hover:text-red-800"
                                  title="Delete category"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {categories === undefined
                        ? "Loading categories..."
                        : "No categories found. Add your first custom category above."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "items" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Inventory Items Management
              </h3>
              <p className="text-gray-600">Items management coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
