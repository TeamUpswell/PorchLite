// components/recommendations/CategoryManagementModal.tsx
import { useState } from "react";
import { X } from "lucide-react";

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onAddCategory: (name: string) => Promise<void>;
  onEditCategory: (oldName: string, newName: string) => Promise<void>;
  onDeleteCategory: (name: string) => Promise<void>;
}

const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
}) => {
  const [newCategory, setNewCategory] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim()) {
      try {
        await onAddCategory(newCategory.trim());
        setNewCategory("");
      } catch (error) {
        console.error('Error adding category:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Manage Categories</h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
              Add
            </button>
          </div>
        </form>

        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>{category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryManagementModal;