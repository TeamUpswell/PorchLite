// components/StapleModal.tsx
"use client";

import { categories } from "./inventory/types";

interface StapleModalProps {
  editingStaple: any;
  setEditingStaple: (staple: any) => void;
  stapleFormData: {
    name: string;
    category: string;
    defaultThreshold: number;
  };
  setStapleFormData: (data: any) => void;
  error: string | null;
  setError: (error: string | null) => void;
  resetStapleForm: () => void;
  handleUpdateStaple: (e: React.FormEvent) => Promise<void>;
  setIsManagingStaples: (managing: boolean) => void;
}

export default function StapleModal({
  editingStaple,
  setEditingStaple,
  stapleFormData,
  setStapleFormData,
  error,
  setError,
  resetStapleForm,
  handleUpdateStaple,
  setIsManagingStaples,
}: StapleModalProps) {
  if (!editingStaple) return null;

  const handleClose = () => {
    setEditingStaple(null);
    setIsManagingStaples(true);
    resetStapleForm();
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Edit Staple</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdateStaple} className="space-y-4">
            <div>
              <label htmlFor="edit-staple-name" className="block text-sm font-medium text-gray-700 mb-2">
                Staple Name *
              </label>
              <input
                id="edit-staple-name"
                type="text"
                value={stapleFormData.name}
                onChange={(e) =>
                  setStapleFormData({
                    ...stapleFormData,
                    name: e.target.value,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="edit-staple-category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="edit-staple-category"
                value={stapleFormData.category}
                onChange={(e) =>
                  setStapleFormData({
                    ...stapleFormData,
                    category: e.target.value,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="edit-staple-threshold" className="block text-sm font-medium text-gray-700 mb-2">
                Default Alert Threshold *
              </label>
              <input
                id="edit-staple-threshold"
                type="number"
                min="1"
                value={stapleFormData.defaultThreshold}
                onChange={(e) =>
                  setStapleFormData({
                    ...stapleFormData,
                    defaultThreshold: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Staple
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}