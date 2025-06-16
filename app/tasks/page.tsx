"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import TaskCard from "@/components/tasks/TaskCard";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import EditTaskModal from "@/components/tasks/EditTaskModal";
import PhotoViewer from "@/components/tasks/PhotoViewer";
import CreateTaskPlaceholder from "@/components/tasks/CreateTaskPlaceholder";
import DeleteTaskModal from "@/components/tasks/DeleteTaskModal";
import { PlusIcon, CheckSquareIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { CreatePattern } from "@/components/ui/FloatingActionPresets";
import { useViewMode } from "@/lib/hooks/useViewMode";
import { PropertyGuard } from "@/components/ui/PropertyGuard";

// Task type definition
type Task = {
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
  recurrence_pattern?:
    | "daily"
    | "weekly"
    | "monthly"
    | "quarterly"
    | "yearly"
    | null;
  recurrence_interval?: number;
  parent_task_id?: string | null;
  next_due_date?: string | null;
  recurring_end_date?: string | null;
  attachments?: string[] | null;
};

type UserProfile = {
  id: string;
  name: string;
  role: string;
};

const TASK_CATEGORIES = [
  { value: "maintenance", label: "🔧 Maintenance", color: "orange" },
  { value: "repair", label: "🛠️ Repair", color: "red" },
  { value: "cleaning", label: "🧽 Cleaning", color: "blue" },
  { value: "inspection", label: "🔍 Inspection", color: "purple" },
  { value: "safety", label: "⚠️ Safety", color: "yellow" },
  { value: "utilities", label: "⚡ Utilities", color: "indigo" },
  { value: "landscaping", label: "🌱 Landscaping", color: "green" },
  { value: "tenant_request", label: "🏠 Tenant Request", color: "teal" },
  { value: "administrative", label: "📋 Administrative", color: "gray" },
  { value: "seasonal", label: "🗓️ Seasonal", color: "cyan" },
  { value: "inventory", label: "📦 Inventory", color: "pink" },
  { value: "other", label: "📝 Other", color: "slate" },
];

const TASK_PRIORITIES = [
  { value: "low", label: "Low", color: "green" },
  { value: "medium", label: "Medium", color: "yellow" },
  { value: "high", label: "High", color: "orange" },
  { value: "critical", label: "Critical", color: "red" },
];

const TASK_STATUSES = [
  { value: "pending", label: "Pending", color: "gray" },
  { value: "in_progress", label: "In Progress", color: "blue" },
  { value: "completed", label: "Completed", color: "green" },
];

export default function TasksPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filter, setFilter] = useState("open");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingPhotos, setViewingPhotos] = useState<string[] | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Memoize property and user IDs to prevent unnecessary re-renders
  const propertyId = useMemo(() => currentProperty?.id, [currentProperty?.id]);
  const userId = useMemo(() => user?.id, [user?.id]);
  const tenantId = useMemo(
    () => currentProperty?.tenant_id,
    [currentProperty?.tenant_id]
  );

  // Load users
  const loadUsers = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data: tenantUsers, error: tenantError } = await supabase
        .from("tenant_users")
        .select("user_id, role")
        .eq("tenant_id", tenantId)
        .eq("status", "active");

      if (tenantError) {
        console.error("❌ Error loading tenant users:", tenantError);
        return;
      }

      if (tenantUsers && tenantUsers.length > 0) {
        const userIds = tenantUsers.map((tu) => tu.user_id);

        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        if (profilesError) {
          console.error("❌ Error loading profiles:", profilesError);
          return;
        }

        const userProfiles = tenantUsers.map((tenantUser) => {
          const profile = profiles?.find((p) => p.id === tenantUser.user_id);
          return {
            id: tenantUser.user_id,
            name: profile?.full_name || profile?.email || "Unknown User",
            role: tenantUser.role,
          };
        });

        setUsers(userProfiles);
      }
    } catch (error) {
      console.error("❌ Error loading users:", error);
    }
  }, [tenantId]);

  // Load tasks
  const loadTasks = useCallback(async () => {
    if (!userId || !propertyId) return;

    try {
      let query = supabase
        .from("tasks")
        .select("*")
        .eq("property_id", propertyId);

      // Apply filters
      if (filter === "pending") {
        query = query.eq("status", "pending");
      } else if (filter === "in-progress") {
        query = query.eq("status", "in_progress");
      } else if (filter === "completed") {
        query = query.eq("status", "completed");
      } else if (filter === "open") {
        query = query.in("status", ["pending", "in_progress"]);
      } else if (filter === "mine") {
        query = query
          .eq("assigned_to", userId)
          .in("status", ["pending", "in_progress"]);
      } else if (filter === "created-by-me") {
        query = query
          .eq("created_by", userId)
          .in("status", ["pending", "in_progress"]);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      if (data) {
        const allUserIds = Array.from(
          new Set([
            ...data.map((task) => task.assigned_to).filter(Boolean),
            ...data.map((task) => task.created_by).filter(Boolean),
          ])
        );

        let userNames: Record<string, string> = {};

        if (allUserIds.length > 0) {
          try {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, full_name, email")
              .in("id", allUserIds);

            if (profiles) {
              profiles.forEach((profile) => {
                userNames[profile.id] =
                  profile.full_name || profile.email || "Unknown User";
              });
            }
          } catch (profileError) {
            console.warn("Could not load user profiles:", profileError);
          }
        }

        const tasksWithNames = data.map((task) => ({
          ...task,
          assigned_user_name: task.assigned_to
            ? userNames[task.assigned_to] ||
              (task.assigned_to === userId ? "You" : "Team Member")
            : null,
          created_by_name:
            task.created_by === userId
              ? "You"
              : userNames[task.created_by] || "Team Member",
        }));

        setTasks(tasksWithNames);
      }
    } catch (err) {
      console.error("❌ Failed to load tasks:", err);
      toast.error("Failed to load tasks");
    }
  }, [userId, propertyId, filter]);

  // Load data
  useEffect(() => {
    if (propertyId && userId) {
      loadTasks();
      loadUsers();
    }
  }, [propertyId, userId, filter]);

  // Task actions
  const claimTask = async (taskId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          assigned_to: userId,
          status: "in_progress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      if (error) throw error;

      await loadTasks();
      toast.success("Task claimed successfully!");
    } catch (err) {
      console.error("Error claiming task:", err);
      toast.error("Failed to claim task");
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const { error: updateError } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      if (updateError) throw updateError;

      // Handle recurring tasks
      if (task.is_recurring && task.recurrence_pattern && task.due_date) {
        const nextDueDate = calculateNextDueDate(
          task.due_date,
          task.recurrence_pattern,
          task.recurrence_interval || 1
        );

        const shouldCreateNext =
          !task.recurring_end_date ||
          new Date(nextDueDate) <= new Date(task.recurring_end_date);

        if (shouldCreateNext) {
          const nextTaskData = {
            title: task.title,
            description: task.description,
            priority: task.priority,
            category: task.category,
            due_date: nextDueDate,
            assigned_to: task.assigned_to,
            status: task.assigned_to ? "in_progress" : "pending",
            created_by: task.created_by,
            property_id: task.property_id,
            tenant_id: task.tenant_id,
            is_recurring: true,
            recurrence_pattern: task.recurrence_pattern,
            recurrence_interval: task.recurrence_interval,
            parent_task_id: task.parent_task_id || task.id,
            recurring_end_date: task.recurring_end_date,
            updated_at: new Date().toISOString(),
          };

          const { error: createError } = await supabase
            .from("tasks")
            .insert(nextTaskData);

          if (createError) {
            console.error("Error creating next recurring task:", createError);
            toast.error("Task completed but failed to create next occurrence");
          } else {
            toast.success(
              "Task completed! Next occurrence created automatically 🔄"
            );
          }
        } else {
          toast.success("Task completed! Recurring series has ended ✅");
        }
      } else {
        toast.success("Task completed! Great job! 🎉");
      }

      await loadTasks();
    } catch (err) {
      console.error("Error completing task:", err);
      toast.error("Failed to complete task");
    }
  };

  const editTask = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const deleteTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.created_by !== userId) {
      toast.error("You can only delete tasks you created");
      return;
    }

    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskToDelete.id);

      if (error) throw error;

      if (taskToDelete.attachments && taskToDelete.attachments.length > 0) {
        try {
          const filePaths = taskToDelete.attachments
            .filter((url) => url.includes("task-attachments"))
            .map((url) => {
              const path = url.split("task-attachments/")[1];
              return path?.split("?")[0];
            })
            .filter(Boolean);

          if (filePaths.length > 0) {
            await supabase.storage.from("task-attachments").remove(filePaths);
          }
        } catch (storageError) {
          console.warn("Could not delete task attachments:", storageError);
        }
      }

      await loadTasks();
      toast.success("Task deleted successfully!");
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
    } catch (err) {
      console.error("Error deleting task:", err);
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate next due date for recurring tasks
  const calculateNextDueDate = (
    currentDate: string,
    pattern: string,
    interval: number
  ): string => {
    const date = new Date(currentDate);

    switch (pattern) {
      case "daily":
        date.setDate(date.getDate() + interval);
        break;
      case "weekly":
        date.setDate(date.getDate() + interval * 7);
        break;
      case "monthly":
        date.setMonth(date.getMonth() + interval);
        break;
      case "quarterly":
        date.setMonth(date.getMonth() + interval * 3);
        break;
      case "yearly":
        date.setFullYear(date.getFullYear() + interval);
        break;
    }

    return date.toISOString().split("T")[0];
  };

  const { isManagerView, isFamilyView, isGuestView, viewMode } = useViewMode();

  // Filter tasks based on view mode
  const filteredTasks = tasks.filter((task) => {
    if (isGuestView) {
      return task.is_public || task.visibility === "guest";
    }
    if (isFamilyView) {
      return task.visibility !== "manager-only";
    }
    return true; // Managers see all tasks
  });

  // ✅ Loading states using StandardPageLayout
  if (authLoading || propertyLoading) {
    return (
      <StandardPageLayout theme="dark" showHeader={false}>
        <StandardCard>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading tasks...</p>
            </div>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (!user) {
    return null; // Auth will redirect
  }

  if (!currentProperty) {
    return (
      <StandardPageLayout theme="dark" showHeader={false}>
        <StandardCard>
          <div className="text-center py-8">
            <CheckSquareIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Property Selected
            </h3>
            <p className="text-gray-500">
              Please select a property to view its tasks.
            </p>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  return (
    <PropertyGuard fallback={<DashboardNoPropertyFallback />}>
      <StandardPageLayout theme="dark" showHeader={false}>
        <div className="space-y-6">
          <StandardCard
            title="Property Tasks"
            subtitle="Manage your property tasks and maintenance"
            headerActions={
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {currentProperty?.name} • {tasks.length} tasks
                </span>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="open">Open Tasks</option>
                  <option value="all">All Tasks</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="mine">My Open Tasks</option>
                  <option value="created-by-me">Created by Me (Open)</option>
                </select>
              </div>
            }
          >
            <div className="space-y-6">
              {/* Task management buttons */}
              {(isManagerView || isFamilyView) && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Task
                  </button>
                </div>
              )}

              {/* Task cards */}
              {filteredTasks.length === 0 && filter === "open" ? (
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
                    No open tasks for <strong>{currentProperty.name}</strong>.
                    Everything is running smoothly!
                  </p>
                  <p className="text-sm text-gray-400 mb-8">
                    Check back later or create a new task if something needs
                    attention.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Create New Task
                    </button>
                    <button
                      onClick={() => setFilter("completed")}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      View Completed Tasks
                    </button>
                    {isManagerView && (
                      <button
                        onClick={() => setFilter("all")}
                        className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        View All Tasks
                      </button>
                    )}
                  </div>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckSquareIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    No Tasks Found
                  </h3>
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
                        onClick={() => setFilter("all")}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        View All Tasks
                      </button>
                    )}
                    <button
                      onClick={() => setFilter("open")}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      View Open Tasks
                    </button>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Create Task
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      userId={userId || ""}
                      onClaim={claimTask}
                      onComplete={completeTask}
                      onEdit={editTask}
                      onDelete={deleteTask}
                      onViewPhotos={setViewingPhotos}
                      layout="default" // Pass the layout prop here
                    />
                  ))}

                  {filteredTasks.length > 0 && filteredTasks.length <= 5 && (
                    <div className="text-center py-8 border-t border-gray-200 mt-8">
                      <div className="flex items-center justify-center mb-3">
                        <div className="h-px bg-gray-200 flex-1 max-w-20"></div>
                        <span className="px-4 text-sm text-gray-400">
                          That's it!
                        </span>
                        <div className="h-px bg-gray-200 flex-1 max-w-20"></div>
                      </div>
                      <p className="text-sm text-gray-500">
                        {filteredTasks.length === 1
                          ? "Just one task to focus on."
                          : `Only ${filteredTasks.length} tasks to manage right now.`}
                      </p>
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mt-4 inline-flex items-center px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add another task
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </StandardCard>

          {/* Modals */}
          <CreateTaskModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onTaskCreated={loadTasks}
            users={users}
            currentProperty={currentProperty}
            currentUser={user}
          />

          <EditTaskModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingTask(null);
            }}
            onTaskUpdated={loadTasks}
            users={users}
            currentProperty={currentProperty}
            currentUser={user}
            task={editingTask}
          />

          <PhotoViewer
            photos={viewingPhotos || []}
            isOpen={!!viewingPhotos}
            onClose={() => setViewingPhotos(null)}
          />

          <DeleteTaskModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setTaskToDelete(null);
            }}
            onConfirm={confirmDeleteTask}
            taskTitle={taskToDelete?.title || ""}
            isDeleting={isDeleting}
          />

          <CreatePattern
            onClick={() => setIsCreateModalOpen(true)}
            label="Create Task"
          />
        </div>
      </StandardPageLayout>
    </PropertyGuard>
  );
}

// Custom fallback for dashboard when no property is selected
function DashboardNoPropertyFallback() {
  return (
    <StandardPageLayout theme="dark" showHeader={false}>
      <StandardCard>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to PorchLite
          </h2>
          <p className="text-gray-600 mb-6">
            You need to create or select a property to get started.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => (window.location.href = "/properties/new")}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create New Property
            </button>
            <button
              onClick={() => (window.location.href = "/properties")}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View All Properties
            </button>
          </div>
        </div>
      </StandardCard>
    </StandardPageLayout>
  );
}
