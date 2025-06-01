// components/InventoryTable.tsx
"use client";

import React from "react";
import { Edit, Trash2, Plus, Minus } from "lucide-react";

interface InventoryTableProps {
  items: any[];
  handleEdit: (item: any) => void;
  handleDelete: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
}

export default function InventoryTable({
  items,
  handleEdit,
  handleDelete,
  updateQuantity,
}: InventoryTableProps) {
  const getItemStatus = (item: any) => {
    if (item.status) return item.status;
    // Fallback to quantity-based logic for existing items
    if (item.quantity === 0) return "out";
    if (item.quantity <= item.threshold) return "low";
    return "good";
  };

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
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Item Name
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quantity
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => {
            const isOutOfStock = item.quantity === 0;
            const isLowStock =
              item.quantity <= item.threshold && item.quantity > 0;

            return (
              <tr
                key={item.id}
                className={`
                  ${isOutOfStock ? "bg-red-50 border-l-4 border-red-400" : ""}
                  ${isLowStock ? "bg-yellow-50" : ""}
                  hover:bg-gray-50 transition-colors
                `}
              >
                {/* Item Name */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div
                      className={`text-sm font-medium ${
                        isOutOfStock ? "text-red-900" : "text-gray-900"
                      }`}
                    >
                      {item.name}
                    </div>
                    {item.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {item.description}
                      </div>
                    )}
                  </div>
                </td>

                {/* Status Controls instead of quantity */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-1">
                    <button
                      onClick={() => updateItemStatus(item.id, "good")}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        getItemStatus(item) === "good"
                          ? "bg-green-100 text-green-800 border-2 border-green-300"
                          : "bg-gray-100 text-gray-600 hover:bg-green-50"
                      }`}
                    >
                      ✅ Good
                    </button>

                    <button
                      onClick={() => updateItemStatus(item.id, "low")}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        getItemStatus(item) === "low"
                          ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-300"
                          : "bg-gray-100 text-gray-600 hover:bg-yellow-50"
                      }`}
                    >
                      ⚠️ Low
                    </button>

                    <button
                      onClick={() => updateItemStatus(item.id, "out")}
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

                {/* Mobile: Single status selector */}
                <td className="px-6 py-4 whitespace-nowrap md:hidden">
                  <select
                    value={getItemStatus(item)}
                    onChange={(e) => updateItemStatus(item.id, e.target.value)}
                    className={`w-full px-3 py-1 rounded border text-sm font-medium ${
                      getItemStatus(item) === "good"
                        ? "border-green-300 bg-green-50 text-green-800"
                        : getItemStatus(item) === "low"
                        ? "border-yellow-300 bg-yellow-50 text-yellow-800"
                        : "border-red-300 bg-red-50 text-red-800"
                    }`}
                  >
                    <option value="good">✅ Well Stocked</option>
                    <option value="low">⚠️ Getting Low</option>
                    <option value="out">🔴 Out of Stock</option>
                  </select>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
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
