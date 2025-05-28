"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { PlusIcon, FilterIcon, CheckIcon } from "lucide-react";

// Task type definition
type Task = {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  category: string;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  due_date: string | null;
};

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'pending', 'in-progress', 'completed', 'mine'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "maintenance",
    due_date: "",
  });

  // Load tasks based on filter
  const loadTasks = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase.from("tasks").select("*");

      // Apply filters
      if (filter === "pending") {
        query = query.eq("status", "pending");
      } else if (filter === "in-progress") {
        query = query.eq("status", "in-progress");
      } else if (filter === "completed") {
        query = query.eq("status", "completed");
      } else if (filter === "mine") {
        query = query.eq("assigned_to", user.id);
      }

      // Only show completed tasks to owners/managers
      if (!user.isAdmin && !user.isManager && filter !== "completed") {
        query = query.neq("status", "completed");
      }

      // Sort by priority and creation date
      const { data, error } = await query
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (data) setTasks(data);
      if (error) console.error("Error loading tasks:", error);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [user, filter, supabase, setTasks, setLoading]);

  // Initial load and reload when filter changes
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Create a new task
  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          category: newTask.category,
          due_date: newTask.due_date || null,
          status: "pending",
          created_by: user?.id || "",
          assigned_to: null,
        })
        .select();

      if (error) throw error;

      setTasks([data[0], ...tasks]);
      setIsCreateModalOpen(false);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        category: "maintenance",
        due_date: "",
      });
    } catch (err) {
      console.error("Error creating task:", err);
      alert("Failed to create task");
    }
  };

  // Claim a task
  const claimTask = async (taskId: string) => {
    if (!user?.id) return; // Early return if no user ID

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ assigned_to: user.id, status: "in-progress" })
        .eq("id", taskId);

      if (error) throw error;

      // Fix typing issue with the map function
      setTasks(
        tasks.map((task) => {
          if (task.id === taskId) {
            return {
              ...task,
              assigned_to: user.id,
              status: "in-progress" as const,
            };
          }
          return task;
        })
      );
    } catch (err) {
      console.error("Error claiming task:", err);
      alert("Failed to claim task");
    }
  };

  // Complete a task
  const completeTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "completed" })
        .eq("id", taskId);

      if (error) throw error;

      // Fix typing here too
      setTasks(
        tasks.map((task) => {
          if (task.id === taskId) {
            return {
              ...task,
              status: "completed" as const,
            };
          }
          return task;
        })
      );
    } catch (err) {
      console.error("Error completing task:", err);
      alert("Failed to complete task");
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Task Management</h1>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                aria-label="Filter tasks"
                id="task-filter"
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="mine">Assigned to Me</option>
                {(user?.isAdmin || user?.isManager) && (
                  <option value="completed">Completed</option>
                )}
              </select>
              <label htmlFor="task-filter" className="sr-only">
                Filter tasks
              </label>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FilterIcon className="h-4 w-4" />
              </div>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Task
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-10 text-center">
            <p className="text-gray-500 mb-4">No tasks found</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Your First Task
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="border rounded-lg p-4 bg-white shadow"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{task.title}</h3>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      task.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : task.priority === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mt-2 mb-4 line-clamp-3">
                  {task.description}
                </p>

                <div className="mt-4 flex justify-between items-center">
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

                  <div className="flex space-x-2">
                    {task.status === "pending" && (
                      <button
                        onClick={() => claimTask(task.id)}
                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded"
                      >
                        Claim
                      </button>
                    )}

                    {task.status !== "completed" &&
                      task.assigned_to === user?.id && (
                        <button
                          onClick={() => completeTask(task.id)}
                          className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded flex items-center"
                        >
                          <CheckIcon className="h-3 w-3 mr-1" />
                          Complete
                        </button>
                      )}
                  </div>
                </div>

                {task.due_date && (
                  <div className="mt-3 text-xs text-gray-500">
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Create New Task</h3>

              <form onSubmit={handleCreateTask}>
                <div className="mb-4">
                  <label
                    htmlFor="task-title"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Title
                  </label>
                  <input
                    id="task-title"
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="task-description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="task-description"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={4}
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    required
                    aria-label="Task description"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="task-priority"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Priority
                    </label>
                    <select
                      id="task-priority"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={newTask.priority}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          priority: e.target.value as "low" | "medium" | "high",
                        })
                      }
                      aria-label="Task priority"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="task-category"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Category
                    </label>
                    <select
                      id="task-category"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={newTask.category}
                      onChange={(e) =>
                        setNewTask({ ...newTask, category: e.target.value })
                      }
                      aria-label="Task category"
                    >
                      <option value="maintenance">Maintenance</option>
                      <option value="cleaning">Cleaning</option>
                      <option value="supplies">Supplies</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="task-due-date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Due Date (Optional)
                  </label>
                  <input
                    id="task-due-date"
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={newTask.due_date}
                    onChange={(e) =>
                      setNewTask({ ...newTask, due_date: e.target.value })
                    }
                    aria-label="Task due date"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
