"use client";

// ✅ Add debug log to confirm this page loads
console.log("📦 CORRECT INVENTORY PAGE LOADED - /app/inventory/page.tsx");

import { useViewMode } from "@/lib/hooks/useViewMode";
import {
  Package,
  Plus,
  Settings,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import StandardCard from "@/components/ui/StandardCard";
import InventoryFilters from "@/components/inventory/InventoryFilters";
import InventoryTable from "@/components/inventory/InventoryTable";
import ItemModal from "@/components/inventory/ItemModal";
import ManageItemsModal from "@/components/ManageItemsModal";
import ShoppingListModal from "@/components/ShoppingListModal";

import { useInventory } from "@/components/inventory/hooks/useInventory";
import { useProperty } from "@/lib/hooks/useProperty";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import PageContainer from "@/components/layout/PageContainer";

export const dynamic = "force-dynamic";

export default function InventoryPage() {
  // ✅ ALL HOOKS FIRST
  const inventoryHook = useInventory();
  const {
    currentProperty: property,
    currentTenant,
    loading: propertyLoading,
    error,
  } = useProperty();
  const { isManagerView, isFamilyView, isGuestView } = useViewMode();
  const [showManageModal, setShowManageModal] = useState(false);
  const [showShoppingListModal, setShowShoppingListModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // ✅ useMemo and useEffect AFTER basic hooks
  const shoppingListItems = useMemo(() => {
    if (!inventoryHook.filteredItems) return [];
    return inventoryHook.filteredItems.filter((item) => {
      return item.status === "low" || item.status === "out";
    });
  }, [inventoryHook.filteredItems]);

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

  // ✅ Console logs AFTER hooks
  console.log("📦 Inventory Page Debug:", {
    propertyId: property?.id,
    propertyName: property?.name,
    tenantRole: currentTenant?.role,
    isManagerView,
    isFamilyView,
    isGuestView,
    inventoryItemsCount: inventoryHook.items?.length || 0,
    filteredItemsCount: inventoryHook.filteredItems?.length || 0,
  });

  // Close modal and refresh
  const handleModalClose = () => {
    setShowManageModal(false);
    inventoryHook.refreshItems();
  };

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

  // ✅ CONDITIONAL RENDERS LAST
  if (propertyLoading) {
    return (
      <ProtectedPageWrapper>
        <PageContainer>
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading property...</p>
            </div>
          </div>
        </PageContainer>
      </ProtectedPageWrapper>
    );
  }

  if (error) {
    return (
      <ProtectedPageWrapper>
        <PageContainer>
          <div className="text-center py-8">
            <p className="text-red-600">
              Error loading property: {error.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Retry
            </button>
          </div>
        </PageContainer>
      </ProtectedPageWrapper>
    );
  }

  if (!property?.id) {
    console.log("❌ No property found:", { property, currentTenant });
    return (
      <ProtectedPageWrapper>
        <PageContainer>
          <div className="text-center py-8">
            <p className="text-gray-600">No property selected</p>
            <p className="text-sm text-gray-500 mt-2">
              Please select a property from your dashboard
            </p>
          </div>
        </PageContainer>
      </ProtectedPageWrapper>
    );
  }

  if (!currentTenant) {
    console.log("❌ No tenant found:", { property, currentTenant });
    return (
      <ProtectedPageWrapper>
        <PageContainer>
          <div className="text-center py-8">
            <p className="text-red-600">Access denied</p>
            <p className="text-sm text-gray-500 mt-2">
              You don't have access to this property
            </p>
          </div>
        </PageContainer>
      </ProtectedPageWrapper>
    );
  }

  return (
    <ProtectedPageWrapper>
      <PageContainer>
        <div className="space-y-6">
          {/* ❌ REMOVE this entire header section (lines ~225-250) */}
          {/* 
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Inventory</h1>
            
            <div className="flex gap-2">
              {(isManagerView || isFamilyView) && (
                <button
                  onClick={() => inventoryHook.setIsAddingItem(true)}
                  className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Add Item</span>
                </button>
              )}
              
              {isManagerView && (
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Package className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Import Items</span>
                </button>
              )}
            </div>
          </div>
          */}

          {/* ✅ Keep the Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

          {/* ✅ Keep the rest of your component as-is */}
          <StandardCard className="mb-6" padding="sm">
            <InventoryFilters
              items={inventoryHook.items}
              setFilteredItems={inventoryHook.setFilteredItems}
            />
          </StandardCard>

          {/* ✅ Keep the Main Inventory Table */}
          <StandardCard
            title="Inventory Items"
            subtitle={`${totalItems} items in inventory`}
            headerActions={
              <div className="flex items-center space-x-2">
                {/* ✅ Keep the Manage Button - this is in the card header */}
                <button
                  onClick={() => setShowManageModal(true)}
                  className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Manage</span>
                </button>

                {/* ✅ Keep status indicators */}
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
            {/* ✅ Keep the inventory table */}
            <InventoryTable
              items={inventoryHook.filteredItems || []}
              handleEdit={inventoryHook.handleEdit}
              handleDelete={inventoryHook.handleDelete}
              updateQuantity={inventoryHook.updateQuantity}
              updateItemStatus={(itemId, status) => {
                console.log(
                  "🔄 Direct call to updateItemStatus:",
                  itemId,
                  status
                );
                return inventoryHook.updateItemStatus?.(itemId, status);
              }}
            />
          </StandardCard>

          {/* ✅ Keep your beautiful floating action buttons */}
          <div className="fixed bottom-6 right-6 flex flex-col items-end space-y-3 z-40">
            {/* Add Item Button */}
            <button
              onClick={() => inventoryHook.setIsAddingItem(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-105 flex items-center group overflow-hidden"
              aria-label="Add Item"
            >
              <div className="p-4 flex items-center">
                <Plus className="h-6 w-6 flex-shrink-0" />
              </div>
              <div className="max-w-0 group-hover:max-w-[160px] overflow-hidden transition-all duration-500 ease-out">
                <div className="pr-6 opacity-0 group-hover:opacity-100 transition-opacity duration-400 delay-150">
                  <span className="whitespace-nowrap font-medium">
                    Add Item
                  </span>
                </div>
              </div>
            </button>

            {/* Shopping List Button */}
            <button
              onClick={() => setShowShoppingListModal(true)}
              className={`${
                shoppingListItems.length > 0
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-500 hover:bg-gray-600"
              } text-white rounded-full shadow-lg transition-all duration-300 hover:scale-105 flex items-center group overflow-hidden`}
              aria-label="Shopping List"
            >
              <div className="p-4 flex items-center relative">
                <ShoppingCart className="h-6 w-6 flex-shrink-0" />
                {shoppingListItems.length > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {shoppingListItems.length}
                  </span>
                )}
              </div>
              <div className="max-w-0 group-hover:max-w-[140px] overflow-hidden transition-all duration-300 ease-in-out">
                <div className="pr-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                  <span className="whitespace-nowrap font-medium text-sm">
                    Shopping List
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* ✅ Keep the modals */}
          <ItemModal {...inventoryHook} />
          <ManageItemsModal
            isOpen={showManageModal}
            onClose={handleModalClose}
            inventoryHook={inventoryHook}
          />
          <ShoppingListModal
            isOpen={showShoppingListModal}
            onClose={() => setShowShoppingListModal(false)}
            items={shoppingListItems}
          />
        </div>
      </PageContainer>
    </ProtectedPageWrapper>
  );
}
