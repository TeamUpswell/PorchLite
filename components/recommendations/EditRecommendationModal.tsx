// components/recommendations/EditRecommendationModal.tsx
import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { Recommendation } from "@/types/recommendations";

interface EditRecommendationModalProps {
  isOpen: boolean;
  recommendation: Recommendation | null;
  categories: string[];
  hasCategoryManagePermission: boolean;
  onClose: () => void;
  onSave: (recommendation: Recommendation) => Promise<void>;
  onManageCategories: () => void;
}

const EditRecommendationModal: React.FC<EditRecommendationModalProps> = ({
  isOpen,
  recommendation,
  categories,
  onClose,
  onSave,
}) => {
  const [editingRecommendation, setEditingRecommendation] = useState<Recommendation | null>(null);

  useEffect(() => {
    if (recommendation) {
      setEditingRecommendation({
        ...recommendation,
        images: recommendation.images || [""]
      });
    }
  }, [recommendation]);

  if (!isOpen || !editingRecommendation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(editingRecommendation);
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === "manage-categories") {
      if (!hasCategoryManagePermission) {
        return; // Parent should handle the toast
      }
      onManageCategories();
      return;
    }
    setEditingRecommendation({
      ...editingRecommendation,
      category: value,
    });
  };

  const addImageField = () => {
    setEditingRecommendation({
      ...editingRecommendation,
      images: [...(editingRecommendation.images || []), ""],
    });
  };

  const removeImageField = (index: number) => {
    const newImages = (editingRecommendation.images || []).filter((_, i) => i !== index);
    setEditingRecommendation({
      ...editingRecommendation,
      images: newImages,
    });
  };

  const updateImageField = (index: number, value: string) => {
    const newImages = [...(editingRecommendation.images || [])];
    newImages[index] = value;
    setEditingRecommendation({
      ...editingRecommendation,
      images: newImages,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Recommendation</h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="edit-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name *
              </label>
              <input
                id="edit-name"
                type="text"
                value={editingRecommendation.name}
                onChange={(e) =>
                  setEditingRecommendation({
                    ...editingRecommendation,
                    name: e.target.value,
                  })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                aria-label="Recommendation name"
              />
            </div>

            <div>
              <label
                htmlFor="edit-category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category *
              </label>
              <select
                id="edit-category"
                value={editingRecommendation.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                aria-label="Recommendation category"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
                {hasCategoryManagePermission && (
                  <>
                    <option disabled className="text-gray-400">
                      ────────────────────
                    </option>
                    <option value="manage-categories" className="font-bold">
                      ⚙️ Manage Categories
                    </option>
                  </>
                )}
              </select>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="edit-description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="edit-description"
                value={editingRecommendation.description || ""}
                onChange={(e) =>
                  setEditingRecommendation({
                    ...editingRecommendation,
                    description: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                aria-label="Recommendation description"
              />
            </div>

            <div>
              <label
                htmlFor="edit-address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Address
              </label>
              <input
                id="edit-address"
                type="text"
                value={editingRecommendation.address || ""}
                onChange={(e) =>
                  setEditingRecommendation({
                    ...editingRecommendation,
                    address: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                aria-label="Recommendation address"
              />
            </div>

            <div>
              <label
                htmlFor="edit-website"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Website
              </label>
              <input
                id="edit-website"
                type="url"
                value={editingRecommendation.website || ""}
                onChange={(e) =>
                  setEditingRecommendation({
                    ...editingRecommendation,
                    website: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                aria-label="Recommendation website"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label
                htmlFor="edit-phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone Number
              </label>
              <input
                id="edit-phone"
                type="text"
                value={editingRecommendation.phone_number || ""}
                onChange={(e) =>
                  setEditingRecommendation({
                    ...editingRecommendation,
                    phone_number: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                aria-label="Recommendation phone number"
                placeholder="(123) 456-7890"
              />
            </div>

            <div>
              <label
                htmlFor="edit-rating"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Rating (1-5)
              </label>
              <input
                id="edit-rating"
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={editingRecommendation.rating || 5}
                onChange={(e) =>
                  setEditingRecommendation({
                    ...editingRecommendation,
                    rating: parseFloat(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                aria-label="Recommendation rating"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URLs
              </label>
              {(editingRecommendation.images || [""]).map((image, index) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => updateImageField(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                    placeholder="https://example.com/image.jpg"
                    aria-label={`Image URL ${index + 1}`}
                  />
                  {index === (editingRecommendation.images || [""]).length - 1 ? (
                    <button
                      type="button"
                      onClick={addImageField}
                      className="ml-2 px-3 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400"
                      aria-label="Add another image URL field"
                    >
                      <Plus size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeImageField(index)}
                      className="ml-2 px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400"
                      aria-label="Remove this image URL field"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded mr-2 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRecommendationModal;