// components/contacts/ContactFilters.tsx
"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";

interface ContactFiltersProps {
  contacts: any[];
  onFilterChange?: (filteredItems: any[]) => void;
  setFilteredContacts?: (items: any[]) => void;
}

export default function ContactFilters({
  contacts,
  onFilterChange,
  setFilteredContacts,
}: ContactFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", name: "All Categories", icon: "👥" },
    { id: "maintenance", name: "Maintenance", icon: "🔧" },
    { id: "emergency", name: "Emergency", icon: "🚨" },
    { id: "vendor", name: "Vendor", icon: "🏪" },
    { id: "guest", name: "Guest", icon: "👤" },
    { id: "contractor", name: "Contractor", icon: "👷" },
    { id: "service", name: "Service", icon: "🛠️" },
  ];

  // Filter contacts based on search and category
  useEffect(() => {
    let filtered = contacts || [];

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.phone && contact.phone.includes(searchTerm)) ||
        (contact.address && contact.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.notes && contact.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(contact => contact.category === selectedCategory);
    }

    // Update filtered contacts
    if (setFilteredContacts) {
      setFilteredContacts(filtered);
    }
    if (onFilterChange) {
      onFilterChange(filtered);
    }
  }, [contacts, searchTerm, selectedCategory, setFilteredContacts, onFilterChange]);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Search Contacts
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone, or address..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id} className="text-gray-900">
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clear Filters */}
      {(searchTerm || selectedCategory !== "all") && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}