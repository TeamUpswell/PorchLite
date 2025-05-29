"use client";

import { useState, useEffect } from "react";
import { XIcon, CameraIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  category?: string;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  completed_at?: string | null;
  property_id: string;
  tenant_id?: string;
  is_recurring?: boolean;
  recurrence_pattern?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | null;
  recurrence_interval?: number;
  parent_task_id?: string | null;
  next_due_date?: string | null;
  recurring_end_date?: string | null;
  attachments?: string[] | null;
}

interface UserProfile {
  id: string;
  name: string;
  role: string;
}

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
  users: UserProfile[];
  currentProperty: any;
  currentUser: any;
  task: Task | null;
}

export default function EditTaskModal({ 
  isOpen, 
  onClose, 
  onTaskUpdated, 
  users, 
  currentProperty, 
  currentUser,
  task 
}: EditTaskModalProps) {
  const [editTask, setEditTask] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    category: "maintenance",
    due_date: "",
    assigned_to: "",
    status: "pending" as "pending" | "in_progress" | "completed",
    is_recurring: false,
    recurrence_pattern: "monthly" as "daily" | "weekly" | "monthly" | "quarterly" | "yearly",
    recurrence_interval: 1,
    recurring_end_date: "",
  });
  
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);

  // Populate form when task changes
  useEffect(() => {
    if (task) {
      setEditTask({
        title: task.title,
        description: task.description,
        priority: task.priority,
        category: task.category || "maintenance",
        due_date: task.due_date ? task.due_date.split('T')[0] : "",
        assigned_to: task.assigned_to || "",
        status: task.status,
        is_recurring: task.is_recurring || false,
        recurrence_pattern: task.recurrence_pattern || "monthly",
        recurrence_interval: task.recurrence_interval || 1,
        recurring_end_date: task.recurring_end_date ? task.recurring_end_date.split('T')[0] : "",
      });
      setExistingAttachments(task.attachments || []);
    }
  }, [task]);

  const uploadTaskAttachment = async (taskId: string, file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${taskId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('task-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error("Storage upload error:", error);
        if (error.message?.includes('Bucket not found')) {
          toast.error("Storage bucket not configured. Please contact your administrator.");
        } else {
          toast.error(`Failed to upload photo: ${error.message}`);
        }
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload photo');
      return null;
    }
  };

  const handleUpdateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentProperty || !currentUser || !task) return;

    setUpdating(true);
    try {
      const taskData = {
        title: editTask.title,
        description: editTask.description,
        priority: editTask.priority,
        category: editTask.category,
        due_date: editTask.due_date || null,
        assigned_to: editTask.assigned_to || null,
        status: editTask.status,
        is_recurring: editTask.is_recurring,
        recurrence_pattern: editTask.is_recurring ? editTask.recurrence_pattern : null,
        recurrence_interval: editTask.is_recurring ? editTask.recurrence_interval : null,
        recurring_end_date: editTask.is_recurring && editTask.recurring_end_date ? editTask.recurring_end_date : null,
        updated_at: new Date().toISOString(),
      };

      // Upload new attachments if any
      let newAttachmentUrls: string[] = [];
      if (attachments.length > 0) {
        for (const file of attachments) {
          const url = await uploadTaskAttachment(task.id, file);
          if (url) newAttachmentUrls.push(url);
        }
      }

      // Combine existing and new attachments
      const allAttachments = [...existingAttachments, ...newAttachmentUrls];

      const { error } = await supabase
        .from("tasks")
        .update({
          ...taskData,
          attachments: allAttachments.length > 0 ? allAttachments : null
        })
        .eq("id", task.id);

      if (error) throw error;

      onTaskUpdated();
      onClose();
      setAttachments([]);

      toast.success("Task updated successfully!");
    } catch (err) {
      console.error("Error updating task:", err);
      toast.error("Failed to update task");
    } finally {
      setUpdating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 5MB.`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file.`);
        return false;
      }
      return true;
    });
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (index: number) => {
    setExistingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full sm:max-w-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Edit Task</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Close modal"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6">
          <form
            id="edit-task-form"
            onSubmit={handleUpdateTask}
            className="space-y-4 sm:space-y-6 pt-4 pb-24"
          >
            <div>
              <label htmlFor="edit-task-title" className="block text-sm font-medium text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                id="edit-task-title"
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                value={editTask.title}
                onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label htmlFor="edit-task-description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="edit-task-description"
                className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none"
                rows={3}
                value={editTask.description}
                onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label htmlFor="edit-task-status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="edit-task-status"
                  className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  value={editTask.status}
                  onChange={(e) => setEditTask({ ...editTask, status: e.target.value as "pending" | "in_progress" | "completed" })}
                >
                  <option value="pending">⏳ Pending</option>
                  <option value="in_progress">🔄 In Progress</option>
                  <option value="completed">✅ Completed</option>
                </select>
              </div>

              <div>
                <label htmlFor="edit-task-priority" className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  id="edit-task-priority"
                  className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  value={editTask.priority}
                  onChange={(e) => setEditTask({ ...editTask, priority: e.target.value as "low" | "medium" | "high" })}
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>

              <div>
                <label htmlFor="edit-task-category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="edit-task-category"
                  className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  value={editTask.category}
                  onChange={(e) => setEditTask({ ...editTask, category: e.target.value })}
                >
                  <option value="maintenance">🔧 Maintenance</option>
                  <option value="cleaning">🧹 Cleaning</option>
                  <option value="supplies">📦 Supplies</option>
                  <option value="repairs">🛠️ Repairs</option>
                  <option value="inspection">🔍 Inspection</option>
                  <option value="other">📋 Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="edit-task-due-date" className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  id="edit-task-due-date"
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  value={editTask.due_date}
                  onChange={(e) => setEditTask({ ...editTask, due_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="edit-task-assigned-to" className="block text-sm font-medium text-gray-700 mb-2">
                Assign to
              </label>
              <select
                id="edit-task-assigned-to"
                className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                value={editTask.assigned_to}
                onChange={(e) => setEditTask({ ...editTask, assigned_to: e.target.value })}
              >
                <option value="">👥 Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    👤 {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Existing Photos */}
            {existingAttachments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📷 Current Photos
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                  {existingAttachments.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Existing attachment ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingAttachment(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Photos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📷 Add More Photos (Optional)
              </label>
              <div className="space-y-3">
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="edit-task-photos" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <CameraIcon className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload more photos</span>
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB each)</p>
                    </div>
                    <input
                      id="edit-task-photos"
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>

                {attachments.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New attachment ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                          New
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recurring Options (simplified for edit) */}
            {editTask.is_recurring && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  ℹ️ This is a recurring task. Changes will only apply to this instance.
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Sticky Footer Buttons */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors order-2 sm:order-1"
              onClick={onClose}
              disabled={updating}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-task-form"
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors order-1 sm:order-2 disabled:opacity-50"
              disabled={updating}
            >
              {updating ? "Updating..." : "💾 Update Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}