"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  AlertTriangle,
  RefreshCw,
  Building,
  Filter,
  Users,
  Clock,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { CreatePattern } from "@/components/ui/FloatingActionPresets";
import { useViewMode } from "@/lib/hooks/useViewMode";
import { PropertyGuard } from "@/components/ui/PropertyGuard";

// Enhanced Task type with better typing
interface Task {
  id: string;
  property_id: string;
  title: string; // ✅ Use title instead of description
  description: string | null;
  priority: "low" | "medium" | "high" | "critical"; // ✅ Use priority instead of severity
  status: string;
  user_id: string | null;
  created_by: string | null;
  assigned_to: string | null; // ✅ Use assigned_to instead of reported_by
  category: string | null;
  due_date: string | null;
  completed_at: string | null; // ✅ Use completed_at instead of resolved_at
  is_recurring: boolean | null;
  attachments: string[] | null; // ✅ Use attachments instead of photo_urls
  created_at: string;
  updated_at: string;
  tenant_id: string | null;
  // Add computed fields for display
  assigned_user_name?: string;
  created_by_name?: string;
}

interface UserProfile {
  id: string;
  name: string;
  role: string;
  email?: string;
}

interface TasksState {
  tasks: Task[];
  users: UserProfile[];
  loading: boolean;
  error: string | null;
  lastFetch: string | null;
}

interface TaskFilter {
  value: string;
  label: string;
  count?: number;
}

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
] as const;

const INITIAL_STATE: TasksState = {
  tasks: [],
  users: [],
  loading: false,
  error: null,
  lastFetch: null,
};

