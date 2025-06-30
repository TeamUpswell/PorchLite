"use client";

import { CheckSquareIcon, PlusIcon } from "lucide-react";

type FilterType =
  | "open"
  | "all"
  | "pending"
  | "in-progress"
  | "completed"
  | "mine"
  | "created-by-me"
  | "cleaning";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  category?: string;
  assigned_to: string | null;
  assigned_user_name?: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  completed_at?: string | null;
  property_id: string;
  tenant_id?: string;
  user_id?: string;
  is_recurring?: boolean;
  attachments?: string[] | null;
  is_public?: boolean;
  visibility?: "guest" | "family" | "manager-only" | null;
}

interface TaskEmptyStatesProps {
  filteredTasks: Task[];
  filter: FilterType;
  currentProperty: any;
  cleaningIssues: any[];
  isManagerView: boolean;
  onCreateTask: () => void;
  onFilterChange: (filter: FilterType) => void;
  onCreateTaskFromIssue: (issue: any) => void;
}

export default function TaskEmptyStates({
  filteredTasks,
  filter,
  currentProperty,
  cleaningIssues,
  isManagerView,
  onCreateTask,
  onFilterChange,
  onCreateTaskFromIssue,
}: TaskEmptyStatesProps) {
  // Show content when there are tasks
  if (filteredTasks.length > 0) return null;

  // Special "All Clear" state for open tasks
  if (filter === "open") {
    return (
      <div className="text-center py-16">
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-green-100 rounded-full mx-auto flex items-center justify-center">
            <CheckSquareIcon className="h-12 w-12 text-green-600" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">✨</span>
          </div>
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-3">
          All Clear! 🎉
        </h3>
        <p className="text-gray-500 mb-2 max-w-md mx-auto">
          No open tasks for <strong>{currentProperty.name}</strong>. Everything
          is running smoothly!
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Check back later or create a new task if something needs attention.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button
            onClick={onCreateTask}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create New Task
          </button>
          <button
            onClick={() => onFilterChange("completed")}
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            View Completed Tasks
          </button>
          {isManagerView && (
            <button
              onClick={() => onFilterChange("all")}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              View All Tasks
            </button>
          )}
        </div>

        {cleaningIssues.length > 0 && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">
              📋 Unresolved Cleaning Issues ({cleaningIssues.length})
            </h4>
            <p className="text-sm text-yellow-700 mb-3">
              Consider creating tasks for these cleaning issues:
            </p>
            <div className="space-y-2">
              {cleaningIssues.slice(0, 3).map((issue: any) => (
                <div
                  key={issue.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-yellow-800">
                    {issue.location}: {issue.description.substring(0, 50)}...
                  </span>
                  <button
                    onClick={() => onCreateTaskFromIssue(issue)}
                    className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                  >
                    Create Task
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Generic empty state for other filters
  return (
    <div className="text-center py-12">
      <CheckSquareIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-medium text-gray-900 mb-2">No Tasks Found</h3>
      <p className="text-gray-500 mb-6">
        {filter === "completed"
          ? "No completed tasks found"
          : filter === "pending"
          ? "No pending tasks found"
          : filter === "in-progress"
          ? "No tasks in progress"
          : filter === "mine"
          ? "No tasks assigned to you"
          : filter === "created-by-me"
          ? "You haven't created any tasks yet"
          : `No tasks match the "${filter}" filter`}
      </p>
      <div className="flex gap-3 justify-center">
        {isManagerView && (
          <button
            onClick={() => onFilterChange("all")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            View All Tasks
          </button>
        )}
        <button
          onClick={() => onFilterChange("open")}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          View Open Tasks
        </button>
        <button
          onClick={onCreateTask}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Task
        </button>
      </div>
    </div>
  );
}
