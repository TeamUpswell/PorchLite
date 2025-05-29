"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
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

export default function TasksPage() {
  const { user } = useAuth();
  const { currentProperty } = useProperty();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open"); // Changed from "all" to "open"
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingPhotos, setViewingPhotos] = useState<string[] | null>(null);

  // Add state for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Add state for delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add delete confirmation state
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

    setLoading(true);

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
        // Open tasks = pending OR in_progress (not completed)
        query = query.in("status", ["pending", "in_progress"]);
      } else if (filter === "mine") {
        query = query
          .eq("assigned_to", userId)
          .in("status", ["pending", "in_progress"]);
      } else if (filter === "created-by-me") {
        query = query
          .eq("created_by", userId)
          .in("status", ["pending", "in_progress"]);
      } else if (filter === "all") {
        // All tasks including completed ones
        // No additional filter needed
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
    } finally {
      setLoading(false);
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

  // Add the deleteTask function
  const deleteTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Check if user is the creator
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
      // Delete task from database
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskToDelete.id);

      if (error) throw error;

      // If task has attachments, try to delete them from storage
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

  // Loading state
  if (loading) {
    return (
      <StandardPageLayout
        title="Task Management"
        headerIcon={<CheckSquareIcon className="h-6 w-6 text-blue-600" />}
      >
        <StandardCard>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading tasks...</span>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  // No property selected
  if (!currentProperty) {
    return (
      <StandardPageLayout
        title="Task Management"
        headerIcon={<CheckSquareIcon className="h-6 w-6 text-blue-600" />}
      >
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
    <StandardPageLayout
      title={`${currentProperty.name} - Tasks`}
      headerIcon={<CheckSquareIcon className="h-6 w-6 text-blue-600" />}
      action={
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Task
        </button>
      }
    >
      {/* Smart floating action button - compact on mobile, expandable on desktop */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="group flex items-center justify-center bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full shadow-lg transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50
    
    /* Mobile: circular button */
    w-14 h-14 sm:w-auto sm:h-auto
    
    /* Desktop: expandable button with text */
    sm:px-4 sm:py-3 sm:rounded-lg sm:hover:scale-105"
          aria-label="Create new task"
        >
          <PlusIcon className="h-6 w-6 transition-transform group-hover:rotate-90 duration-200 sm:mr-0 group-hover:sm:mr-2" />

          {/* Text appears on desktop hover */}
          <span className="hidden sm:inline-block sm:w-0 sm:overflow-hidden sm:whitespace-nowrap sm:transition-all sm:duration-300 group-hover:sm:w-auto group-hover:sm:ml-2">
            Create Task
          </span>
        </button>
      </div>

      {/* Filter dropdown */}
      <div className="mb-6">
        <label
          htmlFor="task-filter"
          className="block text-sm font-medium text-gray-400 mb-2" // Changed from gray-500 to gray-400
        >
          Filter Tasks
        </label>
        <select
          id="task-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full sm:w-auto border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

      {/* Task cards */}
      {tasks.length === 0 ? (
        // Empty state when no tasks exist
        <StandardCard>
          <div className="text-center py-12">
            <CheckSquareIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No Tasks Found
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === "open"
                ? "No open tasks found. Get started by creating your first task!"
                : filter === "all"
                ? "Get started by creating your first task"
                : filter === "completed"
                ? "No completed tasks found"
                : `No tasks match the "${filter}" filter`}
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Your First Task
            </button>
          </div>
        </StandardCard>
      ) : (
        // Task grid with placeholder cards
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {/* Existing tasks */}
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              userId={userId || ""}
              onClaim={claimTask}
              onComplete={completeTask}
              onEdit={editTask}
              onDelete={deleteTask}
              onViewPhotos={setViewingPhotos}
            />
          ))}

          {/* Create task placeholder cards - show until we have 4 tasks */}
          {tasks.length < 4 &&
            Array.from({ length: 4 - tasks.length }).map((_, index) => (
              <CreateTaskPlaceholder
                key={`placeholder-${index}`}
                onClick={() => setIsCreateModalOpen(true)}
                taskCount={tasks.length}
                placeholderIndex={index}
              />
            ))}
        </div>
      )}

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
    </StandardPageLayout>
  );
}
