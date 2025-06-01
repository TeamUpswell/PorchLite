import { useRouter } from 'next/router';
import { useParams, useSearchParams } from 'next/navigation';
import StandardCard from '@/components/StandardCard';
import StandardPageLayout from '@/components/StandardPageLayout';

export default function NewManualItem() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sectionId } = useParams();
  
  // ✅ GET the item type from URL params
  const itemType = searchParams.get('type') || 'instruction';
  const isCleaningTask = itemType === 'cleaning_task';

  // ...existing state...

  return (
    <StandardPageLayout
      title={isCleaningTask ? "New Cleaning Task" : "New Manual Item"}
      subtitle={isCleaningTask ? "Create a new cleaning procedure" : "Add content to this section"}
    >
      <StandardCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isCleaningTask ? 'Task Name' : 'Title'} *
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder={isCleaningTask ? 'e.g. Bathroom Deep Clean' : 'Enter title...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isCleaningTask ? 'Step-by-Step Instructions' : 'Content'} *
            </label>
            <textarea
              name="content"
              rows={8}
              required
              placeholder={isCleaningTask ? 'List each step clearly...' : 'Enter content...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* ✅ CLEANING-SPECIFIC FIELDS */}
          {isCleaningTask && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Time (minutes)
                  </label>
                  <input
                    type="number"
                    name="estimated_time"
                    placeholder="30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level
                  </label>
                  <select
                    name="priority"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplies Needed
                </label>
                <input
                  type="text"
                  name="supplies_needed"
                  placeholder="All-purpose cleaner, microfiber cloths, vacuum..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Hidden field for item type */}
          <input type="hidden" name="type" value={itemType} />

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : (isCleaningTask ? 'Create Task' : 'Create Item')}
            </button>
          </div>
        </form>
      </StandardCard>
    </StandardPageLayout>
  );
}