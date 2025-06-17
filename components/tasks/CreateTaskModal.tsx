"use client";

import { useState, useEffect } from "react";
import { XIcon, CameraIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

interface UserProfile {
  id: string;
  name: string;
  role: string;
}

interface Task {
  id?: string;
  title?: string;
  description?: string;
  assignee_id?: string;
  priority?: "low" | "medium" | "high";
  due_date?: string;
  // Add other task properties as needed
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => Promise<void>;
  users: UserProfile[];
  currentProperty: {
    id: string;
    name: string;
    address: string | null;
    description: string | null;
    // ... other property fields
  };
  currentUser: User & {
    // ... user fields
  };
  initialData?: Partial<Task> | null; // ✅ Add this line
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  onTaskCreated,
  users,
  currentProperty,
  currentUser,
  initialData, // ✅ Add this parameter
}: CreateTaskModalProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    assignee_id: initialData?.assignee_id || "",
    priority: initialData?.priority || "medium",
    due_date: initialData?.due_date || "",
    // ... other form fields
  });

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: initialData?.title || "",
        description: initialData?.description || "",
        assignee_id: initialData?.assignee_id || "",
        priority: initialData?.priority || "medium",
        due_date: initialData?.due_date || "",
      });
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    if (e) e.preventDefault();
    if (!currentProperty || !currentUser) return;

    try {
      // Create or update task logic
      const taskData = {
        ...formData,
        property_id: currentProperty.id,
        created_by: currentUser.id,
        // Include initial data ID if editing
        ...(initialData?.id && { id: initialData.id }),
      };

      const response = await fetch("/api/tasks", {
        method: initialData?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error("Failed to save task");
      }

      await onTaskCreated();
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to create task");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {initialData?.id ? "Edit Task" : "Create New Task"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <form
          id="create-task-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to
            </label>
            <select
              value={formData.assignee_id}
              onChange={(e) =>
                setFormData({ ...formData, assignee_id: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {initialData?.id ? "Update Task" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
