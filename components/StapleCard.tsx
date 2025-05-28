// components/StapleCard.tsx
import { PlusIcon } from "@heroicons/react/24/outline";
import { ActionButton } from "./ui/Icons";
import { AllStaple, InventoryItem } from "./inventory/types";

interface StapleCardProps {
  staple: AllStaple;
  isManagingStaples: boolean;
  onQuickAdd: (staple: AllStaple) => void;
  onEdit: (staple: AllStaple) => void;
  onDelete: (staple: AllStaple) => void;
  items: InventoryItem[];
}

export default function StapleCard({
  staple,
  isManagingStaples,
  onQuickAdd,
  onEdit,
  onDelete,
  items,
}: StapleCardProps) {
  const isCustomStaple = staple.sourceTable === "custom_staples";

  // Check if this staple already exists in inventory
  const alreadyExists = items.some(
    (item) =>
      item.name.toLowerCase() === staple.name.toLowerCase() &&
      item.category === staple.category
  );

  if (alreadyExists) {
    return null; // Don't render staples that are already in inventory
  }

  return (
    <div className="relative group">
      {/* Management Controls - Positioned in corners */}
      {isManagingStaples && (
        <>
          {/* Edit button - Upper left - Blue by default */}
          <div className="absolute -top-1 -left-1 z-10">
            <ActionButton
              onClick={() => onEdit(staple)}
              title="Edit staple"
              variant="edit"
              size="sm"
              className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-blue-50 shadow-md"
            />
          </div>

          {/* Delete button - Upper right - Red by default */}
          <div className="absolute -top-1 -right-1 z-10">
            <ActionButton
              onClick={() => onDelete(staple)}
              title="Delete staple"
              variant="delete"
              size="sm"
              className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-red-50 shadow-md"
            />
          </div>
        </>
      )}

      {/* Staple Button */}
      <button
        onClick={() => onQuickAdd(staple)}
        disabled={isManagingStaples}
        className={`w-full p-2 border rounded-lg transition-colors ${
          isManagingStaples
            ? "border-gray-200 cursor-default bg-gray-50"
            : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
        } ${isCustomStaple ? "border-l-4 border-l-blue-200" : ""}`}
      >
        <div className="flex flex-col items-center space-y-1">
          {/* Icon */}
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              isManagingStaples
                ? "bg-gray-200"
                : "bg-gray-100 group-hover:bg-blue-100"
            }`}
          >
            <PlusIcon
              className={`w-3 h-3 ${
                isManagingStaples
                  ? "text-gray-400"
                  : "text-gray-600 group-hover:text-blue-600"
              }`}
            />
          </div>

          {/* Name */}
          <span
            className={`text-xs font-medium text-center leading-tight ${
              isManagingStaples
                ? "text-gray-500"
                : "text-gray-700 group-hover:text-blue-700"
            }`}
          >
            {staple.name}
          </span>

          {/* Category & Threshold */}
          <div className="text-center">
            <span className="text-xs text-gray-500 block">
              {staple.category}
            </span>
            <span className="text-xs text-gray-400">
              Alert: {staple.defaultThreshold}
            </span>
          </div>

          {/* Status Badge - Only show Custom */}
          {isCustomStaple && (
            <span className="text-xs text-blue-600 font-medium">Custom</span>
          )}
        </div>
      </button>
    </div>
  );
}
