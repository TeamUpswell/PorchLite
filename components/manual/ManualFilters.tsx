// components/manual/ManualFilters.tsx
"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";

interface ManualFiltersProps {
  sections: any[];
  onFilterChange?: (filteredItems: any[]) => void;
  setFilteredSections?: (items: any[]) => void;
}

export default function ManualFilters({
  sections,
  onFilterChange,
  setFilteredSections,
}: ManualFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter sections based on search only for now
  useEffect(() => {
    let filtered = sections || [];

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (section) =>
          section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          section.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          section.manual_items?.some(
            (item) =>
              item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.content.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Update filtered sections
    if (setFilteredSections) {
      setFilteredSections(filtered);
    }
    if (onFilterChange) {
      onFilterChange(filtered);
    }
  }, [sections, searchTerm, setFilteredSections, onFilterChange]);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="grid grid-cols-1 gap-4">
        {/* Search Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Search Manual
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search sections, items, or instructions..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {searchTerm && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setSearchTerm("")}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear Search
          </button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onFilterChange("all")}
          className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300"
        >
          All
        </button>
      </div>
    </div>
  );
}
