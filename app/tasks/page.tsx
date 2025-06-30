"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/layout/PageHeader";
import StandardCard from "@/components/ui/StandardCard";
import TaskCard from "@/components/tasks/TaskCard";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import EditTaskModal from "@/components/tasks/EditTaskModal";
import PhotoViewer from "@/components/tasks/PhotoViewer";
import DeleteTaskModal from "@/components/tasks/DeleteTaskModal";
import TaskStatsCards from "@/components/tasks/TaskStatsCards";
import TaskFilters from "@/components/tasks/TaskFilters";
import TaskEmptyStates from "@/components/tasks/TaskEmptyStates";
import { 
  PlusIcon, 
  CheckSquareIcon
} from "lucide-react";
import { toast } from "react-hot-toast";
import { CreatePattern } from "@/components/ui/FloatingActionPresets";
import { debugLog, debugError } from "@/lib/utils/debug";
import { PropertyGuard } from "@/components/ui/PropertyGuard";

// Types
type TaskStatus = "pending" | "in_progress" | "completed";
type TaskPriority = "low" | "medium" | "high";
type TaskVisibility = "guest" | "family" | "manager-only" | null;
type RecurrencePattern = "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | null;

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
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
  recurrence_pattern?: RecurrencePattern;
  recurrence_interval?: number;
  parent_task_id?: string | null;
  next_due_date?: string | null;
  recurring_end_date?: string | null;
  attachments?: string[] | null;
  is_public?: boolean;
  visibility?: TaskVisibility;
}

interface UserProfile {
  id: string;
  name: string;
  role: string;
}

type FilterType = "open" | "all" | "pending" | "in-progress" | "completed" | "mine" | "created-by-me" | "cleaning";

interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

