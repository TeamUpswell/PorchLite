"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/auth";
import { useViewMode } from "@/lib/hooks/useViewMode";
import {
  Package,
  Plus,
  Settings,
  AlertTriangle,
  ShoppingCart,
  Home as HomeIcon,
} from "lucide-react";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import InventoryFilters from "@/components/inventory/InventoryFilters";
import InventoryTable from "@/components/inventory/InventoryTable";
import ItemModal from "@/components/inventory/ItemModal";
import ManageItemsModal from "@/components/ManageItemsModal";
import ShoppingListModal from "@/components/ShoppingListModal";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import { useInventory } from "@/components/inventory/hooks/useInventory";
import { useProperty } from "@/lib/hooks/useProperty";
import { debugLog, debugError } from "@/lib/utils/debug";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const isDev = process.env.NODE_ENV === "development";

export const dynamic = "force-dynamic";

// Enhanced interface
interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  threshold?: number;
  status: "good" | "low" | "out";
  property_id: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function InventoryPage() {
  // ✅ ALL HOOKS FIRST
  const { user, loading: authLoading } = useAuth();
  const {
    currentProperty,
    currentTenant,
    loading: propertyLoading,
    error: propertyError,
  } = useProperty();
  const inventoryHook = useInventory();
  const { isManagerView, isFamilyView, isGuestView } = useViewMode();
  const router = useRouter();

  // ✅ STATE DECLARATIONS
  const [showManageModal, setShowManageModal] = useState(false);
  const [showShoppingListModal, setShowShoppingListModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [filter, setFilter] = useState("all");

  // ✅ MEMOIZED VALUES
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
        if (item.status === "good") return true;
        if (item.status === "low" || item.status === "out") return false;
        if (item.quantity === 0) return false;
        if (item.quantity <= (item.threshold || 5)) return false;
        return true;
      }).length,

      lowStockItems: items.filter((item) => {
        return item.status === "low";
      }).length,

      outOfStockItems: items.filter((item) => {
        if (item.status === "out") return true;
        if (item.status === "good" || item.status === "low") return false;
        return item.quantity === 0;
      }).length,
    };
  }, [inventoryHook.filteredItems]);

  const { totalItems, goodStockItems, lowStockItems, outOfStockItems } = stats;

  const propertyId = useMemo(() => currentProperty?.id, [currentProperty?.id]);
  const userId = useMemo(() => user?.id, [user?.id]);

  // Threshold analysis state
  const [thresholdAnalysis, setThresholdAnalysis] = useState({
    averageThreshold: 0,
    thresholdRange: { min: 0, max: 0 },
    itemsWithHighThreshold: 0,
  });

  // ✅ URL PARAMS EFFECT
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("create-shopping-list") === "true") {
      setShowShoppingListModal(true);
      window.history.replaceState({}, "", "/inventory");
    }

    if (params.get("add-item") === "true") {
      inventoryHook.setIsAddingItem(true);
      window.history.replaceState({}, "", "/inventory");
    }
  }, []);

  // ✅ DEBUG EFFECTS
  useEffect(() => {
    debugLog("📦 INVENTORY PAGE LOADED - /app/inventory/page.tsx");
  }, []);

  useEffect(() => {
    debugLog("📦 Inventory Page Debug:", {
      propertyId: currentProperty?.id,
      propertyName: currentProperty?.name,
      userOwnsProperty: currentProperty?.created_by === user?.id,
      isManagerView,
      isFamilyView,
      isGuestView,
    });
  }, [
    currentProperty,
    user,
    isManagerView,
    isFamilyView,
    isGuestView,
  ]);

  // ✅ THRESHOLD ANALYSIS EFFECT
  useEffect(() => {
    if (inventoryHook.filteredItems) {
      const analysis = {
        averageThreshold:
          inventoryHook.filteredItems.reduce(
            (sum, item) => sum + (item.threshold || 0),
            0
          ) / (inventoryHook.filteredItems.length || 1),
        thresholdRange: {
          min: Math.min(
            ...(inventoryHook.filteredItems.map(
              (item) => item.threshold || 0
            ) || [0])
          ),
          max: Math.max(
            ...(inventoryHook.filteredItems.map(
              (item) => item.threshold || 0
            ) || [0])
          ),
        },
        itemsWithHighThreshold: inventoryHook.filteredItems.filter(
          (item) => (item.threshold || 0) > 10
        ).length,
      };

      setThresholdAnalysis(analysis);
      debugLog("🔍 Threshold Analysis:", analysis);
    }
  }, [inventoryHook.filteredItems]);

  // ✅ LOAD INVENTORY FUNCTION
  const loadInventory = async () => {
    if (!propertyId) {
      console.log("❌ No property ID, skipping inventory fetch");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("property_id", propertyId)
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("❌ Error loading inventory:", error);
        if (hasInitialized) {
          toast.error("Failed to load inventory");
        }
      } else {
        setInventory(data || []);
        console.log("✅ Loaded inventory:", data?.length || 0, "items");
      }
    } catch (error) {
      console.error("❌ Unexpected error:", error);
      if (hasInitialized) {
        toast.error("Failed to load inventory");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ MAIN DATA LOADING EFFECT
  useEffect(() => {
    if (authLoading || propertyLoading) {
      return;
    }

    if (!userId || !propertyId) {
      console.log("⏳ Waiting for user and property to load...");
      setLoading(false);
      setHasInitialized(true);
      return;
    }

    console.log("🏠 Loading inventory for:", currentProperty?.name);
    setHasInitialized(true);
    loadInventory();
  }, [userId, propertyId, authLoading, propertyLoading]);

  // ✅ MODAL HANDLERS
  const handleModalClose = () => {
    setShowManageModal(false);
    inventoryHook.refreshItems();
  };

  // ✅ EARLY RETURNS AFTER ALL HOOKS
  if (authLoading || propertyLoading) {
    return (
      <div className="p-6">
        <Header title="Inventory" />
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-600">
                  {authLoading ? "Authenticating..." : "Loading property..."}
                </p>
              </div>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  if (!user) {
    return null; // Auth will redirect
  }

  if (propertyError) {
    return (
      <div className="p-6">
        <Header title="Inventory" />
        <PageContainer>
          <StandardCard
            title="Property Access Error"
            subtitle="Unable to load property information"
          >
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Property Access Error
              </h3>
              <p className="text-red-600 mb-4">{propertyError}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  if (propertyError) {
    return (
      <div className="p-6">
        <Header title="Inventory" />
        <PageContainer>
          <StandardCard
            title="Property Access Error"
            subtitle="Unable to load property information"
          >
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Property Access Error
              </h3>
              <p className="text-red-600 mb-4">{propertyError}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  if (!currentProperty) {
    return (
      <div className="p-6">
        <Header title="Inventory" />
        <PageContainer>
          <StandardCard
            title="No Property Selected"
            subtitle="Select a property to manage inventory"
          >
            <div className="text-center py-12">
              <HomeIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No Property Selected
              </h3>
              <p className="text-gray-600 mb-6">
                Please select a property to view and manage its inventory.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => router.push("/properties")}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Select Property
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  // 🔧 FIX: Check if user owns the property instead of checking tenant
  const userOwnsProperty = currentProperty?.created_by === user?.id;

  if (!userOwnsProperty) {
    return (
      <div className="p-6">
        <Header title="Inventory" />
        <PageContainer>
          <StandardCard
            title="Access Denied"
            subtitle="You don't have permission to access this property"
          >
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600 mb-4">
                You don't have access to manage inventory for this property.
              </p>
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <Header title="Inventory" />
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Package className="mx-auto h-12 w-12 text-gray-300 mb-3 animate-pulse" />
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-600">Loading inventory...</p>
              </div>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  // ✅ MAIN INVENTORY PAGE
  return (
    <div className="p-6">
      <Header title="Inventory" />
      <PageContainer>
        <div className="space-y-6">
          <StandardCard
            title="Property Inventory"
            subtitle={`Manage inventory for ${currentProperty.name}`}
            headerActions={
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {totalItems} total items
                </span>
                {(outOfStockItems > 0 || lowStockItems > 0) && (
                  <div className="flex items-center gap-1">
                    {outOfStockItems > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {outOfStockItems} out
                      </span>
                    )}
                    {lowStockItems > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {lowStockItems} low
                      </span>
                    )}
                  </div>
                )}
              </div>
            }
          >
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StandardCard padding="sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {goodStockItems}
                    </div>
                    <div className="text-sm text-gray-600">Well Stocked</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {totalItems > 0
                        ? Math.round((goodStockItems / totalItems) * 100)
                        : 0}
                      % of inventory
                    </div>
                  </div>
                </StandardCard>

                <StandardCard padding="sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {lowStockItems}
                    </div>
                    <div className="text-sm text-gray-600">Getting Low</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Need restocking soon
                    </div>
                  </div>
                </StandardCard>

                <StandardCard padding="sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {outOfStockItems}
                    </div>
                    <div className="text-sm text-gray-600">Out of Stock</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {outOfStockItems > 0
                        ? "Immediate attention needed"
                        : "All good!"}
                    </div>
                  </div>
                </StandardCard>
              </div>

              {/* Quick Actions */}
              {(isManagerView || isFamilyView) && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => inventoryHook.setIsAddingItem(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </button>
                  <button
                    onClick={() => setShowShoppingListModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Shopping List
                    {shoppingListItems.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                        {shoppingListItems.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowManageModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage
                  </button>
                </div>
              )}

              {/* Filters */}
              <StandardCard padding="sm">
                <InventoryFilters
                  items={inventoryHook.items}
                  setFilteredItems={inventoryHook.setFilteredItems}
                />
              </StandardCard>

              {/* Main Inventory Table */}
              <StandardCard
                title="Inventory Items"
                subtitle={`${totalItems} items • ${currentProperty.name}`}
              >
                {inventoryHook.filteredItems?.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No inventory items found
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {totalItems === 0
                        ? "Get started by adding your first inventory item."
                        : "Try adjusting your filters to see more items."}
                    </p>
                    {(isManagerView || isFamilyView) && totalItems === 0 && (
                      <button
                        onClick={() => inventoryHook.setIsAddingItem(true)}
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Your First Item
                      </button>
                    )}
                  </div>
                ) : (
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
                )}
              </StandardCard>
            </div>
          </StandardCard>
        </div>
      </PageContainer>

      {/* Floating Action Buttons - Only for family/manager */}
      {(isManagerView || isFamilyView) && (
        <div className="fixed bottom-6 right-6 flex flex-col items-end space-y-3 z-50">
          <FloatingActionButton
            icon={Plus}
            label="Add Item"
            onClick={() => inventoryHook.setIsAddingItem(true)}
            variant="primary"
          />

          <div className="relative">
            <FloatingActionButton
              icon={ShoppingCart}
              label="Shopping List"
              onClick={() => setShowShoppingListModal(true)}
              variant={shoppingListItems.length > 0 ? "success" : "secondary"}
            />

            {shoppingListItems.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg ring-2 ring-white">
                {shoppingListItems.length > 99
                  ? "99+"
                  : shoppingListItems.length}
              </span>
            )}
          </div>
        </div>
      )}

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
        items={shoppingListItems}
      />
    </div>
  );
}
