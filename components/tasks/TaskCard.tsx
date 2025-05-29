"use client";

import { 
  CheckIcon, 
  ClockIcon, 
  UserIcon, 
  CalendarIcon,
  EditIcon,
  CameraIcon,
  AlertTriangleIcon,
  PlayIcon,
  RepeatIcon,
  Trash2Icon
} from "lucide-react";

interface TaskCardProps {
  task: {
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
    is_recurring?: boolean;
    attachments?: string[] | null;
  };
  userId: string;
  onClaim: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onEdit: (task: any) => void;
  onDelete: (taskId: string) => void;
  onViewPhotos: (photos: string[]) => void;
}

export default function TaskCard({ 
  task, 
  userId, 
  onClaim, 
  onComplete, 
  onEdit, 
  onDelete,
  onViewPhotos 
}: TaskCardProps) {
  const isAssignedToMe = task.assigned_to === userId;
  const isCreatedByMe = task.created_by === userId;
  const canClaim = !task.assigned_to && task.status === "pending";
  const canComplete = (isAssignedToMe || canClaim) && task.status !== "completed";
  const canDelete = isCreatedByMe; // Only creator can delete

  // Priority styling - only border colors now
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "high":
        return {
          border: "border-l-red-500",
          badge: "bg-red-100 text-red-800",
          icon: "🔴",
          text: "High"
        };
      case "medium":
        return {
          border: "border-l-yellow-500",
          badge: "bg-yellow-100 text-yellow-800",
          icon: "🟡",
          text: "Medium"
        };
      case "low":
        return {
          border: "border-l-green-500",
          badge: "bg-green-100 text-green-800",
          icon: "🟢",
          text: "Low"
        };
      default:
        return {
          border: "border-l-gray-500",
          badge: "bg-gray-100 text-gray-800",
          icon: "⚪",
          text: "Normal"
        };
    }
  };

  // Status styling
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          badge: "bg-green-100 text-green-800 border-green-200",
          icon: CheckIcon,
          text: "Completed"
        };
      case "in_progress":
        return {
          badge: "bg-blue-100 text-blue-800 border-blue-200",
          icon: PlayIcon,
          text: "In Progress"
        };
      case "pending":
        return {
          badge: "bg-gray-100 text-gray-800 border-gray-200",
          icon: ClockIcon,
          text: "Pending"
        };
      default:
        return {
          badge: "bg-gray-100 text-gray-800 border-gray-200",
          icon: ClockIcon,
          text: "Unknown"
        };
    }
  };

  // Category emoji
  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case "maintenance": return "🔧";
      case "cleaning": return "🧹";
      case "supplies": return "📦";
      case "repairs": return "🛠️";
      case "inspection": return "🔍";
      default: return "📋";
    }
  };

  // Due date styling
  const getDueDateStatus = (dueDate: string | null) => {
    if (!dueDate) return null;
    
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, color: "text-red-600", bg: "bg-red-50" };
    } else if (diffDays === 0) {
      return { text: "Due today", color: "text-orange-600", bg: "bg-orange-50" };
    } else if (diffDays === 1) {
      return { text: "Due tomorrow", color: "text-amber-600", bg: "bg-amber-50" };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays} days`, color: "text-blue-600", bg: "bg-blue-50" };
    } else {
      return { text: `Due in ${diffDays} days`, color: "text-gray-600", bg: "bg-gray-50" };
    }
  };

  const priorityConfig = getPriorityConfig(task.priority);
  const statusConfig = getStatusConfig(task.status);
  const dueDateStatus = getDueDateStatus(task.due_date);
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`bg-white rounded-xl border-l-4 ${priorityConfig.border} border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}>
      {/* Header with status and priority */}
      <div className="p-4 pb-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.badge}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.text}
            </span>
            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${priorityConfig.badge}`}>
              {priorityConfig.icon} {priorityConfig.text}
            </span>
            {task.is_recurring && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                <RepeatIcon className="w-3 h-3 mr-1" />
                Recurring
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Edit task"
            >
              <EditIcon className="w-4 h-4" />
            </button>
            {canDelete && (
              <button
                onClick={() => onDelete(task.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Delete task"
              >
                <Trash2Icon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Title and Category */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{getCategoryEmoji(task.category || "other")}</span>
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">{task.title}</h3>
          </div>
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">{task.description}</p>
        </div>

        {/* Due Date */}
        {dueDateStatus && (
          <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium mb-3 ${dueDateStatus.bg} ${dueDateStatus.color}`}>
            <CalendarIcon className="w-4 h-4 mr-2" />
            {dueDateStatus.text}
          </div>
        )}

        {/* Assignment Info */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <UserIcon className="w-4 h-4" />
              <span className="font-medium">
                {task.assigned_user_name || "Unassigned"}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            by {task.created_by_name}
          </div>
          {task.attachments && task.attachments.length > 0 && (
            <button
              onClick={() => onViewPhotos(task.attachments || [])}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <CameraIcon className="w-4 h-4" />
              <span className="text-xs font-medium">{task.attachments.length}</span>
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      {task.status !== "completed" && (
        <div className="px-4 pb-4">
          <div className="flex gap-2">
            {canClaim && (
              <button
                onClick={() => onClaim(task.id)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                Claim Task
              </button>
            )}
            {canComplete && (
              <button
                onClick={() => onComplete(task.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-1"
              >
                <CheckIcon className="w-3.5 h-3.5" />
                Complete
              </button>
            )}
          </div>
        </div>
      )}

      {/* Completed state */}
      {task.status === "completed" && (
        <div className="px-4 pb-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <CheckIcon className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-sm font-medium text-green-800">Task Completed</p>
            {task.completed_at && (
              <p className="text-xs text-green-600 mt-1">
                {new Date(task.completed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