// Custom hooks
const useTaskData = (currentProperty: any, user: any) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaningIssues, setCleaningIssues] = useState([]);

  const userId = user?.id;
  const tenantId = currentProperty?.tenant_id;

  const loadUsers = useCallback(async () => {
    if (!tenantId) return;

    try {
      debugLog("🔍 Loading users for tenant:", tenantId);

      const { data: tenantUsers, error: tenantError } = await supabase
        .from("tenant_users")
        .select("user_id, role")
        .eq("tenant_id", tenantId)
        .eq("status", "active");

      if (tenantError) {
        debugError("❌ Error loading tenant users:", tenantError);
        return;
      }

      if (tenantUsers && tenantUsers.length > 0) {
        const userIds = tenantUsers.map((tu) => tu.user_id);

        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        if (profilesError) {
          debugError("❌ Error loading profiles:", profilesError);
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
      debugError("❌ Error loading users:", error);
    }
  }, [tenantId]);

  const loadTasks = useCallback(async (filter: FilterType = "open") => {
    if (!userId || !currentProperty?.id) return;

    setLoading(true);

    try {
      let query = supabase
        .from("tasks")
        .select("*")
        .eq("property_id", currentProperty.id);

      // Apply filters
      switch (filter) {
        case "pending":
          query = query.eq("status", "pending");
          break;
        case "in-progress":
          query = query.eq("status", "in_progress");
          break;
        case "completed":
          query = query.eq("status", "completed");
          break;
        case "cleaning":
          query = query.eq("category", "cleaning");
          break;
        case "open":
          query = query.in("status", ["pending", "in_progress"]);
          break;
        case "mine":
          query = query
            .eq("assigned_to", userId)
            .in("status", ["pending", "in_progress"]);
          break;
        case "created-by-me":
          query = query
            .eq("created_by", userId)
            .in("status", ["pending", "in_progress"]);
          break;
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        // Load user names for task assignments
        const allUserIds = Array.from(
          new Set([
            ...data.map((task) => task.assigned_to).filter(Boolean),
            ...data.map((task) => task.created_by).filter(Boolean),
          ])
        );

        let userNames: Record<string, string> = {};

        if (allUserIds.length > 0) {
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
        }

        // Process tasks with user names
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
    } catch (error) {
      debugError("❌ Error loading tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [userId, currentProperty?.id]);

  const loadCleaningIssues = useCallback(async () => {
    if (!currentProperty?.id) return;

    try {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("property_id", currentProperty.id)
        .eq("is_resolved", false)
        .order("reported_at", { ascending: false });

      setCleaningIssues(data || []);
    } catch (error) {
      debugError("❌ Error loading cleaning issues:", error);
    }
  }, [currentProperty?.id]);

  return {
    tasks,
    users,
    loading,
    cleaningIssues,
    loadTasks,
    loadUsers,
    loadCleaningIssues,
    setTasks
  };
};

// Main component
export default function TasksPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  
  const [filter, setFilter] = useState<FilterType>("open");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingPhotos, setViewingPhotos] = useState<string[] | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [initialTaskData, setInitialTaskData] = useState<Partial<Task> | null>(null);

  const {
    tasks,
    users,
    loading,
    cleaningIssues,
    loadTasks,
    loadUsers,
    loadCleaningIssues,
    setTasks
  } = useTaskData(currentProperty, user);

  // View mode (simplified for now)
  const isManagerView = true;
  const isGuestView = false;
  const isFamilyView = false;

  // Filter tasks based on view permissions
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (isGuestView) {
        return task.is_public || task.visibility === "guest";
      }
      if (isFamilyView) {
        return task.visibility !== "manager-only";
      }
      return true; // Managers see all tasks
    });
  }, [tasks, isGuestView, isFamilyView]);

  // Task statistics
  const taskStats: TaskStats = useMemo(() => ({
    total: filteredTasks.length,
    pending: filteredTasks.filter((t) => t.status === "pending").length,
    inProgress: filteredTasks.filter((t) => t.status === "in_progress").length,
    completed: filteredTasks.filter((t) => t.status === "completed").length,
  }), [filteredTasks]);

  // Load data effect
  useEffect(() => {
    if (authLoading || propertyLoading) return;
    
    if (!user?.id || !currentProperty?.id) {
      setTasks([]);
      return;
    }

    loadTasks(filter);
    loadUsers();
    loadCleaningIssues();
  }, [user?.id, currentProperty?.id, filter, authLoading, propertyLoading, loadTasks, loadUsers, loadCleaningIssues]);

  // Task actions
  const taskActions = {
    claim: useCallback(async (taskId: string) => {
      if (!user?.id) return;

      try {
        const { error } = await supabase
          .from("tasks")
          .update({
            assigned_to: user.id,
            status: "in_progress",
            updated_at: new Date().toISOString(),
          })
          .eq("id", taskId);

        if (error) throw error;

        await loadTasks(filter);
        toast.success("Task claimed successfully!");
      } catch (err) {
        debugError("Error claiming task:", err);
        toast.error("Failed to claim task");
      }
    }, [user?.id, loadTasks, filter]),

    complete: useCallback(async (taskId: string) => {
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
              toast.error("Task completed but failed to create next occurrence");
            } else {
              toast.success("Task completed! Next occurrence created automatically 🔄");
            }
          } else {
            toast.success("Task completed! Recurring series has ended ✅");
          }
        } else {
          toast.success("Task completed! Great job! 🎉");
        }

        await loadTasks(filter);
      } catch (err) {
        debugError("Error completing task:", err);
        toast.error("Failed to complete task");
      }
    }, [tasks, loadTasks, filter]),

    edit: useCallback((task: Task) => {
      setEditingTask(task);
      setIsEditModalOpen(true);
    }, []),

    delete: useCallback(async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      if (task.created_by !== user?.id) {
        toast.error("You can only delete tasks you created");
        return;
      }

      setTaskToDelete(task);
      setIsDeleteModalOpen(true);
    }, [tasks, user?.id])
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

      // Clean up attachments
      if (taskToDelete.attachments?.length) {
        try {
          const filePaths = taskToDelete.attachments
            .filter((url) => url.includes("task-attachments"))
            .map((url) => url.split("task-attachments/")[1]?.split("?")[0])
            .filter(Boolean);

          if (filePaths.length > 0) {
            await supabase.storage.from("task-attachments").remove(filePaths);
          }
        } catch (storageError) {
          console.warn("Could not delete task attachments:", storageError);
        }
      }

      await loadTasks(filter);
      toast.success("Task deleted successfully!");
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
    } catch (err) {
      debugError("Error deleting task:", err);
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  const createTaskFromCleaningIssue = (issue: any) => {
    setInitialTaskData({
      title: `Clean ${issue.location}`,
      description: `Cleaning issue: ${issue.description}`,
      category: "cleaning",
      priority: issue.severity === "high" ? "high" : "medium",
    });
    setIsCreateModalOpen(true);
  };

  // Helper function for recurring tasks
  const calculateNextDueDate = (
    currentDate: string,
    pattern: RecurrencePattern,
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

  // Loading states
  if (authLoading || propertyLoading) {
    return (
      <>
        <PageHeader title="Tasks" subtitle="Loading..." />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <StandardCard>
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading tasks...</p>
              </div>
            </div>
          </StandardCard>
        </div>
      </>
    );
  }

  if (!currentProperty) {
    return (
      <PropertyGuard fallback={<TasksNoPropertyFallback />}>
        <div>Property loading...</div>
      </PropertyGuard>
    );
  }

  return (
    <>
      {/* Remove this PageHeader - it's creating the duplicate header */}
      {/* <PageHeader 
        title="Task Management" 
        subtitle="Manage property tasks and maintenance"
        actions={
          <TaskFilters
            filter={filter}
            onFilterChange={setFilter}
            propertyName={currentProperty?.name}
            cleaningIssuesCount={cleaningIssues.length}
          />
        }
      /> */}
      
      {/* Keep just the content */}
      <div className="space-y-6">
        {/* Move TaskFilters to the top if you still want them */}
        <div className="flex justify-end">
          <TaskFilters
            filter={filter}
            onFilterChange={setFilter}
            propertyName={currentProperty?.name}
            cleaningIssuesCount={cleaningIssues.length}
          />
        </div>

        {/* Task Statistics */}
        <TaskStatsCards stats={taskStats} />

        {/* Main Tasks Card */}
        <StandardCard>
          <TaskEmptyStates
            filteredTasks={filteredTasks}
            filter={filter}
            currentProperty={currentProperty}
            cleaningIssues={cleaningIssues}
            isManagerView={isManagerView}
            onCreateTask={() => setIsCreateModalOpen(true)}
            onFilterChange={setFilter}
            onCreateTaskFromIssue={createTaskFromCleaningIssue}
          />

          {filteredTasks.length > 0 && (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  userId={user?.id || ""}
                  onClaim={taskActions.claim}
                  onComplete={taskActions.complete}
                  onEdit={taskActions.edit}
                  onDelete={taskActions.delete}
                  onViewPhotos={setViewingPhotos}
                />
              ))}

              {filteredTasks.length <= 5 && (
                <div className="text-center py-8 border-t border-gray-200 mt-8">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-px bg-gray-200 flex-1 max-w-20"></div>
                    <span className="px-4 text-sm text-gray-400">That's it!</span>
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
        </StandardCard>

        {/* Modals */}
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setInitialTaskData(null);
          }}
          onTaskCreated={() => loadTasks(filter)}
          users={users}
          currentProperty={currentProperty}
          currentUser={user}
          initialData={initialTaskData}
        />

        <EditTaskModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTask(null);
          }}
          onTaskUpdated={() => loadTasks(filter)}
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
    </>
  );
}

// Also update the fallback component to remove PageHeader
function TasksNoPropertyFallback() {
  return (
    <StandardCard>
      <div className="text-center py-12">
        <CheckSquareIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Property Selected
        </h3>
        <p className="text-gray-600 mb-6">
          You need to create or select a property to manage tasks.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => (window.location.href = "/properties/new")}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create New Property
          </button>
          <button
            onClick={() => (window.location.href = "/properties")}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View All Properties
          </button>
        </div>
      </div>
    </StandardCard>
  );
}