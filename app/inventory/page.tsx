"use client";

export const dynamic = "force-dynamic";

import {
  Package,
  Plus,
  Settings,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import InventoryFilters from "@/components/inventory/InventoryFilters";

import InventoryTable from "@/components/inventory/InventoryTable";
import ItemModal from "@/components/inventory/ItemModal";
import ManageItemsModal from "@/components/ManageItemsModal";
import ShoppingListModal from "@/components/ShoppingListModal";

import { useInventory } from "@/components/inventory/hooks/useInventory";
import { useProperty } from "@/lib/hooks/useProperty";

export default function InventoryPage() {
  const inventoryHook = useInventory();
  const { currentProperty, currentTenant } = useProperty();
  const [showManageModal, setShowManageModal] = useState(false);
  const [showShoppingListModal, setShowShoppingListModal] = useState(false);

  // Close modal and refresh
  const handleModalClose = () => {
    setShowManageModal(false);
    inventoryHook.refreshItems();
  };

  // ✅ Simpler shopping list calculation - catches more items
  const shoppingListItems = useMemo(() => {
    if (!inventoryHook.filteredItems) return [];

    return inventoryHook.filteredItems.filter((item) => {
      // Only check explicit status - no automatic threshold logic
      return item.status === "low" || item.status === "out";
    });
  }, [inventoryHook.filteredItems]);

  // ✅ Memoize stats with corrected logic
  const stats = useMemo(() => {
    const items = inventoryHook.filteredItems || [];

    return {
      totalItems: items.length,
      goodStockItems: items.filter((item) => {
        // Check explicit status first
        if (item.status === "good") return true;
        if (item.status === "low" || item.status === "out") return false;

        // Fallback: quantity-based logic (but be more conservative)
        if (item.quantity === 0) return false;
        if (item.quantity <= (item.threshold || 5)) return false;
        return true;
      }).length,

      lowStockItems: items.filter((item) => {
        // Only check explicit status
        return item.status === "low";
      }).length,

      outOfStockItems: items.filter((item) => {
        // Check explicit status first
        if (item.status === "out") return true;
        if (item.status === "good" || item.status === "low") return false;

        // Fallback: only truly empty items
        return item.quantity === 0;
      }).length,
    };
  }, [inventoryHook.filteredItems]);

  const { totalItems, goodStockItems, lowStockItems, outOfStockItems } = stats;

  // Add this to handle URL parameters for quick actions
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("create-shopping-list") === "true") {
      setShowShoppingListModal(true);
      // Remove the parameter from URL
      window.history.replaceState({}, "", "/inventory");
    }

    if (params.get("add-item") === "true") {
      inventoryHook.setIsAddingItem(true);
      // Remove the parameter from URL
      window.history.replaceState({}, "", "/inventory");
    }
  }, []);

  // Add this to handle loading state for property
  if (!currentProperty?.id) {
    return (
      <StandardPageLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading property...</p>
          </div>
        </div>
      </StandardPageLayout>
    );
  }

  // Add this temporarily to see your threshold data
  console.log("🔍 Threshold Analysis:", {
    averageThreshold:
      inventoryHook.filteredItems?.reduce(
        (sum, item) => sum + (item.threshold || 0),
        0
      ) / (inventoryHook.filteredItems?.length || 1),
    thresholdRange: {
      min: Math.min(
        ...(inventoryHook.filteredItems?.map((item) => item.threshold || 0) || [
          0,
        ])
      ),
      max: Math.max(
        ...(inventoryHook.filteredItems?.map((item) => item.threshold || 0) || [
          0,
        ])
      ),
    },
    itemsWithHighThreshold: inventoryHook.filteredItems?.filter(
      (item) => (item.threshold || 0) > 10
    ).length,
  });

  return (
    <StandardPageLayout
      title="Inventory Management"
      subtitle={`${totalItems} items • ${
        currentProperty?.name || "your property"
      }`}
      headerIcon={<Package className="h-6 w-6 text-blue-600" />}
      headerActions={
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowManageModal(true)}
            className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Settings className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Manage</span>
          </button>
        </div>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StandardCard padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {goodStockItems}
            </div>
            <div className="text-sm text-gray-600">Well Stocked</div>
          </div>
        </StandardCard>

        <StandardCard padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {lowStockItems}
            </div>
            <div className="text-sm text-gray-600">Getting Low</div>
          </div>
        </StandardCard>

        <StandardCard padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {outOfStockItems}
            </div>
            <div className="text-sm text-gray-600">Out of Stock</div>
          </div>
        </StandardCard>
      </div>

      {/* Filters */}
      <StandardCard className="mb-6" padding="sm">
        <InventoryFilters
          items={inventoryHook.items}
          setFilteredItems={inventoryHook.setFilteredItems}
        />
      </StandardCard>

      {/* Main Inventory Table */}
      <StandardCard
        title="Inventory Items"
        subtitle={`${totalItems} items in inventory`}
        headerActions={
          <div className="flex items-center space-x-2">
            {outOfStockItems > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {outOfStockItems} out of stock
              </span>
            )}
            {lowStockItems > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {lowStockItems} low stock
              </span>
            )}
          </div>
        }
      >
        <InventoryTable
          items={inventoryHook.filteredItems || []}
          handleEdit={inventoryHook.handleEdit}
          handleDelete={inventoryHook.handleDelete}
          updateQuantity={inventoryHook.updateQuantity}
          updateItemStatus={(itemId, status) => {
            console.log("🔄 Direct call to updateItemStatus:", itemId, status);
            return inventoryHook.updateItemStatus?.(itemId, status);
          }}
        />
      </StandardCard>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end space-y-3 z-40">
        {/* Add Item Button */}
        <button
          onClick={() => inventoryHook.setIsAddingItem(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-105 flex items-center group overflow-hidden"
          aria-label="Add Item"
        >
          {/* Icon container */}
          <div className="p-4 flex items-center">
            <Plus className="h-6 w-6 flex-shrink-0" />
          </div>

          {/* Expandable text - starts collapsed, expands on hover */}
          <div className="max-w-0 group-hover:max-w-[160px] overflow-hidden transition-all duration-500 ease-out">
            <div className="pr-6 opacity-0 group-hover:opacity-100 transition-opacity duration-400 delay-150">
              <span className="whitespace-nowrap font-medium">Add Item</span>
            </div>
          </div>
        </button>

        {/* Shopping List Button - Always visible */}
        <button
          onClick={() => setShowShoppingListModal(true)}
          className={`${
            shoppingListItems.length > 0
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-500 hover:bg-gray-600"
          } text-white rounded-full shadow-lg transition-all duration-300 hover:scale-105 flex items-center group overflow-hidden`}
          aria-label="Shopping List"
        >
          {/* Icon container with badge */}
          <div className="p-4 flex items-center relative">
            <ShoppingCart className="h-6 w-6 flex-shrink-0" />

            {/* Badge with count */}
            {shoppingListItems.length > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                {shoppingListItems.length}
              </span>
            )}
          </div>

          {/* Expandable text */}
          <div className="max-w-0 group-hover:max-w-[140px] overflow-hidden transition-all duration-300 ease-in-out">
            <div className="pr-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
              <span className="whitespace-nowrap font-medium text-sm">
                Shopping List
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Modals */}
      <ItemModal {...inventoryHook} />
      <ManageItemsModal
        isOpen={showManageModal}
        onClose={handleModalClose}
        inventoryHook={inventoryHook}
      />
      <ShoppingListModal
        isOpen={showShoppingListModal}
        onClose={() => setShowShoppingListModal(false)}
        items={shoppingListItems} // ✅ Use actual shopping list items
      />
    </StandardPageLayout>
  );
}
