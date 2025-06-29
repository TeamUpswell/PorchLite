"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import TaskCard from "@/components/tasks/TaskCard";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import EditTaskModal from "@/components/tasks/EditTaskModal";
import PhotoViewer from "@/components/tasks/PhotoViewer";
import DeleteTaskModal from "@/components/tasks/DeleteTaskModal";
import { 
  PlusIcon, 
  CheckSquareIcon, 
  Clock, 
  Users, 
  CheckCircle 
} from "lucide-react";
import { toast } from "react-hot-toast";
import { CreatePattern } from "@/components/ui/FloatingActionPresets";
import { debugLog, debugError } from "@/lib/utils/debug";
import { PropertyGuard } from "@/components/ui/PropertyGuard";

// ✅ Updated Task type definition with visibility fields
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
  // ✅ Add missing visibility fields
  is_public?: boolean;
  visibility?: "guest" | "family" | "manager-only" | null;
};

type UserProfile = {
  id: string;
  name: string;
  role: string;
};

export default function TasksPage() {
  // ✅ HOOKS FIRST - ALL hooks must be called before any early returns
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingPhotos, setViewingPhotos] = useState<string[] | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cleaningIssues, setCleaningIssues] = useState([]);
  const [initialTaskData, setInitialTaskData] = useState<Partial<Task> | null>(
    null
  );

  // ✅ FIXED: Define view mode variables (replacing useViewMode)
  const isManagerView = true; // Assume manager view for now
  const isGuestView = false;
  const isFamilyView = false;

  // Memoize property and user IDs to prevent unnecessary re-renders
  const property_id = useMemo(() => currentProperty?.id, [currentProperty?.id]);
  const userId = useMemo(() => user?.id, [user?.id]);
  const tenantId = useMemo(
    () => currentProperty?.tenant_id,
    [currentProperty?.tenant_id]
  );

  // Load users
  const loadUsers = useCallback(async () => {
    if (!tenantId) {
      debugLog("🔍 No tenant ID for loading users");
      return;
    }

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

      debugLog("✅ Found tenant users:", tenantUsers?.length || 0);

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

        debugLog("✅ Processed user profiles:", userProfiles.length);
        setUsers(userProfiles);
      }
    } catch (error) {
      debugError("❌ Error loading users:", error);
    }
  }, [tenantId]);

  // Load tasks
  const loadTasks = useCallback(async () => {
    if (!userId || !currentProperty?.id) return;

    setLoading(true);

    debugLog("🔍 Loading tasks:", {
      userId,
      property_id: currentProperty.id,
      propertyName: currentProperty.name,
      filter,
    });

    try {
      let query = supabase
        .from("tasks")
        .select("*")
        .eq("property_id", currentProperty.id);

      // Apply filters based on current filter state
      if (filter === "pending") {
        query = query.eq("status", "pending");
      } else if (filter === "in-progress") {
        query = query.eq("status", "in_progress");
      } else if (filter === "completed") {
        query = query.eq("status", "completed");
      } else if (filter === "cleaning") {
        query = query.eq("category", "cleaning");
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

      if (error) {
        debugError("❌ Tasks query error:", error);
        throw error;
      }

      debugLog("✅ Loaded tasks successfully:", data?.length || 0);

      if (data) {
        // Get unique user IDs from tasks
        const allUserIds = Array.from(
          new Set([
            ...data.map((task) => task.assigned_to).filter(Boolean),
            ...data.map((task) => task.created_by).filter(Boolean),
          ])
        );

        let userNames: Record<string, string> = {};

        // Load user profiles separately if we have user IDs
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
  }, [userId, currentProperty?.id, filter]);

  // Load unresolved cleaning issues
  const loadUnresolvedCleaningIssues = useCallback(async () => {
    if (!currentProperty?.id) return;

    debugLog(
      "🔍 Loading unresolved cleaning issues for property:",
      currentProperty.id
    );

    try {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("property_id", currentProperty.id)
        .eq("is_resolved", false)
        .order("reported_at", { ascending: false });

      setCleaningIssues(data || []);
      debugLog("✅ Found unresolved cleaning issues:", data?.length || 0);
    } catch (error) {
      debugError("❌ Error loading cleaning issues:", error);
    }
  }, [currentProperty?.id]);

  // ✅ TIMING FIX: Updated useEffect with proper dependencies
  useEffect(() => {
    // Don't fetch if still loading auth/property
    if (authLoading || propertyLoading) {
      return;
    }

    // Don't fetch if no user or property
    if (!user?.id || !currentProperty?.id) {
      debugLog("⏳ Waiting for user and property to load...");
      setLoading(false);
      setTasks([]);
      return;
    }

    debugLog("🔍 Tasks useEffect triggered:", {
      userId: user.id,
      property_id: currentProperty.id,
      propertyName: currentProperty.name,
      filter,
    });

    loadTasks();
    loadUnresolvedCleaningIssues();
  }, [
    user?.id,
    currentProperty?.id,
    filter,
    authLoading,
    propertyLoading,
    loadTasks,
    loadUnresolvedCleaningIssues,
  ]);

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
      debugError("Error claiming task:", err);
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
            debugError("Error creating next recurring task:", createError);
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
      debugError("Error completing task:", err);
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
      debugError("Error deleting task:", err);
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

  const handleCreateTask = async (taskData: Partial<Task>) => {
    if (!userId || !currentProperty?.id) {
      toast.error("Missing user or property information");
      return;
    }

    try {
      const newTask = {
        ...taskData,
        property_id: currentProperty.id,
        created_by: userId,
        status: taskData.status || "pending",
        priority: taskData.priority || "medium",
      };

      const { data, error } = await supabase
        .from("tasks")
        .insert(newTask)
        .select()
        .single();

      if (error) throw error;

      toast.success("Task created successfully!");
      setIsCreateModalOpen(false);
      loadTasks(); // Refresh the task list
    } catch (error) {
      debugError("❌ Error creating task:", error);
      toast.error("Failed to create task");
    }
  };

  // Add missing function for cleaning issues
  const createTaskFromCleaningIssue = async (issue: any) => {
    setInitialTaskData({
      title: `Clean ${issue.location}`,
      description: `Cleaning issue: ${issue.description}`,
      category: "cleaning",
      priority: issue.severity === "high" ? "high" : "medium",
    });
    setIsCreateModalOpen(true);
  };

  // Filter tasks based on view mode
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

  // Memoized task statistics
  const taskStats = useMemo(() => {
    const stats = {
      total: filteredTasks.length,
      pending: filteredTasks.filter((t) => t.status === "pending").length,
      inProgress: filteredTasks.filter((t) => t.status === "in_progress").length,
      completed: filteredTasks.filter((t) => t.status === "completed").length,
    };
    return stats;
  }, [filteredTasks]);

  // Early returns for loading states
  if (authLoading || propertyLoading) {
    return (
      <StandardPageLayout>
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

  if (!currentProperty) {
    return (
      <PropertyGuard fallback={<TasksNoPropertyFallback />}>
        <div>Property loading...</div>
      </PropertyGuard>
    );
  }

  return (
    <StandardPageLayout>
      <div className="space-y-6">
        {/* ✅ Task Statistics Cards - Better layout from standalone version */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StandardCard>
            <div className="flex items-center">
              <CheckSquareIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Tasks
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {taskStats.total}
                </p>
              </div>
            </div>
          </StandardCard>

          <StandardCard>
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pending
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {taskStats.pending}
                </p>
              </div>
            </div>
          </StandardCard>

          <StandardCard>
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  In Progress
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {taskStats.inProgress}
                </p>
              </div>
            </div>
          </StandardCard>

          <StandardCard>
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Completed
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {taskStats.completed}
                </p>
              </div>
            </div>
          </StandardCard>
        </div>

        {/* Main Tasks Card */}
        <StandardCard
          title="Task Management"
          subtitle="Manage property tasks and maintenance"
          headerActions={
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                {currentProperty?.name}
                {cleaningIssues.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    {cleaningIssues.length} cleaning issues
                  </span>
                )}
              </span>

              {/* ✅ Added label and accessible name for select */}
              <label htmlFor="task-filter" className="sr-only">
                Filter tasks
              </label>
              <select
                id="task-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
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
          }
        >
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

              {cleaningIssues.length > 0 && (
                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">
                    📋 Unresolved Cleaning Issues ({cleaningIssues.length})
                  </h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    Consider creating tasks for these cleaning issues:
                  </p>
                  <div className="space-y-2">
                    {cleaningIssues.slice(0, 3).map((issue: any) => (
                      <div
                        key={issue.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-yellow-800">
                          {issue.location}:{" "}
                          {issue.description.substring(0, 50)}
                          ...
                        </span>
                        <button
                          onClick={() => createTaskFromCleaningIssue(issue)}
                          className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                        >
                          Create Task
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
        </StandardCard>

        {/* Modals */}
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setInitialTaskData(null);
          }}
          onTaskCreated={loadTasks}
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
  );
}

// Custom fallback for tasks when no property is selected
function TasksNoPropertyFallback() {
  return (
    <StandardPageLayout>
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
    </StandardPageLayout>
  );
}