// components/inventory/hooks/useInventory.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useProperty } from "@/lib/hooks/useProperty";

export function useInventory() {
  const { currentProperty } = useProperty();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch items from database
  const fetchItems = useCallback(async () => {
    if (!currentProperty?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("property_id", currentProperty.id)
        .eq("is_active", true) // Only show active items
        .order("display_order", { ascending: true });

      if (error) throw error;

      setItems(data || []);
      setFilteredItems(data || []); // Initialize filteredItems with all items
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  }, [currentProperty?.id]);

  // Update quantity function
  const updateQuantity = useCallback(async (id: string, quantity: number) => {
    if (quantity < 0) return;
    
    try {
      console.log(`Updating item ${id} to quantity ${quantity}`);
      
      const { error } = await supabase
        .from('inventory')
        .update({ 
          quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state immediately
      const updateItemQuantity = (items) => 
        items.map(item => 
          item.id === id ? { ...item, quantity } : item
        );

      setItems(updateItemQuantity);
      setFilteredItems(updateItemQuantity);

      console.log(`✅ Successfully updated item ${id} to quantity ${quantity}`);
    } catch (error) {
      console.error('❌ Error updating quantity:', error);
      alert('Failed to update quantity. Please try again.');
    }
  }, []);

  // Handle edit function
  const handleEdit = useCallback((item) => {
    console.log('Editing item:', item);
    setEditingItem(item);
    setIsAddingItem(true);
  }, []);

  // Handle delete function
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      console.log(`Deleting item ${id}`);
      
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      const removeItem = (items) => items.filter(item => item.id !== id);
      setItems(removeItem);
      setFilteredItems(removeItem);

      console.log(`✅ Successfully deleted item ${id}`);
    } catch (error) {
      console.error('❌ Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  }, []);

  // Refresh function that ManageItemsModal can call
  const refreshItems = useCallback(async () => {
    console.log('🔄 Refreshing inventory items...');
    await fetchItems();
    console.log('✅ Inventory refresh completed');
  }, [fetchItems]);

  // Initial load
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Return ALL the functions the components need
  return {
    items,
    filteredItems,
    setFilteredItems,
    isAddingItem,
    setIsAddingItem,
    editingItem,
    setEditingItem,
    loading,
    refreshItems,
    fetchItems,
    updateQuantity,
    handleEdit,
    handleDelete,
  };
}
