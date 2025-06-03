// components/inventory/InventoryTable.tsx
"use client";

import React, { useState } from "react";
import { Edit, Trash2 } from "lucide-react";

interface InventoryTableProps {
  items: any[];
  handleEdit: (item: any) => void;
  handleDelete: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateItemStatus: (itemId: string, status: "good" | "low" | "out") => void;
}

export default function InventoryTable({
  items,
  handleEdit,
  handleDelete,
  updateQuantity,
  updateItemStatus,
}: InventoryTableProps) {
  const [optimisticStatuses, setOptimisticStatuses] = useState<
    Record<string, string>
  >({});

  const getItemStatus = (item: any) => {
    // Check optimistic status first
    if (optimisticStatuses[item.id]) {
      return optimisticStatuses[item.id];
    }

    // Check explicit status first
    if (item.status === "out") return "out";
    if (item.status === "low") return "low";
    if (item.status === "good") return "good";

    // ✅ SIMPLIFIED TEST - Only check for truly out of stock
    if (item.quantity === 0) return "out";
    // ❌ TEMPORARILY COMMENT OUT THRESHOLD CHECK
    // if (item.quantity <= (item.threshold || 5)) return "low";
    return "good";
  };

  const handleStatusUpdate = async (
    itemId: string,
    newStatus: "good" | "low" | "out"
  ) => {
    // Immediately update UI for responsive feedback
    setOptimisticStatuses((prev) => ({
      ...prev,
      [itemId]: newStatus,
    }));

    try {
      await updateItemStatus(itemId, newStatus);
      // Clear optimistic status once real update is done
      setOptimisticStatuses((prev) => {
        const newStatuses = { ...prev };
        delete newStatuses[itemId];
        return newStatuses;
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      // Revert optimistic update on error
      setOptimisticStatuses((prev) => {
        const newStatuses = { ...prev };
        delete newStatuses[itemId];
        return newStatuses;
      });
    }
  };

  console.log("🔍 Status Debug:", {
    totalItems: items.length,
    statusBreakdown: items.map((item) => ({
      name: item.name,
      dbStatus: item.status,
      quantity: item.quantity,
      threshold: item.threshold,
      calculatedStatus: getItemStatus(item),
    })),
    counts: {
      good: items.filter((item) => getItemStatus(item) === "good").length,
      low: items.filter((item) => getItemStatus(item) === "low").length,
      out: items.filter((item) => getItemStatus(item) === "out").length,
    },
  });
  console.log(
    "🔍 First 5 Items Detail:",
    items.slice(0, 5).map((item) => ({
      name: item.name,
      quantity: item.quantity,
      threshold: item.threshold,
      status: item.status,
      wouldBeLow: item.quantity <= (item.threshold || 5),
      calculatedStatus: getItemStatus(item),
    }))
  );

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No items found</div>
        <div className="text-gray-400 text-sm mt-1">
          Add your first inventory item to get started.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Status Summary */}
      <div className="mb-4 flex space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <span className="text-sm text-gray-600">
            {items.filter((item) => getItemStatus(item) === "good").length} Well
            Stocked
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
          <span className="text-sm text-gray-600">
            {items.filter((item) => getItemStatus(item) === "low").length}{" "}
            Running Low
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
          <span className="text-sm text-gray-600">
            {items.filter((item) => getItemStatus(item) === "out").length} Out
            of Stock
          </span>
        </div>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Item Name
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => {
            const status = getItemStatus(item);
            const isOutOfStock = status === "out";
            const isLowStock = status === "low";
            const isGoodStock = status === "good";

            return (
              <tr
                key={item.id}
                className={`
                  ${isOutOfStock ? "bg-red-50 border-l-4 border-red-400" : ""}
                  ${
                    isLowStock
                      ? "bg-yellow-50 border-l-4 border-yellow-400"
                      : ""
                  }
                  ${
                    isGoodStock ? "bg-green-50 border-l-4 border-green-400" : ""
                  }
                  hover:bg-gray-50 transition-colors
                `}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div
                      className={`text-sm font-medium ${
                        isOutOfStock
                          ? "text-red-900"
                          : isLowStock
                          ? "text-yellow-900"
                          : "text-gray-900"
                      }`}
                    >
                      {item.name}
                    </div>
                    {item.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {item.description}
                      </div>
                    )}
                    <div className="text-xs mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          status === "good"
                            ? "bg-green-100 text-green-800"
                            : status === "low"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {status === "good" && "✅ Well Stocked"}
                        {status === "low" && "⚠️ Running Low"}
                        {status === "out" && "🔴 Out of Stock"}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1">
                    <button
                      onClick={() => handleStatusUpdate(item.id, "good")}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        getItemStatus(item) === "good"
                          ? "bg-green-100 text-green-800 border-2 border-green-300"
                          : "bg-gray-100 text-gray-600 hover:bg-green-50"
                      }`}
                    >
                      ✅ Good
                    </button>

                    <button
                      onClick={() => handleStatusUpdate(item.id, "low")}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        getItemStatus(item) === "low"
                          ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-300"
                          : "bg-gray-100 text-gray-600 hover:bg-yellow-50"
                      }`}
                    >
                      ⚠️ Low
                    </button>

                    <button
                      onClick={() => handleStatusUpdate(item.id, "out")}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        getItemStatus(item) === "out"
                          ? "bg-red-100 text-red-800 border-2 border-red-300"
                          : "bg-gray-100 text-gray-600 hover:bg-red-50"
                      }`}
                    >
                      🔴 Out
                    </button>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Edit item"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Delete item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
