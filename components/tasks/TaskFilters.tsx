"use client";

type FilterType =
  | "open"
  | "all"
  | "pending"
  | "in-progress"
  | "completed"
  | "mine"
  | "created-by-me"
  | "cleaning";

interface TaskFiltersProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  propertyName?: string;
  cleaningIssuesCount: number;
}

export default function TaskFilters({
  filter,
  onFilterChange,
  propertyName,
  cleaningIssuesCount,
}: TaskFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500">
        {propertyName}
        {cleaningIssuesCount > 0 && (
          <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
            {cleaningIssuesCount} cleaning issues
          </span>
        )}
      </span>

      <label htmlFor="task-filter" className="sr-only">
        Filter tasks
      </label>
      <select
        id="task-filter"
        value={filter}
        onChange={(e) => onFilterChange(e.target.value as FilterType)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        title="Filter tasks by status"
      >
        <option value="open">Open Tasks</option>
        <option value="all">All Tasks</option>
        <option value="pending">Pending</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
        <option value="mine">My Open Tasks</option>
        <option value="created-by-me">Created by Me (Open)</option>
        <option value="cleaning">🧽 Cleaning Tasks</option>
      </select>
    </div>
  );
}
