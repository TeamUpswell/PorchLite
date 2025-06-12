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
} from "lucide-react";
import StandardCard from "@/components/ui/StandardCard";
import InventoryFilters from "@/components/inventory/InventoryFilters";
import InventoryTable from "@/components/inventory/InventoryTable";
import ItemModal from "@/components/inventory/ItemModal";
import ManageItemsModal from "@/components/ManageItemsModal";
import ShoppingListModal from "@/components/ShoppingListModal";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import { useInventory } from "@/components/inventory/hooks/useInventory";
import { useProperty } from "@/lib/hooks/useProperty";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import PageContainer from "@/components/layout/PageContainer";
import { debugLog, debugError } from "@/lib/utils/debug";
import { supabase } from "@/lib/supabase"; // ✅ Add missing import
import toast from "react-hot-toast"; // ✅ Add missing import
import Header from "@/components/layout/Header";

const isDev = process.env.NODE_ENV === "development";

export const dynamic = "force-dynamic";

// ✅ Define missing components
const LoadingComponent = () => (
  <div className="flex items-center justify-center min-h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-2 text-gray-600">Loading...</p>
    </div>
  </div>
);

const NoPropertyComponent = () => (
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

const LoadingInventoryComponent = () => (
  <ProtectedPageWrapper>
    <PageContainer>
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    </PageContainer>
  </ProtectedPageWrapper>
);

// ✅ Add missing interface
interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  threshold?: number;
  status: "good" | "low" | "out";
  // Add other properties as needed
}

export default function InventoryPage() {
  // ✅ All hooks first
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const inventoryHook = useInventory();
  const {
    currentProperty: property,
    currentTenant,
    loading: propertyLoadingInventory,
    error,
  } = useProperty();
  const { isManagerView, isFamilyView, isGuestView } = useViewMode();

  // ✅ State declarations
  const [showManageModal, setShowManageModal] = useState(false);
  const [showShoppingListModal, setShowShoppingListModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [filter, setFilter] = useState("all");

  // ✅ Memoized values
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

  // ✅ Move threshold analysis inside useEffect to avoid render phase updates
  const [thresholdAnalysis, setThresholdAnalysis] = useState({
    averageThreshold: 0,
    thresholdRange: { min: 0, max: 0 },
    itemsWithHighThreshold: 0,
  });

  // ✅ Effects
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

  useEffect(() => {
    debugLog("📦 CORRECT INVENTORY PAGE LOADED - /app/inventory/page.tsx");
  }, []);

  useEffect(() => {
    debugLog("📦 Inventory Page Debug:", {
      propertyId: property?.id,
      propertyName: property?.name,
      tenantRole: currentTenant?.role,
      isManagerView,
      isFamilyView,
      isGuestView,
    });
  }, [property, currentTenant, isManagerView, isFamilyView, isGuestView]);

  // ✅ Move threshold analysis to useEffect
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

  // ✅ Functions
  const handleModalClose = () => {
    setShowManageModal(false);
    inventoryHook.refreshItems();
  };

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

  // ✅ Early returns
  if (authLoading || propertyLoading) {
    return (
      <ProtectedPageWrapper>
        <Header title="Inventory" />
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading inventory...</p>
            </div>
          </div>
        </PageContainer>
      </ProtectedPageWrapper>
    );
  }

  if (!user) {
    return null;
  }

  if (!currentProperty) {
    return <NoPropertyComponent />;
  }

  if (loading) {
    return <LoadingInventoryComponent />;
  }

  if (propertyLoadingInventory) {
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
    <div className="p-6">
      <Header title="Inventory" />
      <PageContainer>
        <div className="space-y-6">
          {/* Stats Cards */}
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
                <button
                  onClick={() => setShowManageModal(true)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Manage</span>
                </button>

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
                console.log(
                  "🔄 Direct call to updateItemStatus:",
                  itemId,
                  status
                );
                return inventoryHook.updateItemStatus?.(itemId, status);
              }}
            />
          </StandardCard>

          {/* Floating Action Buttons */}
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
      </PageContainer>
    </div>
  );
}
