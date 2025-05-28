// components/inventory/hooks/useStaples.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import { DefaultStaple, CustomStaple, AllStaple, StapleFormData, InventoryItem } from "../types";

export function useStaples() {
  const { user } = useAuth();
  const { currentProperty } = useProperty();
  const [defaultStaples, setDefaultStaples] = useState<DefaultStaple[]>([]);
  const [customStaples, setCustomStaples] = useState<CustomStaple[]>([]);
  const [isManagingStaples, setIsManagingStaples] = useState(false);
  const [editingStaple, setEditingStaple] = useState<AllStaple | null>(null);
  const [stapleFormData, setStapleFormData] = useState<StapleFormData>({
    name: "",
    category: "staples",
    defaultThreshold: 1,
  });
  const [error, setError] = useState<string | null>(null);

  const resetStapleForm = () => {
    setStapleFormData({
      name: "",
      category: "staples",
      defaultThreshold: 1,
    });
  };

  const fetchDefaultStaples = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("default_staples")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;

      setDefaultStaples(
        data.map((staple) => ({
          id: staple.id,
          name: staple.name,
          category: staple.category,
          defaultThreshold: staple.default_threshold,
          display_order: staple.display_order,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching default staples:", error);
      setDefaultStaples([]);
    }
  }, []);

  const fetchCustomStaples = useCallback(async () => {
    if (!user || !currentProperty) return;

    try {
      const { data, error } = await supabase
        .from("custom_staples")
        .select("*")
        .eq("property_id", currentProperty.id)
        .order("name");

      if (error) throw error;

      setCustomStaples(
        data.map((staple) => ({
          id: staple.id,
          name: staple.name,
          category: staple.category,
          default_threshold: staple.default_threshold,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching custom staples:", error);
    }
  }, [user, currentProperty]);

  // Combine default and custom staples
  const allStaples: AllStaple[] = [
    ...defaultStaples.map((staple) => ({
      ...staple,
      defaultThreshold: staple.defaultThreshold,
      isFromDatabase: true,
      sourceTable: "default_staples" as const,
    })),
    ...customStaples.map((staple) => ({
      id: staple.id,
      name: staple.name,
      category: staple.category,
      defaultThreshold: staple.default_threshold,
      isFromDatabase: true,
      sourceTable: "custom_staples" as const,
    })),
  ];

  const quickAddStaple = async (staple: AllStaple, items: InventoryItem[], fetchItems: () => Promise<void>) => {
    if (!user || !currentProperty) return;

    try {
      setError(null);

      const existingItem = items.find(
        (item) =>
          item.name.toLowerCase() === staple.name.toLowerCase() &&
          item.category === staple.category
      );

      if (existingItem) {
        setError(`${staple.name} already exists in your inventory`);
        return;
      }

      const { error } = await supabase.from("inventory").insert({
        name: staple.name,
        quantity: 0,
        category: staple.category,
        threshold: staple.defaultThreshold,
        property_id: currentProperty.id,
        user_id: user.id,
        last_updated_by: user.id,
      });

      if (error) throw error;
      await fetchItems();
    } catch (err: any) {
      console.error("Error adding staple item:", err);
      setError(err.message || "An error occurred while adding staple item");
    }
  };

  const handleAddCustomStaple = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentProperty) return;

    try {
      setError(null);

      const actualName =
        stapleFormData.name === "ADD_NEW" ? "" : stapleFormData.name;

      if (!actualName.trim()) {
        setError("Please enter a staple name");
        return;
      }

      const { error } = await supabase.from("custom_staples").insert({
        name: actualName,
        category: stapleFormData.category,
        default_threshold: stapleFormData.defaultThreshold,
        property_id: currentProperty.id,
        user_id: user.id,
      });

      if (error) throw error;

      await fetchCustomStaples();
      resetStapleForm();
    } catch (err: any) {
      console.error("Error adding custom staple:", err);
      setError(err.message || "An error occurred while adding custom staple");
    }
  };

  const handleUpdateStaple = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingStaple) return;

    try {
      setError(null);

      let error;

      if (editingStaple.sourceTable === "custom_staples") {
        const result = await supabase
          .from("custom_staples")
          .update({
            name: stapleFormData.name,
            category: stapleFormData.category,
            default_threshold: stapleFormData.defaultThreshold,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingStaple.id);
        error = result.error;
      } else if (editingStaple.sourceTable === "default_staples") {
        const result = await supabase
          .from("default_staples")
          .update({
            name: stapleFormData.name,
            category: stapleFormData.category,
            default_threshold: stapleFormData.defaultThreshold,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingStaple.id);
        error = result.error;
      }

      if (error) throw error;

      await fetchCustomStaples();
      await fetchDefaultStaples();

      resetStapleForm();
      setEditingStaple(null);
      setIsManagingStaples(true);
    } catch (err: any) {
      console.error("Error updating staple:", err);
      setError(err.message || "An error occurred while updating staple");
    }
  };

  const handleEditStaple = (staple: AllStaple) => {
    setStapleFormData({
      name: staple.name,
      category: staple.category,
      defaultThreshold: staple.defaultThreshold,
    });
    setEditingStaple(staple);
    setIsManagingStaples(true);
  };

  const handleDeleteStaple = async (staple: AllStaple) => {
    if (
      !confirm(
        `Are you sure you want to delete "${staple.name}" from the staples list?`
      )
    ) {
      return;
    }

    try {
      setError(null);

      let error;

      if (staple.sourceTable === "custom_staples") {
        const result = await supabase
          .from("custom_staples")
          .delete()
          .eq("id", staple.id);
        error = result.error;
      } else if (staple.sourceTable === "default_staples") {
        const result = await supabase
          .from("default_staples")
          .delete()
          .eq("id", staple.id);
        error = result.error;
      }

      if (error) throw error;

      await fetchCustomStaples();
      await fetchDefaultStaples();
    } catch (err: any) {
      console.error("Error deleting staple:", err);
      setError(err.message || "An error occurred while deleting staple");
    }
  };

  useEffect(() => {
    fetchDefaultStaples();
    if (user && currentProperty) {
      fetchCustomStaples();
    }
  }, [user, currentProperty, fetchCustomStaples, fetchDefaultStaples]);

  return {
    defaultStaples,
    customStaples,
    allStaples,
    isManagingStaples,
    setIsManagingStaples,
    editingStaple,
    setEditingStaple,
    stapleFormData,
    setStapleFormData,
    error,
    setError,
    resetStapleForm,
    fetchDefaultStaples,
    fetchCustomStaples,
    quickAddStaple,
    handleAddCustomStaple,
    handleUpdateStaple,
    handleEditStaple,
    handleDeleteStaple,
  };
}