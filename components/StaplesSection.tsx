// components/StaplesSection.tsx
"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import StapleCard from "./StapleCard";
import { AllStaple, InventoryItem } from "./inventory/types";
import { categories } from "./inventory/types";

interface StaplesSectionProps {
  allStaples: AllStaple[];
  isManagingStaples: boolean;
  setIsManagingStaples: (managing: boolean) => void;
  editingStaple: AllStaple | null;
  setEditingStaple: (staple: AllStaple | null) => void;
  stapleFormData: {
    name: string;
    category: string;
    defaultThreshold: number;
  };
  setStapleFormData: (data: any) => void;
  error: string | null;
  setError: (error: string | null) => void;
  resetStapleForm: () => void;
  quickAddStaple: (staple: AllStaple, items: InventoryItem[], fetchItems: () => Promise<void>) => Promise<void>;
  handleAddCustomStaple: (e: React.FormEvent) => Promise<void>;
  handleUpdateStaple: (e: React.FormEvent) => Promise<void>;
  handleEditStaple: (staple: AllStaple) => void;
  handleDeleteStaple: (staple: AllStaple) => Promise<void>;
  items: InventoryItem[];
  fetchItems: () => Promise<void>;
}

export default function StaplesSection({
  allStaples,
  isManagingStaples,
  setIsManagingStaples,
  editingStaple,
  setEditingStaple,
  stapleFormData,
  setStapleFormData,
  error,
  setError,
  resetStapleForm,
  quickAddStaple,
  handleAddCustomStaple,
  handleUpdateStaple,
  handleEditStaple,
  handleDeleteStaple,
  items,
  fetchItems,
}: StaplesSectionProps) {
  const availableStaples = allStaples.filter(
    (staple) =>
      !items.some(
        (item) =>
          item.name.toLowerCase() === staple.name.toLowerCase() &&
          item.category === staple.category
      )
  );

  return (
    <>
      {/* Quick Add Staples Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Quick Add Staples
            </h3>
            <p className="text-sm text-gray-600">
              Common items that need regular restocking
              {isManagingStaples && " • Management mode active"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsManagingStaples(!isManagingStaples);
                setError(null);
                resetStapleForm();
                setEditingStaple(null);
              }}
              className={`text-sm font-medium ${
                isManagingStaples
                  ? "text-green-600 hover:text-green-700"
                  : "text-gray-600 hover:text-gray-700"
              }`}
            >
              {isManagingStaples ? "✓ Done Managing" : "⚙️ Manage"}
            </button>
          </div>
        </div>

        {/* Management Instructions */}
        {isManagingStaples && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-400 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h4 className="text-sm font-medium text-blue-800">
                  Management Mode
                </h4>
                <p className="text-sm text-blue-700">
                  • Click <strong>edit</strong> (pencil) to modify staples
                  <br />
                  • Click <strong>delete</strong> (trash) to remove staples
                  <br />
                  • Adding to inventory is disabled while managing
                </p>

                {/* Add Custom Staple Button */}
                <div className="mt-3">
                  <button
                    onClick={() => {
                      resetStapleForm();
                      setEditingStaple(null);
                      setError(null);
                      setStapleFormData({
                        name: "ADD_NEW",
                        category: "staples",
                        defaultThreshold: 1,
                      });
                    }}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4 mr-1.5" />
                    Add Custom Staple
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Staples Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
          {availableStaples.map((staple) => (
            <StapleCard
              key={staple.id || staple.name}
              staple={staple}
              isManagingStaples={isManagingStaples}
              onQuickAdd={(staple) => quickAddStaple(staple, items, fetchItems)}
              onEdit={handleEditStaple}
              onDelete={handleDeleteStaple}
              items={items}
            />
          ))}
        </div>

        {/* Empty State */}
        {availableStaples.length === 0 && (
          <div className="text-center py-6 text-gray-500 text-sm bg-gray-50 rounded-lg">
            <svg
              className="w-8 h-8 mx-auto mb-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            All staples have been added to your inventory
          </div>
        )}

        {/* Summary */}
        {allStaples.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{availableStaples.length} staples available to add</span>
              <span>
                {allStaples.filter((s) => s.sourceTable === "default_staples").length} system •{" "}
                {allStaples.filter((s) => s.sourceTable === "custom_staples").length} custom
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Add Custom Staple Modal */}
      {isManagingStaples && !editingStaple && stapleFormData.name === "ADD_NEW" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add Custom Staple</h2>
                <button
                  onClick={() => {
                    resetStapleForm();
                    setError(null);
                  }}
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

              <form onSubmit={handleAddCustomStaple} className="space-y-4">
                <div>
                  <label htmlFor="staple-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Staple Name *
                  </label>
                  <input
                    id="staple-name"
                    type="text"
                    value={stapleFormData.name === "ADD_NEW" ? "" : stapleFormData.name}
                    onChange={(e) =>
                      setStapleFormData({
                        ...stapleFormData,
                        name: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter staple name"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="staple-category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="staple-category"
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
                  <label htmlFor="staple-threshold" className="block text-sm font-medium text-gray-700 mb-2">
                    Default Alert Threshold *
                  </label>
                  <input
                    id="staple-threshold"
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
                    onClick={() => {
                      resetStapleForm();
                      setError(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Staple
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}