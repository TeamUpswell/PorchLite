import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useProperty } from "@/lib/hooks/useProperty";
import { debugLog, debugError } from "@/lib/utils/debug";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number; // ✅ Correct
  threshold: number;
  status: "good" | "low" | "out";
  category: string;
  unit?: string;
}

export function useInventory() {
  const { currentProperty } = useProperty();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Fetch items from the inventory table
  const refreshItems = useCallback(async () => {
    debugLog("🔍 refreshItems called, currentProperty:", currentProperty?.id);

    if (!currentProperty?.id) {
      debugLog("❌ No currentProperty.id, returning early");
      return;
    }

    try {
      debugLog("🔍 Fetching inventory for property:", currentProperty.id);

      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("property_id", currentProperty.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        debugError("❌ Supabase error:", error);
        throw error;
      }

      debugLog("✅ Fetched inventory data:", data?.length || 0, "items");
      setItems(data || []);
      setFilteredItems(data || []);
    } catch (error) {
      debugError("Error fetching inventory:", error);
    }
  }, [currentProperty?.id]);

  // ✅ UPDATE ITEM STATUS FUNCTION
  const updateItemStatus = useCallback(
    async (itemId: string, status: "good" | "low" | "out") => {
      try {
        debugLog(`🔄 Updating item ${itemId} status to:`, status);

        const { error } = await supabase
          .from("inventory")
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", itemId);

        if (error) {
          debugError("❌ Error updating item status:", error);
          throw error;
        }

        debugLog("✅ Status updated successfully");
        await refreshItems();
      } catch (error) {
        debugError("❌ Error updating item status:", error);
      }
    },
    [refreshItems]
  );

  const handleEdit = useCallback((item: InventoryItem) => {
    debugLog("🔄 Editing item:", item.name);
    setEditingItem(item);
    setIsAddingItem(true);
  }, []);

  const handleDelete = useCallback(
    async (itemId: string) => {
      try {
        debugLog("🔄 Deleting item:", itemId);

        const { error } = await supabase
          .from("inventory")
          .update({ is_active: false })
          .eq("id", itemId);

        if (error) throw error;
        
        debugLog("✅ Item deleted successfully");
        await refreshItems();
      } catch (error) {
        debugError("Error deleting item:", error);
      }
    },
    [refreshItems]
  );

  const updateQuantity = useCallback(
    async (itemId: string, newQuantity: number) => {
      try {
        debugLog("🔄 Updating quantity for item:", itemId, "to:", newQuantity);

        const { error } = await supabase
          .from("inventory")
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", itemId);

        if (error) throw error;
        
        debugLog("✅ Quantity updated successfully");
        await refreshItems();
      } catch (error) {
        debugError("Error updating quantity:", error);
      }
    },
    [refreshItems]
  );

  // Load items when property changes
  useEffect(() => {
    refreshItems();
  }, [refreshItems]);

  // ✅ CRITICAL: RETURN ALL FUNCTIONS INCLUDING updateItemStatus
  return {
    items,
    filteredItems,
    setFilteredItems,
    isAddingItem,
    setIsAddingItem,
    editingItem,
    setEditingItem,
    handleEdit,
    handleDelete,
    updateQuantity,
    updateItemStatus, // ✅ THIS MUST BE HERE
    refreshItems,
  };
}
