import { PencilIcon, PlusIcon } from "@heroicons/react/24/outline";
import ManualItem from "./ManualItem";
// Fix ManualSection.tsx by changing:
import type {
  ManualSection,
  ManualItem as ManualItemType,
} from "@/types/manual";

interface ManualSectionProps {
  section: ManualSection;
  items: ManualItemType[];
  onEditSection?: (section: ManualSection) => void;
  onAddItem?: (sectionId: string) => void;
  onEditItem?: (item: ManualItemType) => void;
  onDeleteItem?: (itemId: string) => void;
}

export default function ManualSection({
  section,
  items,
  onEditSection,
  onAddItem,
  onEditItem,
  onDeleteItem,
}: ManualSectionProps) {
  // Sort items - important items first
  const sortedItems = [...items].sort((a, b) => {
    // Sort by important flag first, then by title
    if (a.important && !b.important) return -1;
    if (!a.important && b.important) return 1;
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h2 className="text-xl font-medium">{section.title}</h2>
          {section.description && (
            <p className="text-sm text-gray-600 mt-1">{section.description}</p>
          )}
        </div>

        <div className="flex space-x-2">
          {onEditSection && (
            <button
              onClick={() => onEditSection(section)}
              className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
              title="Edit section"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          )}

          {onAddItem && (
            <button
              onClick={() => onAddItem(section.id)}
              className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
              title="Add item"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="divide-y">
        {sortedItems.length > 0 ? (
          sortedItems.map((item) => (
            <ManualItem
              key={item.id}
              item={item}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
            />
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            No items in this section yet.
            {onAddItem && (
              <button
                onClick={() => onAddItem(section.id)}
                className="ml-2 text-blue-500 hover:underline"
              >
                Add one now
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
