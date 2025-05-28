// lib/hooks/useInventoryCategories.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useProperty } from "@/lib/hooks/useProperty";

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

export function useInventoryCategories() {
  const { currentProperty } = useProperty();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all categories (system + property-specific)
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("inventory_categories")
        .select("*")
        .or(`is_system.eq.true,property_id.eq.${currentProperty?.id}`)
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  }, [currentProperty?.id]);

  // Add custom category
  const addCategory = async (name: string, icon: string = "📋") => {
    try {
      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("inventory_categories")
        .insert([
          {
            name: name.toLowerCase().trim(),
            icon,
            display_order: categories.length + 1,
            is_system: false,
            property_id: currentProperty?.id,
            user_id: user.user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setCategories((prev) => [...prev, data]);
      return { success: true, data };
    } catch (error) {
      console.error("Error adding category:", error);
      return { success: false, error: error.message };
    }
  };

  // Update category
  const updateCategory = async (
    categoryId: string,
    updates: { name?: string; icon?: string }
  ) => {
    try {
      const { error } = await supabase
        .from("inventory_categories")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", categoryId)
        .eq("is_system", false) // Can only update custom categories
        .eq("property_id", currentProperty?.id);

      if (error) throw error;

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId ? { ...cat, ...updates } : cat
        )
      );
      return { success: true };
    } catch (error) {
      console.error("Error updating category:", error);
      return { success: false, error: error.message };
    }
  };

  // Delete custom category (only non-system ones)
  const deleteCategory = async (categoryId: string) => {
    try {
      // First, move all items in this category to "other"
      const { error: updateError } = await supabase
        .from("inventory")
        .update({ category: "other" })
        .eq("category", categories.find((c) => c.id === categoryId)?.name);

      if (updateError) throw updateError;

      // Then delete the category
      const { error } = await supabase
        .from("inventory_categories")
        .delete()
        .eq("id", categoryId)
        .eq("is_system", false) // Can only delete custom categories
        .eq("property_id", currentProperty?.id);

      if (error) throw error;

      setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
      return { success: true };
    } catch (error) {
      console.error("Error deleting category:", error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    if (currentProperty?.id) {
      fetchCategories();
    }
  }, [fetchCategories, currentProperty?.id]);

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refreshCategories: fetchCategories,
  };
}
