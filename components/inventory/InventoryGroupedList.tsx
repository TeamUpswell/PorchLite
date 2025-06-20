"use client";

import { useInventoryCategories } from "@/lib/hooks/useInventoryCategories";
import { getCategoryIcon } from "@/components/ui/utils"; // Adjust this path if getCategoryIcon is elsewhere
import InventoryItemCard from "./InventoryItemCard"; // Assuming this is also in the inventory folder

// components/InventoryGroupedList.tsx - Group items by category with icons
export default function InventoryGroupedList({
  items,
  onEditItem,
  onDeleteItem,
}) {
  const { categories } = useInventoryCategories();

  // Group items by category
  const groupedItems = items.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(groupedItems).map(([categoryName, categoryItems]) => {
        const categoryIcon = getCategoryIcon(categoryName, categories);

        return (
          <div key={categoryName}>
            {/* Category Header */}
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">{categoryIcon}</span>
              <h2 className="text-xl font-semibold text-gray-900 capitalize">
                {categoryName}
              </h2>
              <span className="text-sm text-gray-500">
                ({categoryItems.length} items)
              </span>
            </div>

            {/* Items in this category */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryItems.map((item) => (
                <InventoryItemCard
                  key={item.id}
                  item={item}
                  categoryIcon={categoryIcon}
                  onEdit={onEditItem}
                  onDelete={onDeleteItem}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
