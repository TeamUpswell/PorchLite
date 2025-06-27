// lib/hooks/useInventoryCategories.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useProperty } from "@/lib/hooks/useProperty";
import { debugLog, debugError } from "@/lib/utils/debug";

interface Category {
  id: string;
  name: string;
  icon: string;
  display_order: number;
  is_system: boolean;
  property_id: string | null;
  user_id: string | null;
  is_active: boolean;
}

export function useInventoryCategories(property_id: string | null) {
  const { currentProperty } = useProperty();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all categories (system + property-specific)
  const fetchCategories = async () => {
    if (!property_id) return;

    debugLog("🔍 Fetching categories for property:", property_id);

    try {
      setLoading(true);

      // Build the query based on whether we have a property
      let query = supabase
        .from("inventory_categories")
        .select("*")
        .eq("is_active", true);

      if (property_id) {
        // Get system categories AND property-specific categories
        query = query.or(`is_system.eq.true,property_id.eq.${property_id}`);
      } else {
        // Only get system categories if no property
        query = query.eq("is_system", true);
      }

      const { data, error } = await query.order("display_order");

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      debugLog(
        "📦 Found categories:",
        data?.length || 0,
        `(${data?.length || 0})`,
        data
      );
      setCategories(data || []);
    } catch (error) {
      debugError("❌ Error fetching categories:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch categories"
      );
      // Fallback to hardcoded categories if database fails
      console.log("🔄 Using fallback categories");
      setCategories([
        {
          id: "cleaning-fallback",
          name: "cleaning",
          icon: "🧽",
          display_order: 1,
          is_system: true,
          property_id: null,
          user_id: null,
          is_active: true,
        },
        {
          id: "linens-fallback",
          name: "linens",
          icon: "🛏️",
          display_order: 2,
          is_system: true,
          property_id: null,
          user_id: null,
          is_active: true,
        },
        {
          id: "amenities-fallback",
          name: "amenities",
          icon: "🧴",
          display_order: 3,
          is_system: true,
          property_id: null,
          user_id: null,
          is_active: true,
        },
        {
          id: "maintenance-fallback",
          name: "maintenance",
          icon: "🔧",
          display_order: 4,
          is_system: true,
          property_id: null,
          user_id: null,
          is_active: true,
        },
        {
          id: "kitchen-fallback",
          name: "kitchen",
          icon: "🍽️",
          display_order: 5,
          is_system: true,
          property_id: null,
          user_id: null,
          is_active: true,
        },
        {
          id: "bathroom-fallback",
          name: "bathroom",
          icon: "🚿",
          display_order: 6,
          is_system: true,
          property_id: null,
          user_id: null,
          is_active: true,
        },
        {
          id: "safety-fallback",
          name: "safety",
          icon: "🔒",
          display_order: 7,
          is_system: true,
          property_id: null,
          user_id: null,
          is_active: true,
        },
        {
          id: "office-fallback",
          name: "office",
          icon: "📄",
          display_order: 8,
          is_system: true,
          property_id: null,
          user_id: null,
          is_active: true,
        },
        {
          id: "outdoor-fallback",
          name: "outdoor",
          icon: "🌿",
          display_order: 9,
          is_system: true,
          property_id: null,
          user_id: null,
          is_active: true,
        },
        {
          id: "other-fallback",
          name: "other",
          icon: "📋",
          display_order: 10,
          is_system: true,
          property_id: null,
          user_id: null,
          is_active: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [property_id]);

  // Add custom category
  const addCategory = async (name: string, icon: string = "📋") => {
    try {
      console.log("🆕 Adding category:", {
        name,
        icon,
        property_id: currentProperty?.id,
      });

      if (!currentProperty?.id) {
        throw new Error("No property selected");
      }

      const { data: user } = await supabase.auth.getUser();

      if (!user.user) {
        throw new Error("No authenticated user");
      }

      const categoryData = {
        name: name.toLowerCase().trim(),
        icon,
        display_order: categories.length + 1,
        is_system: false,
        property_id: currentProperty.id,
        user_id: user.user.id,
      };

      console.log("💾 Inserting category data:", categoryData);

      const { data, error } = await supabase
        .from("inventory_categories")
        .insert([categoryData])
        .select()
        .single();

      if (error) {
        console.error("Database insert error:", error);
        throw error;
      }

      console.log("✅ Category added successfully:", data);
      setCategories((prev) => [...prev, data]);
      return { success: true, data };
    } catch (error) {
      console.error("❌ Error adding category:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  };

  // Update category
  const updateCategory = async (
    categoryId: string,
    updates: { name?: string; icon?: string }
  ) => {
    try {
      console.log("✏️ Updating category:", categoryId, updates);

      if (!currentProperty?.id) {
        throw new Error("No property selected");
      }

      const { error } = await supabase
        .from("inventory_categories")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", categoryId)
        .eq("is_system", false) // Can only update custom categories
        .eq("property_id", currentProperty.id);

      if (error) {
        console.error("Database update error:", error);
        throw error;
      }

      console.log("✅ Category updated successfully");
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId ? { ...cat, ...updates } : cat
        )
      );
      return { success: true };
    } catch (error) {
      console.error("❌ Error updating category:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  };

  // Delete custom category
  const deleteCategory = async (categoryId: string) => {
    try {
      console.log("🗑️ Deleting category:", categoryId);

      if (!currentProperty?.id) {
        throw new Error("No property selected");
      }

      const categoryToDelete = categories.find((c) => c.id === categoryId);

      if (!categoryToDelete) {
        throw new Error("Category not found");
      }

      // First, move all items in this category to "other"
      console.log('📦 Moving items from category to "other"');
      const { error: updateError } = await supabase
        .from("inventory")
        .update({ category: "other" })
        .eq("category", categoryToDelete.name)
        .eq("property_id", currentProperty.id);

      if (updateError) {
        console.error("Error moving items:", updateError);
        throw updateError;
      }

      // Then delete the category
      const { error } = await supabase
        .from("inventory_categories")
        .delete()
        .eq("id", categoryId)
        .eq("is_system", false) // Can only delete custom categories
        .eq("property_id", currentProperty.id);

      if (error) {
        console.error("Database delete error:", error);
        throw error;
      }

      console.log("✅ Category deleted successfully");
      setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
      return { success: true };
    } catch (error) {
      console.error("❌ Error deleting category:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  };

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
