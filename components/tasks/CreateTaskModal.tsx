"use client";

import { useState } from "react";
import { XIcon, CameraIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

interface UserProfile {
  id: string;
  name: string;
  role: string;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  users: UserProfile[];
  currentProperty: any;
  currentUser: any;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  onTaskCreated,
  users,
  currentProperty,
  currentUser,
}: CreateTaskModalProps) {
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    category: "maintenance",
    due_date: "",
    assigned_to: "",
    is_recurring: false,
    recurrence_pattern: "monthly" as
      | "daily"
      | "weekly"
      | "monthly"
      | "quarterly"
      | "yearly",
    recurrence_interval: 1,
    recurring_end_date: "",
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const uploadTaskAttachment = async (
    taskId: string,
    file: File
  ): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${taskId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("task-attachments")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("task-attachments")
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload photo");
      return null;
    }
  };

  const handleCreateTask = async (
    e?: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    if (e) e.preventDefault();
    if (!currentProperty || !currentUser) return;

    setUploading(true);
    try {
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        category: newTask.category,
        due_date: newTask.due_date || null,
        assigned_to: newTask.assigned_to || null,
        status: newTask.assigned_to ? "in_progress" : "pending",
        created_by: currentUser.id,
        property_id: currentProperty.id,
        tenant_id: currentProperty.tenant_id,
        is_recurring: newTask.is_recurring,
        recurrence_pattern: newTask.is_recurring
          ? newTask.recurrence_pattern
          : null,
        recurrence_interval: newTask.is_recurring
          ? newTask.recurrence_interval
          : null,
        recurring_end_date:
          newTask.is_recurring && newTask.recurring_end_date
            ? newTask.recurring_end_date
            : null,
        updated_at: new Date().toISOString(),
      };

      const { data: task, error } = await supabase
        .from("tasks")
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;

      // Upload attachments if any
      let attachmentUrls: string[] = [];
      if (attachments.length > 0) {
        for (const file of attachments) {
          const url = await uploadTaskAttachment(task.id, file);
          if (url) attachmentUrls.push(url);
        }

        if (attachmentUrls.length > 0) {
          await supabase
            .from("tasks")
            .update({ attachments: attachmentUrls })
            .eq("id", task.id);
        }
      }

      onTaskCreated();
      onClose();

      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        category: "maintenance",
        due_date: "",
        assigned_to: "",
        is_recurring: false,
        recurrence_pattern: "monthly",
        recurrence_interval: 1,
        recurring_end_date: "",
      });
      setAttachments([]);

      toast.success("Task created successfully!");
    } catch (err) {
      console.error("Error creating task:", err);
      toast.error("Failed to create task");
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 5MB.`);
        return false;
      }
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file.`);
        return false;
      }
      return true;
    });
    setAttachments((prev) => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full sm:max-w-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Create New Task
            </h3>
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
            id="create-task-form"
            onSubmit={handleCreateTask}
            className="space-y-4 sm:space-y-6 pt-4 pb-24"
          >
            <div>
              <label
                htmlFor="task-title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Task Title *
              </label>
              <input
                id="task-title"
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                placeholder="What needs to be done?"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add details about this task (optional)..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="task-priority"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Priority
                </label>
                <select
                  id="task-priority"
                  className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      priority: e.target.value as "low" | "medium" | "high",
                    })
                  }
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="task-category"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Category
                </label>
                <select
                  id="task-category"
                  className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  value={newTask.category}
                  onChange={(e) =>
                    setNewTask({ ...newTask, category: e.target.value })
                  }
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
                <label
                  htmlFor="task-due-date"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Due Date
                </label>
                <input
                  id="task-due-date"
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  value={newTask.due_date}
                  onChange={(e) =>
                    setNewTask({ ...newTask, due_date: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="task-assigned-to"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Assign to
              </label>
              <select
                id="task-assigned-to"
                className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                value={newTask.assigned_to}
                onChange={(e) =>
                  setNewTask({ ...newTask, assigned_to: e.target.value })
                }
              >
                <option value="">👥 Unassigned (anyone can claim)</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    👤 {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Photo Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📷 Attach Photos (Optional)
              </label>
              <div className="space-y-3">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="task-photos"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <CameraIcon className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">
                          Click to upload photos
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG or JPEG (MAX. 5MB each)
                      </p>
                    </div>
                    <input
                      id="task-photos"
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
                          alt={`Attachment ${index + 1}`}
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
                          {file.name.length > 10
                            ? `${file.name.substring(0, 10)}...`
                            : file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recurring Task Options */}
            <div>
              <div className="flex items-center mb-3">
                <input
                  id="task-recurring"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={newTask.is_recurring}
                  onChange={(e) =>
                    setNewTask({ ...newTask, is_recurring: e.target.checked })
                  }
                />
                <label
                  htmlFor="task-recurring"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  🔄 Make this a recurring task
                </label>
              </div>

              {newTask.is_recurring && (
                <div className="pl-6 space-y-4 border-l-2 border-blue-100 bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="task-recurrence-pattern"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Repeat Every
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          max="12"
                          className="w-16 sm:w-20 border border-gray-300 rounded-lg px-2 sm:px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                          value={newTask.recurrence_interval}
                          onChange={(e) =>
                            setNewTask({
                              ...newTask,
                              recurrence_interval:
                                parseInt(e.target.value) || 1,
                            })
                          }
                        />
                        <select
                          id="task-recurrence-pattern"
                          className="flex-1 border border-gray-300 rounded-lg px-2 sm:px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                          value={newTask.recurrence_pattern}
                          onChange={(e) =>
                            setNewTask({
                              ...newTask,
                              recurrence_pattern: e.target.value as any,
                            })
                          }
                        >
                          <option value="daily">Day(s)</option>
                          <option value="weekly">Week(s)</option>
                          <option value="monthly">Month(s)</option>
                          <option value="quarterly">Quarter(s)</option>
                          <option value="yearly">Year(s)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="task-recurring-end"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        End Date (Optional)
                      </label>
                      <input
                        id="task-recurring-end"
                        type="date"
                        className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                        value={newTask.recurring_end_date}
                        onChange={(e) =>
                          setNewTask({
                            ...newTask,
                            recurring_end_date: e.target.value,
                          })
                        }
                        min={
                          newTask.due_date ||
                          new Date().toISOString().split("T")[0]
                        }
                      />
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-700">
                      <strong>📅 Preview:</strong>{" "}
                      {newTask.due_date ? (
                        <>
                          First due:{" "}
                          {new Date(newTask.due_date).toLocaleDateString()},
                          then every{" "}
                          {newTask.recurrence_interval > 1
                            ? `${newTask.recurrence_interval} `
                            : ""}
                          {newTask.recurrence_pattern
                            .replace("ly", "")
                            .replace("quarter", "quarter")}
                          {newTask.recurrence_interval > 1 &&
                          newTask.recurrence_pattern !== "quarterly"
                            ? "s"
                            : ""}
                          {newTask.recurring_end_date &&
                            ` until ${new Date(
                              newTask.recurring_end_date
                            ).toLocaleDateString()}`}
                        </>
                      ) : (
                        "Set a due date to see preview"
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Sticky Footer Buttons */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors order-2 sm:order-1"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-task-form"
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors order-1 sm:order-2 disabled:opacity-50"
              disabled={uploading}
            >
              {uploading ? "Creating..." : "✨ Create Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