export default function TasksPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const { isManagerView, isFamilyView, isGuestView } = useViewMode();

  // State management
  const [state, setState] = useState<TasksState>(INITIAL_STATE);
  const [filter, setFilter] = useState("open");
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [viewingPhotos, setViewingPhotos] = useState<string[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Refs for optimization
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);
  const lastLoadParamsRef = useRef<string>("");

  // Component cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Memoized values
  const isInitializing = useMemo(() => {
    return authLoading || propertyLoading;
  }, [authLoading, propertyLoading]);

  const property_id = useMemo(() => currentProperty?.id, [currentProperty?.id]);
  const userId = useMemo(() => user?.id, [user?.id]);
  const tenantId = useMemo(
    () => currentProperty?.tenant_id,
    [currentProperty?.tenant_id]
  );

  // Memoized user permission check
  const hasTaskPermissions = useMemo(() => {
    return isManagerView || isFamilyView;
  }, [isManagerView, isFamilyView]);

  // Enhanced data loading function
  const loadTasksAndUsers = useCallback(
    async (
      userIdParam: string,
      property_idParam: string,
      tenantIdParam: string,
      filterParam: string,
      showRefreshFeedback = false
    ) => {
      // Create cache key
      const cacheKey = `${userIdParam}-${property_idParam}-${tenantIdParam}-${filterParam}`;

      // Prevent duplicate requests
      if (loadingRef.current || lastLoadParamsRef.current === cacheKey) {
        return;
      }

      loadingRef.current = true;
      lastLoadParamsRef.current = cacheKey;

      try {
        if (showRefreshFeedback) {
          setRefreshing(true);
        } else {
          setState((prev) => ({ ...prev, loading: true, error: null }));
        }

        console.log("🔄 Loading tasks and users...", {
          property_idParam,
          filterParam,
        });

        // Load tasks and users in parallel
        const [tasksResult, usersResult] = await Promise.allSettled([
          // Tasks query - use correct field names
          (async () => {
            let query = supabase
              .from("tasks")
              .select("*")
              .eq("property_id", property_idParam);

            // Apply filters with correct field names
            switch (filterParam) {
              case "pending":
                query = query.eq("status", "pending");
                break;
              case "completed":
                query = query.eq("status", "completed");
                break;
              case "open":
                query = query.in("status", ["pending", "in_progress"]);
                break;
              case "mine":
                query = query
                  .eq("assigned_to", userIdParam)
                  .in("status", ["pending", "in_progress"]);
                break;
            }

            return query.order("created_at", { ascending: false });
          })(),

          // Users query
          (async () => {
            const { data: tenantUsers } = await supabase
              .from("tenant_users")
              .select("user_id, role")
              .eq("tenant_id", tenantIdParam)
              .eq("status", "active");

            if (!tenantUsers?.length) return { data: [] };

            const userIds = tenantUsers.map((tu) => tu.user_id);
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, full_name, email")
              .in("id", userIds);

            return {
              data: tenantUsers.map((tenantUser) => {
                const profile = profiles?.find(
                  (p) => p.id === tenantUser.user_id
                );
                return {
                  id: tenantUser.user_id,
                  name: profile?.full_name || profile?.email || "Unknown User",
                  role: tenantUser.role,
                  email: profile?.email,
                };
              }),
            };
          })(),
        ]);

        if (!mountedRef.current) {
          console.log("⚠️ Component unmounted, aborting");
          return;
        }

        // Process tasks
        let tasks: Task[] = [];
        if (tasksResult.status === "fulfilled" && tasksResult.value.data) {
          // Get all unique user IDs for name lookup
          const allUserIds = Array.from(
            new Set([
              ...tasksResult.value.data
                .map((task) => task.reported_by) // ✅ Use reported_by
                .filter(Boolean),
            ])
          );

          // Load user names for tasks
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
            } catch (error) {
              console.warn("Could not load user profiles for tasks:", error);
            }
          }

          // Fix the task mapping
          tasks = tasksResult.value.data.map((task) => ({
            ...task,
            assigned_user_name: task.reported_by
              ? userNames[task.reported_by] ||
                (task.reported_by === userIdParam ? "You" : "Team Member")
              : null,
            created_by_name: task.reported_by
              ? task.reported_by === userIdParam
                ? "You"
                : userNames[task.reported_by] || "Team Member"
              : "System",
          }));
        }

        // Process users
        const users =
          usersResult.status === "fulfilled" ? usersResult.value.data : [];

        // Update state
        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            tasks,
            users,
            loading: false,
            error: null,
            lastFetch: new Date().toISOString(),
          }));

          if (showRefreshFeedback) {
            toast.success("Tasks refreshed successfully");
          }

          console.log("✅ Tasks and users loaded successfully", {
            tasks: tasks.length,
            users: users.length,
          });
        }
      } catch (error) {
        console.error("❌ Error loading tasks and users:", error);
        if (mountedRef.current) {
          const errorMessage = "Failed to load tasks";
          setState((prev) => ({
            ...prev,
            loading: false,
            error: errorMessage,
          }));

          if (showRefreshFeedback) {
            toast.error(errorMessage);
          }
        }
      } finally {
        loadingRef.current = false;
        if (mountedRef.current) {
          setRefreshing(false);
        }
      }
    },
    []
  );

  // Main loading effect
  useEffect(() => {
    console.log("🔄 TasksPage useEffect triggered:", {
      isInitializing,
      userId: userId ? "present" : "missing",
      property_id: property_id ? "present" : "missing",
      tenantId: tenantId ? "present" : "missing",
      filter,
    });

    if (isInitializing) {
      console.log("⏳ Still initializing, waiting...");
      return;
    }

    if (!userId || !property_id || !tenantId) {
      console.log("❌ Missing required data:", {
        userId: !!userId,
        property_id: !!property_id,
        tenantId: !!tenantId,
      });
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    console.log("✅ All data available, loading tasks...");
    loadTasksAndUsers(userId, property_id, tenantId, filter);
  }, [
    userId,
    property_id,
    tenantId,
    filter,
    isInitializing,
    loadTasksAndUsers,
  ]);

  // Reset cache when dependencies change
  useEffect(() => {
    lastLoadParamsRef.current = "";
    loadingRef.current = false;
  }, [userId, property_id, tenantId]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    if (!refreshing && userId && property_id && tenantId) {
      lastLoadParamsRef.current = "";
      loadingRef.current = false;
      loadTasksAndUsers(userId, property_id, tenantId, filter, true);
    }
  }, [refreshing, userId, property_id, tenantId, filter, loadTasksAndUsers]);

  // Optimized refresh for modals
  const refreshTasks = useCallback(() => {
    if (userId && property_id && tenantId) {
      lastLoadParamsRef.current = "";
      loadingRef.current = false;
      loadTasksAndUsers(userId, property_id, tenantId, filter);
    }
  }, [userId, property_id, tenantId, filter, loadTasksAndUsers]);

  // Task actions
  const claimTask = useCallback(
    async (taskId: string) => {
      if (!userId) return;

      try {
        const { error } = await supabase
          .from("tasks")
          .update({
            assigned_to: userId, // ✅ Use assigned_to instead of reported_by
            status: "in_progress",
            updated_at: new Date().toISOString(),
          })
          .eq("id", taskId);

        if (error) throw error;

        toast.success("Task claimed successfully!");
        refreshTasks();
      } catch (error) {
        console.error("❌ Error claiming task:", error);
        toast.error("Failed to claim task");
      }
    },
    [userId, refreshTasks]
  );

  const completeTask = useCallback(
    async (taskId: string) => {
      try {
        const { error: updateError } = await supabase
          .from("tasks")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(), // ✅ Use completed_at
            updated_at: new Date().toISOString(),
          })
          .eq("id", taskId);

        if (updateError) throw updateError;

        toast.success("Task completed! Great job! 🎉");
        refreshTasks();
      } catch (error) {
        console.error("❌ Error completing task:", error);
        toast.error("Failed to complete task");
      }
    },
    [userId, refreshTasks]
  );

  // Modal handlers
  const editTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  }, []);

  const deleteTask = useCallback(
    (taskId: string) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return;

      // Fix: Use reported_by instead of created_by
      if (task.reported_by !== userId) {
        toast.error("You can only delete tasks you reported");
        return;
      }

      setTaskToDelete(task);
      setIsDeleteModalOpen(true);
    },
    [state.tasks, userId]
  );

  const confirmDeleteTask = useCallback(async () => {
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

      toast.success("Task deleted successfully!");
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
      refreshTasks();
    } catch (error) {
      console.error("❌ Error deleting task:", error);
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  }, [taskToDelete, refreshTasks]);

  // Memoized filtered tasks with better performance
  const filteredTasks = useMemo(() => {
    return state.tasks.filter((task) => {
      // Apply view mode filtering
      if (isGuestView) {
        return task.is_public || task.visibility === "public";
      }
      if (isFamilyView) {
        return task.visibility !== "manager-only";
      }
      return true; // Managers see all tasks
    });
  }, [state.tasks, isGuestView, isFamilyView]);

  // Memoized task filters with counts
  const taskFilters = useMemo(() => {
    const filters: TaskFilter[] = [
      { value: "open", label: "Open Tasks" },
      { value: "all", label: "All Tasks" },
      { value: "pending", label: "Pending" },
      { value: "completed", label: "Completed" },
      { value: "mine", label: "My Tasks" },
    ];

    // Add counts to filters
    return filters.map((filter) => {
      let count = 0;
      switch (filter.value) {
        case "open":
          count = filteredTasks.filter((t) => !t.is_resolved).length;
          break;
        case "completed":
          count = filteredTasks.filter((t) => t.is_resolved).length;
          break;
        case "pending":
          count = filteredTasks.filter(
            (t) => !t.is_resolved && !t.resolved_at
          ).length;
          break;
        case "mine":
          count = filteredTasks.filter(
            (t) => t.reported_by === userId && !t.is_resolved
          ).length;
          break;
        default:
          count = filteredTasks.length;
      }
      return { ...filter, count };
    });
  }, [filteredTasks, userId]);

  // Memoized task statistics
  const taskStats = useMemo(() => {
    const stats = {
      total: filteredTasks.length,
      pending: filteredTasks.filter((t) => !t.is_resolved && !t.resolved_at)
        .length,
      inProgress: filteredTasks.filter((t) => t.status === "in_progress")
        .length,
      completed: filteredTasks.filter((t) => t.is_resolved === true).length,
      // Remove overdue since due_date doesn't exist in your schema
    };
    return stats;
  }, [filteredTasks]);

  // Loading states
  if (isInitializing) {
    return (
      <StandardPageLayout breadcrumb={[{ label: "Tasks" }]}>
        <StandardCard>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600 dark:text-gray-400">
                ⏳ Initializing...
              </p>
            </div>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (!user) {
    return null;
  }

  if (!currentProperty) {
    console.log("❌ No current property available");
    return (
      <PropertyGuard fallback={<TasksNoPropertyFallback />}>
        <div>Property loading...</div>
      </PropertyGuard>
    );
  }

  console.log("✅ Current property available:", currentProperty.name);

  // Error state
  if (state.error) {
    return (
      <StandardPageLayout breadcrumb={[{ label: "Tasks" }]}>
        <StandardCard>
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Error Loading Tasks
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-4">{state.error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout breadcrumb={[{ label: "Tasks" }]}>
      <div className="space-y-6">
        {/* Task Statistics Cards */}
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
          headerActions={
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                title="Refresh tasks"
              >
                <RefreshCw
                  className={`h-3 w-3 mr-1 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                >
                  {taskFilters.map(({ value, label, count }) => (
                    <option key={value} value={value}>
                      {label} {count !== undefined ? `(${count})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {currentProperty.name} • {filteredTasks.length} tasks
              </span>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Task management buttons */}
            {hasTaskPermissions && (
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

            {/* Loading state */}
            {state.loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Loading tasks...
                </p>
              </div>
            )}

            {/* Tasks content */}
            {!state.loading && (
              <>
                {filteredTasks.length === 0 && filter === "open" ? (
                  <div className="text-center py-16">
                    <div className="relative mb-6">
                      <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full mx-auto flex items-center justify-center">
                        <CheckSquareIcon className="h-12 w-12 text-green-600" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">✨</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      All Clear! 🎉
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-2 max-w-md mx-auto">
                      No open tasks for <strong>{currentProperty.name}</strong>.
                      Everything is running smoothly!
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
                      Check back later or create a new task if something needs
                      attention.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                      {hasTaskPermissions && (
                        <button
                          onClick={() => setIsCreateModalOpen(true)}
                          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <PlusIcon className="h-5 w-5 mr-2" />
                          Create New Task
                        </button>
                      )}
                      <button
                        onClick={() => setFilter("completed")}
                        className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        View Completed Tasks
                      </button>
                      {isManagerView && (
                        <button
                          onClick={() => setFilter("all")}
                          className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          View All Tasks
                        </button>
                      )}
                    </div>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckSquareIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No Tasks Found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      {filter === "completed"
                        ? "No completed tasks found"
                        : filter === "pending"
                        ? "No pending tasks found"
                        : filter === "mine"
                        ? "No tasks assigned to you"
                        : `No tasks match the "${filter}" filter`}
                    </p>
                    <div className="flex gap-3 justify-center">
                      {isManagerView && (
                        <button
                          onClick={() => setFilter("all")}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          View All Tasks
                        </button>
                      )}
                      <button
                        onClick={() => setFilter("open")}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        View Open Tasks
                      </button>
                      {hasTaskPermissions && (
                        <button
                          onClick={() => setIsCreateModalOpen(true)}
                          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <PlusIcon className="h-5 w-5 mr-2" />
                          Create Task
                        </button>
                      )}
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
                        layout="default"
                      />
                    ))}

                    {filteredTasks.length > 0 && filteredTasks.length <= 5 && (
                      <div className="text-center py-8 border-t border-gray-200 dark:border-gray-700 mt-8">
                        <div className="flex items-center justify-center mb-3">
                          <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1 max-w-20"></div>
                          <span className="px-4 text-sm text-gray-400 dark:text-gray-500">
                            That's it!
                          </span>
                          <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1 max-w-20"></div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {filteredTasks.length === 1
                            ? "Just one task to focus on."
                            : `Only ${filteredTasks.length} tasks to manage right now.`}
                        </p>
                        {hasTaskPermissions && (
                          <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="mt-4 inline-flex items-center px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Add another task
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </StandardCard>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={refreshTasks}
        users={state.users}
        currentProperty={currentProperty}
        currentUser={user}
      />

      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
        onTaskUpdated={refreshTasks}
        users={state.users}
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
        taskTitle={taskToDelete?.title || ""} // ✅ Use title instead of description
        isDeleting={isDeleting}
      />

      {hasTaskPermissions && (
        <CreatePattern
          onClick={() => setIsCreateModalOpen(true)}
          label="Create Task"
        />
      )}
    </StandardPageLayout>
  );
}

// Custom fallback for tasks when no property is selected
function TasksNoPropertyFallback() {
  return (
    <StandardPageLayout breadcrumb={[{ label: "Tasks" }]}>
      <StandardCard>
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Property Selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
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
              className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View All Properties
            </button>
          </div>
        </div>
      </StandardCard>
    </StandardPageLayout>
  );
}
