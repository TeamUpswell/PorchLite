import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { UserIcon, ClockIcon, TagIcon, X } from "lucide-react";
import { ActionButton } from '@/components/ui/Icons';

// Define proper types
interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  category: string;
  status: 'pending' | 'in-progress' | 'completed';
  assigned_to?: string;
  created_by: string;
}

interface User {
  id: string;
  isAdmin?: boolean;
  isManager?: boolean;
}

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  currentUser: User;
}

export default function TaskDetail({ task, onClose, onUpdate, currentUser }: TaskDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task>(task);
  
  const handleUpdate = async () => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: editedTask.title,
          description: editedTask.description,
          priority: editedTask.priority,
          due_date: editedTask.due_date,
          category: editedTask.category
        })
        .eq("id", task.id);
      
      if (error) throw error;
      
      setIsEditing(false);
      onUpdate(editedTask);
    } catch (err) {
      console.error("Error updating task:", err);
      alert("Failed to update task");
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date";
    return new Date(dateString).toLocaleDateString();
  };
  
  const canEdit = currentUser?.isAdmin || currentUser?.isManager || task.created_by === currentUser?.id;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{task.title}</h3>
          <p className="text-gray-600 mt-1">{task.description}</p>
          
          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
            <span className="capitalize">Priority: {task.priority}</span>
            {task.due_date && (
              <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
            )}
            <span className="capitalize">Category: {task.category}</span>
          </div>
        </div>
        
        {canEdit && (
          <div className="flex space-x-2 ml-4">
            <ActionButton
              onClick={() => setIsEditing(true)}
              title="Edit task"
              variant="edit"
            />
            <ActionButton
              onClick={() => onDelete(task.id)}
              title="Delete task"
              variant="delete"
            />
          </div>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              id="task-title"
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={editedTask.title}
              onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
            />
          </div>
          
          <div>
            <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="task-description"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={4}
              value={editedTask.description}
              onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
            ></textarea>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="task-priority"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={editedTask.priority}
                onChange={(e) => setEditedTask({...editedTask, priority: e.target.value as 'low' | 'medium' | 'high'})}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="task-due-date" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                id="task-due-date"
                type="date"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={editedTask.due_date || ""}
                onChange={(e) => setEditedTask({...editedTask, due_date: e.target.value})}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 border border-gray-300 rounded-md text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              className="px-3 py-1 bg-blue-600 text-white rounded-md"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="prose prose-sm max-w-none mb-6">
            <p>{task.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-gray-600">
              <TagIcon className="h-4 w-4 mr-1" />
              <span className="capitalize">{task.category}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{formatDate(task.due_date)}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <UserIcon className="h-4 w-4 mr-1" />
              <span>
                {task.assigned_to ? "Assigned" : "Unassigned"}
              </span>
            </div>
            
            <div className="flex items-center">
              <span
                className={`px-2 py-1 rounded text-xs ${
                  task.status === "pending"
                    ? "bg-gray-100 text-gray-800"
                    : task.status === "in-progress"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {task.status}
              </span>
            </div>
          </div>
          
          {canEdit && (
            <div className="mt-6">
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Edit Task
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}