"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import {
  QueueListIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { InventoryItem } from "../../../types/inventory";
import { useInventoryCategories } from "@/lib/hooks/useInventoryCategories";
import { getCategoryIcon } from "@/lib/utils/categoryUtils";
import { Edit3, Trash2, Package } from "lucide-react";

interface InventoryListProps {
  items: InventoryItem[];
  loading: boolean;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export default function InventoryList({
  onEdit,
  onDelete,
  items,
  loading,
}: InventoryListProps) {
  const [sortField, setSortField] = useState<keyof InventoryItem>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filter, setFilter] = useState("");
  const { categories } = useInventoryCategories();

  // Handle sorting
  const handleSort = (field: keyof InventoryItem) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort items
  const filteredAndSortedItems = [...items]
    .filter(
      (item) =>
        item.name.toLowerCase().includes(filter.toLowerCase()) ||
        (item.category?.toLowerCase() || "").includes(filter.toLowerCase()) ||
        (item.location &&
          item.location.toLowerCase().includes(filter.toLowerCase()))
    )
    .sort((a, b) => {
      const aValue = a[sortField] || "";
      const bValue = b[sortField] || "";

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        const numA = Number(aValue);
        const numB = Number(bValue);
        return sortDirection === "asc" ? numA - numB : numB - numA;
      }
    });

  // Table header cell component
  const TableHeader = ({
    field,
    label,
  }: {
    field: keyof InventoryItem;
    label: string;
  }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        <span>{label}</span>
        {sortField === field ? (
          <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
        ) : null}
      </div>
    </th>
  );

  if (loading) {
    return <div className="py-8 text-center">Loading inventory...</div>;
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No items found
        </h3>
        <p className="text-gray-600">
          Add your first inventory item to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Search and filter */}
      <div className="p-4 border-b border-gray-200">
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded-lg"
          placeholder="Search inventory..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <TableHeader field="name" label="Item Name" />
              <TableHeader field="category" label="Category" />
              <TableHeader field="quantity" label="Quantity" />
              <TableHeader field="location" label="Location" />
              <th className="px-4 py-3 relative">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No inventory items found.
                </td>
              </tr>
            ) : (
              filteredAndSortedItems.map((item) => {
                const categoryIcon = getCategoryIcon(item.category, categories);
                const isLowStock = item.quantity <= item.threshold;
                const isOutOfStock = item.quantity === 0;

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-500">
                      {item.location || "—"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        onClick={() => onEdit(item)}
                      >
                        <PencilIcon className="h-5 w-5" />
                        <span className="sr-only">Edit</span>
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => item.id && onDelete(item.id)}
                      >
                        <TrashIcon className="h-5 w-5" />
                        <span className="sr-only">Delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
