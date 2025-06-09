// components/inventory/InventoryFilters.tsx - Show icons in category filter
"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useInventoryCategories } from "@/lib/hooks/useInventoryCategories";

interface InventoryFiltersProps {
  items: any[];
  onFilterChange?: (filteredItems: any[]) => void;
  setFilteredItems?: (items: any[]) => void;
}

export default function InventoryFilters({
  items,
  onFilterChange,
  setFilteredItems,
}: InventoryFiltersProps) {
  const { categories } = useInventoryCategories();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockLevel, setStockLevel] = useState("all");

  // Create filter categories with "All" option
  const filterCategories = [
    { id: "all", name: "All Categories", icon: "📦" },
    ...categories.map((cat) => ({
      id: cat.name,
      name: cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
      icon: cat.icon,
    })),
  ];

  // Filter items based on all criteria
  useEffect(() => {
    let filtered = items;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term) ||
          item.location?.toLowerCase().includes(term)
      );
    }

    // Update filtered items
    if (setFilteredItems) {
      setFilteredItems(filtered);
    }
    if (onFilterChange) {
      onFilterChange(filtered);
    }
  }, [
    items,
    searchTerm,
    selectedCategory,
    stockLevel,
    setFilteredItems,
    onFilterChange,
  ]);

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Search */}
      <div className="flex-1 min-w-64">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Category Filter with Icons */}
      <div className="min-w-48">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {filterCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stock Level Filter */}
      <div className="min-w-48">
        <select
          value={stockLevel}
          onChange={(e) => setStockLevel(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Stock Levels</option>
          <option value="in-stock">✅ In Stock</option>
          <option value="low-stock">⚠️ Low Stock</option>
          <option value="out-of-stock">❌ Out of Stock</option>
        </select>
      </div>

      {/* Clear Filters */}
      {(searchTerm || selectedCategory !== "all" || stockLevel !== "all") && (
        <button
          onClick={() => {
            setSearchTerm("");
            setSelectedCategory("all");
            setStockLevel("all");
          }}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
