"use client";

export const dynamic = "force-dynamic";

import {
  Package,
  Plus,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import InventoryFilters from "@/components/InventoryFilters";
import InventoryTable from "@/components/InventoryTable";
import ItemModal from "@/components/ItemModal";
import ManageItemsModal from "@/components/ManageItemsModal";

import { useInventory } from "@/components/inventory/hooks/useInventory";
import { useProperty } from "@/lib/hooks/useProperty";

export default function InventoryPage() {
  const inventoryHook = useInventory();
  const { currentProperty } = useProperty();
  const [showManageModal, setShowManageModal] = useState(false);

  // Close modal and refresh
  const handleModalClose = () => {
    setShowManageModal(false);
    inventoryHook.refreshItems();
  };

  // Calculate stats based on filteredItems, not items
  const totalItems = inventoryHook.filteredItems?.length || 0;
  const lowStockItems = inventoryHook.filteredItems?.filter(
    (item) => item.quantity <= item.threshold && item.quantity > 0
  ).length || 0;
  const outOfStockItems = inventoryHook.filteredItems?.filter(
    (item) => item.quantity === 0
  ).length || 0;

  return (
    <StandardPageLayout
      title="Inventory Management"
      subtitle={`Manage supplies and track stock levels for ${currentProperty?.name || "your property"}`}
      headerIcon={<Package className="h-6 w-6 text-blue-600" />}
      headerActions={
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowManageModal(true)}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Items
          </button>
          <button
            onClick={() => inventoryHook.setIsAddingItem(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </button>
        </div>
      }
    >
      {/* Inventory Filters */}
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
            {lowStockItems > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {lowStockItems} low stock
              </span>
            )}
            {outOfStockItems > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {outOfStockItems} out of stock
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
        />
      </StandardCard>

      {/* Add Item Modal */}
      <ItemModal {...inventoryHook} />

      {/* Manage Items Modal */}
      <ManageItemsModal
        isOpen={showManageModal}
        onClose={handleModalClose}
        inventoryHook={inventoryHook}
      />
    </StandardPageLayout>
  );
}
