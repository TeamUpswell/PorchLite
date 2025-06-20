"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Package,
  Plus,
  Settings,
  AlertTriangle,
  ShoppingCart,
  Home as HomeIcon,
  Search,
  Filter,
} from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import InventoryFilters from "@/components/inventory/InventoryFilters";
import InventoryTable from "@/components/inventory/InventoryTable";
import ItemModal from "@/components/inventory/ItemModal";
import ManageItemsModal from "@/components/ManageItemsModal";
import ShoppingListModal from "@/components/ShoppingListModal";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import { useAuth } from "@/components/auth/AuthProvider";
import { useInventory } from "@/components/inventory/hooks/useInventory";
import { useProperty } from "@/lib/hooks/useProperty";
import { PropertyGuard } from "@/components/ui/PropertyGuard";
import { useRouter } from "next/navigation";

// Types
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

type ViewMode = "grid" | "list" | "card";

// Debug utilities
const debugLog = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log(message, ...args);
  }
};

export const dynamic = "force-dynamic";

export default function InventoryPage() {
  // Hooks
  const { user, loading: authLoading } = useAuth();
  const {
    currentProperty,
    loading: propertyLoading,
    error: propertyError,
  } = useProperty();
  const inventoryHook = useInventory();
  const router = useRouter();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showManageModal, setShowManageModal] = useState(false);
  const [showShoppingListModal, setShowShoppingListModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  // Refs for optimization
  const mountedRef = useRef(true);
  const urlParamsProcessedRef = useRef(false);

  // Memoized view permissions
  const viewPermissions = useMemo(() => {
    const userOwnsProperty = currentProperty?.created_by === user?.id;
    return {
      isManagerView: userOwnsProperty,
      isFamilyView: false, // Add logic as needed
      isGuestView: !userOwnsProperty,
      userOwnsProperty,
    };
  }, [currentProperty?.created_by, user?.id]);

  const { isManagerView, isFamilyView, isGuestView, userOwnsProperty } =
    viewPermissions;

  // Component cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // URL params processing - only once
  useEffect(() => {
    if (urlParamsProcessedRef.current) return;

    const params = new URLSearchParams(window.location.search);

    if (params.get("create-shopping-list") === "true") {
      setShowShoppingListModal(true);
      window.history.replaceState({}, "", "/inventory");
    }

    if (params.get("add-item") === "true") {
      inventoryHook.setIsAddingItem(true);
      window.history.replaceState({}, "", "/inventory");
    }

    urlParamsProcessedRef.current = true;
  }, [inventoryHook]);

  // Memoized filtered items with search
  const filteredItems = useMemo(() => {
    let items = inventoryHook.filteredItems || [];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      items = items.filter((item) => item.name.toLowerCase().includes(search));
    }

    // Apply status filter
    if (filter !== "all") {
      items = items.filter((item) => item.status === filter);
    }

    return items;
  }, [inventoryHook.filteredItems, searchTerm, filter]);

  // Memoized shopping list items
  const shoppingListItems = useMemo(() => {
    return filteredItems.filter(
      (item) => item.status === "low" || item.status === "out"
    );
  }, [filteredItems]);

  // Memoized stats
  const stats = useMemo(() => {
    const items = filteredItems;

    const goodStockItems = items.filter((item) => {
      if (item.status === "good") return true;
      if (item.status === "low" || item.status === "out") return false;
      if (item.quantity === 0) return false;
      if (item.quantity <= (item.threshold || 5)) return false;
      return true;
    }).length;

    const lowStockItems = items.filter((item) => item.status === "low").length;
    const outOfStockItems = items.filter(
      (item) =>
        item.status === "out" ||
        (item.status !== "good" && item.status !== "low" && item.quantity === 0)
    ).length;

    return {
      totalItems: items.length,
      goodStockItems,
      lowStockItems,
      outOfStockItems,
    };
  }, [filteredItems]);

  // Memoized handlers
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    []
  );

  const handleFilterChange = useCallback((newFilter: string) => {
    setFilter(newFilter);
  }, []);

  const handleModalClose = useCallback(() => {
    setShowManageModal(false);
    inventoryHook.refreshItems();
  }, [inventoryHook]);

  const handleAddItem = useCallback(() => {
    inventoryHook.setIsAddingItem(true);
  }, [inventoryHook]);

  const handleShowShoppingList = useCallback(() => {
    setShowShoppingListModal(true);
  }, []);

  const handleShowManage = useCallback(() => {
    setShowManageModal(true);
  }, []);

  // Memoized navigation handlers
  const navigationHandlers = useMemo(
    () => ({
      goToProperties: () => router.push("/properties"),
      goToDashboard: () => router.push("/"),
      reload: () => window.location.reload(),
    }),
    [router]
  );

  // Debug effect - only in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      debugLog("📦 INVENTORY PAGE LOADED - /app/inventory/page.tsx");
      debugLog("📦 Inventory Page Debug:", {
        propertyId: currentProperty?.id,
        propertyName: currentProperty?.name,
        userOwnsProperty,
        isManagerView,
        isFamilyView,
        isGuestView,
        totalItems: stats.totalItems,
      });
    }
  }, [
    currentProperty?.id,
    currentProperty?.name,
    userOwnsProperty,
    isManagerView,
    isFamilyView,
    isGuestView,
    stats.totalItems,
  ]);

  // Loading states
  if (authLoading || propertyLoading) {
    return (
      <StandardPageLayout>
        <StandardCard>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600">
                {authLoading
                  ? "⏳ Authenticating..."
                  : "🏠 Loading property..."}
              </p>
            </div>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (!user) {
    return null; // Auth will redirect
  }

  // Error states
  if (propertyError) {
    return (
      <StandardPageLayout>
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
              onClick={navigationHandlers.reload}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (!currentProperty) {
    return (
      <StandardPageLayout>
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
                onClick={navigationHandlers.goToProperties}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Select Property
              </button>
              <button
                onClick={navigationHandlers.goToDashboard}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (!userOwnsProperty) {
    return (
      <StandardPageLayout>
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
              You don&apos;t have access to manage inventory for this property.
            </p>
            <button
              onClick={navigationHandlers.goToDashboard}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (inventoryHook.loading) {
    return (
      <StandardPageLayout>
        <StandardCard>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-gray-300 mb-3 animate-pulse" />
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600">📦 Loading inventory...</p>
            </div>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  // Main render
  return (
    <PropertyGuard>
      <StandardPageLayout>
        <div className="space-y-6">
          <StandardCard
            title="Property Inventory"
            subtitle={`Manage inventory for ${currentProperty.name}`}
            headerActions={
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {stats.totalItems} total items
                </span>
                {(stats.outOfStockItems > 0 || stats.lowStockItems > 0) && (
                  <div className="flex items-center gap-1">
                    {stats.outOfStockItems > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {stats.outOfStockItems} out
                      </span>
                    )}
                    {stats.lowStockItems > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {stats.lowStockItems} low
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
                <StandardCard className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.goodStockItems}
                    </div>
                    <div className="text-sm text-gray-600">Well Stocked</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {stats.totalItems > 0
                        ? Math.round(
                            (stats.goodStockItems / stats.totalItems) * 100
                          )
                        : 0}
                      % of inventory
                    </div>
                  </div>
                </StandardCard>

                <StandardCard className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {stats.lowStockItems}
                    </div>
                    <div className="text-sm text-gray-600">Getting Low</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Need restocking soon
                    </div>
                  </div>
                </StandardCard>

                <StandardCard className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {stats.outOfStockItems}
                    </div>
                    <div className="text-sm text-gray-600">Out of Stock</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {stats.outOfStockItems > 0
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
                    onClick={handleAddItem}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </button>
                  <button
                    onClick={handleShowShoppingList}
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
                    onClick={handleShowManage}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage
                  </button>
                </div>
              )}

              {/* Search and Filters */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search inventory..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Items</option>
                  <option value="good">Well Stocked</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>

              {/* Main Inventory Table */}
              <StandardCard
                title="Inventory Items"
                subtitle={`${filteredItems.length} items • ${currentProperty.name}`}
              >
                {filteredItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No inventory items found
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {stats.totalItems === 0
                        ? "Get started by adding your first inventory item."
                        : searchTerm || filter !== "all"
                        ? "Try adjusting your search or filters to see more items."
                        : "No items match your current view."}
                    </p>
                    {(isManagerView || isFamilyView) &&
                      stats.totalItems === 0 && (
                        <button
                          onClick={handleAddItem}
                          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Add Your First Item
                        </button>
                      )}
                  </div>
                ) : (
                  <InventoryTable
                    items={filteredItems}
                    handleEdit={inventoryHook.handleEdit}
                    handleDelete={inventoryHook.handleDelete}
                    updateQuantity={inventoryHook.updateQuantity}
                    updateItemStatus={inventoryHook.updateItemStatus}
                  />
                )}
              </StandardCard>
            </div>
          </StandardCard>
        </div>

        {/* Floating Action Buttons */}
        {(isManagerView || isFamilyView) && (
          <div className="fixed bottom-6 right-6 flex flex-col items-end space-y-3 z-50">
            <FloatingActionButton
              icon={Plus}
              label="Add Item"
              onClick={handleAddItem}
              variant="primary"
            />

            <div className="relative">
              <FloatingActionButton
                icon={ShoppingCart}
                label="Shopping List"
                onClick={handleShowShoppingList}
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
      </StandardPageLayout>
    </PropertyGuard>
  );
}
