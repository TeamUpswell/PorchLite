"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { supabase } from "@/lib/supabase";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import {
  PlusIcon,
  FilterIcon,
  CheckIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  XIcon,
  CheckSquareIcon,
  EditIcon, // Add this import
} from "lucide-react";
import { toast } from "react-hot-toast";

// Updated Task type to match your database - fixed status type
type Task = {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed"; // Fixed: use in_progress instead of in-progress
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
  // Add recurring fields
  is_recurring?: boolean;
  recurrence_pattern?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | null;
  recurrence_interval?: number; // e.g., every 2 weeks, every 3 months
  parent_task_id?: string | null; // Links to the original recurring task
  next_due_date?: string | null;
  recurring_end_date?: string | null;
};

// Add to your Task type
interface TaskEdit {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  assigned_to: string | null;
  is_recurring?: boolean;
  recurrence_pattern?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | null;
  recurrence_interval?: number;
  recurring_end_date?: string | null;
}

type UserProfile = {
  id: string;
  name: string;
  role: string;
};

// Pre-defined task templates for common maintenance tasks
const taskTemplates = [
  {
    title: "HVAC Filter Replacement",
    description: "Replace HVAC filters in all units",
    category: "maintenance",
    priority: "medium",
    is_recurring: true,
    recurrence_pattern: "monthly",
    recurrence_interval: 3, // Every 3 months
  },
  {
    title: "Gutter Cleaning",
    description: "Clean and inspect gutters for debris and damage",
    category: "maintenance", 
    priority: "medium",
    is_recurring: true,
    recurrence_pattern: "quarterly",
    recurrence_interval: 1,
  },
  {
    title: "Fire Alarm Battery Check",
    description: "Test and replace fire alarm batteries as needed",
    category: "maintenance",
    priority: "high",
    is_recurring: true,
    recurrence_pattern: "monthly",
    recurrence_interval: 6, // Every 6 months
  },
  {
    title: "Deep Clean Carpets",
    description: "Professional carpet cleaning for all carpeted areas",
    category: "cleaning",
    priority: "low",
    is_recurring: true,
    recurrence_pattern: "yearly",
    recurrence_interval: 1,
  },
];

export default function TasksPage() {
  const { user } = useAuth();
  const { currentProperty } = useProperty();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    category: "maintenance",
    due_date: "",
    assigned_to: "",
    is_recurring: false,
    recurrence_pattern: "monthly" as "daily" | "weekly" | "monthly" | "quarterly" | "yearly",
    recurrence_interval: 1,
    recurring_end_date: "",
  });
  // Add edit functionality
  const [editingTask, setEditingTask] = useState<TaskEdit | null>(null);

  // Memoize property and user IDs to prevent unnecessary re-renders
  const propertyId = useMemo(() => currentProperty?.id, [currentProperty?.id]);
  const userId = useMemo(() => user?.id, [user?.id]);
  const tenantId = useMemo(() => currentProperty?.tenant_id, [currentProperty?.tenant_id]);

  // Check user's role and permissions - memoized
  const checkUserRole = useCallback(async () => {
    if (!userId || !tenantId) return;

    try {
      const { data, error } = await supabase
        .from("tenant_users")
        .select("role, status")
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .eq("status", "active")
        .single();

      if (!error && data) {
        setUserRole(data.role);
      }
    } catch (error) {
      console.error("Error checking user role:", error);
    }
  }, [userId, tenantId]);

  // Load users with proper error handling - memoized
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
        const userIds = tenantUsers.map(tu => tu.user_id);
        
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        if (profilesError) {
          console.error("❌ Error loading profiles:", profilesError);
          const fallbackUsers = tenantUsers.map((tu) => ({
            id: tu.user_id,
            name: tu.user_id === userId ? "You" : "Team Member",
            role: tu.role,
          }));
          setUsers(fallbackUsers);
          return;
        }

        const userProfiles = tenantUsers.map((tenantUser) => {
          const profile = profiles?.find(p => p.id === tenantUser.user_id);
          return {
            id: tenantUser.user_id,
            name: profile?.full_name || profile?.email || "Unknown User",
            role: tenantUser.role,
          };
        });

        setUsers(userProfiles);
      } else {
        if (user) {
          setUsers([{
            id: user.id,
            name: user.email || "Current User",
            role: "user"
          }]);
        }
      }
    } catch (error) {
      console.error("❌ Error loading users:", error);
      if (user) {
        setUsers([{
          id: user.id,
          name: user.email || "Current User",
          role: "user"
        }]);
      }
    }
  }, [tenantId, userId, user]);

  // Enhanced loadTasks with better user name resolution - memoized
  const loadTasks = useCallback(async () => {
    if (!userId || !propertyId) return;

    setLoading(true);
    
    try {
      let query = supabase
        .from("tasks")
        .select("*")
        .eq("property_id", propertyId);

      // Apply filters - use correct status values
      if (filter === "pending") {
        query = query.eq("status", "pending");
      } else if (filter === "in-progress") {
        query = query.eq("status", "in_progress"); // Fixed: underscore
      } else if (filter === "completed") {
        query = query.eq("status", "completed");
      } else if (filter === "mine") {
        query = query.eq("assigned_to", userId);
      } else if (filter === "created-by-me") {
        query = query.eq("created_by", userId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const allUserIds = Array.from(new Set([
          ...data.map(task => task.assigned_to).filter(Boolean),
          ...data.map(task => task.created_by).filter(Boolean)
        ]));

        let userNames: Record<string, string> = {};
        
        if (allUserIds.length > 0) {
          try {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, full_name, email")
              .in("id", allUserIds);

            if (profiles) {
              profiles.forEach(profile => {
                userNames[profile.id] = profile.full_name || profile.email || "Unknown User";
              });
            }
          } catch (profileError) {
            console.warn("Could not load user profiles:", profileError);
          }
        }

        const tasksWithNames = data.map((task) => ({
          ...task,
          assigned_user_name: task.assigned_to 
            ? (userNames[task.assigned_to] || (task.assigned_to === userId ? "You" : "Team Member"))
            : null,
          created_by_name: task.created_by === userId 
            ? "You" 
            : (userNames[task.created_by] || "Team Member"),
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

  // Load data with proper dependency control - only run when necessary
  useEffect(() => {
    if (propertyId && userId) {
      loadTasks();
      loadUsers();
      checkUserRole();
    }
  }, [propertyId, userId, filter]); // Only depend on stable IDs

  // Claim task with proper status value
  const claimTask = async (taskId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          assigned_to: userId,
          status: "in_progress", // Fixed: underscore
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

  // Complete task
  const completeTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Mark current task as completed
      const { error: updateError } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      if (updateError) throw updateError;

      // If it's a recurring task, create the next instance
      if (task.is_recurring && task.recurrence_pattern && task.due_date) {
        const nextDueDate = calculateNextDueDate(
          task.due_date, 
          task.recurrence_pattern, 
          task.recurrence_interval || 1
        );

        // Check if we should create next instance (before end date if set)
        const shouldCreateNext = !task.recurring_end_date || 
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
            parent_task_id: task.parent_task_id || task.id, // Link to original task
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
            toast.success("Task completed! Next occurrence created automatically 🔄");
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

  // Create task with proper status handling
  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentProperty || !user) return;

    try {
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        category: newTask.category,
        due_date: newTask.due_date || null,
        assigned_to: newTask.assigned_to || null,
        status: newTask.assigned_to ? "in_progress" : "pending", // Fixed: underscore
        created_by: user.id,
        property_id: currentProperty.id,
        tenant_id: currentProperty.tenant_id,
        is_recurring: newTask.is_recurring,
        recurrence_pattern: newTask.is_recurring ? newTask.recurrence_pattern : null,
        recurrence_interval: newTask.is_recurring ? newTask.recurrence_interval : null,
        recurring_end_date: newTask.is_recurring && newTask.recurring_end_date ? newTask.recurring_end_date : null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("tasks")
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;

      await loadTasks();
      setIsCreateModalOpen(false);
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

      toast.success(newTask.is_recurring ? "Recurring task created successfully!" : "Task created successfully!");
    } catch (err) {
      console.error("Error creating task:", err);
      toast.error("Failed to create task");
    }
  };

  // Add comments system
  const addTaskComment = async (taskId: string, comment: string) => {
    const { error } = await supabase
      .from("task_comments")
      .insert({
        task_id: taskId,
        user_id: user.id,
        comment,
        created_at: new Date().toISOString()
      });
    // Handle response
  };

  // Add file upload for task attachments
  const uploadTaskAttachment = async (taskId: string, file: File) => {
    const { data, error } = await supabase.storage
      .from('task-attachments')
      .upload(`${taskId}/${file.name}`, file);
    // Handle response
  };

  // Get status icon with proper status handling
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <ClockIcon className="h-4 w-4" />;
      case "in_progress": // Fixed: underscore
        return <PlayCircleIcon className="h-4 w-4" />;
      case "completed":
        return <CheckCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
        date.setDate(date.getDate() + (interval * 7));
        break;
      case "monthly":
        date.setMonth(date.getMonth() + interval);
        break;
      case "quarterly":
        date.setMonth(date.getMonth() + (interval * 3));
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Property Selected</h3>
            <p className="text-gray-500">Please select a property to view its tasks.</p>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  // Edit task function
  const editTask = async (taskId: string, updatedTask: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          ...updatedTask,
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      if (error) throw error;

      await loadTasks();
      setEditingTask(null);
      toast.success("Task updated successfully!");
    } catch (err) {
      console.error("Error updating task:", err);
      toast.error("Failed to update task");
    }
  };

  // Handle the edit form submission
  const handleEditTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTask) return;

    await editTask(editingTask.id, {
      title: editingTask.title,
      description: editingTask.description,
      priority: editingTask.priority,
      due_date: editingTask.due_date,
      assigned_to: editingTask.assigned_to,
      status: editingTask.assigned_to ? "in_progress" : "pending",
    });
  };

  return (
    <StandardPageLayout
      title={`${currentProperty.name} - Tasks`}
      headerIcon={<CheckSquareIcon className="h-6 w-6 text-blue-600" />}
      action={
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm sm:text-base"
        >
          <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">Create</span>
          <span className="xs:hidden">+</span>
        </button>
      }
    >
      {/* Add a floating action button for mobile - additional option */}
      <div className="fixed bottom-6 right-6 sm:hidden z-40">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
          aria-label="Create new task"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Filter dropdown */}
      <div className="mb-6">
        <label htmlFor="task-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Filter Tasks
        </label>
        <select
          id="task-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full sm:w-auto border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Tasks</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="mine">My Tasks</option>
          <option value="created-by-me">Created by Me</option>
        </select>
      </div>

      {/* Task cards */}
      {tasks.length === 0 ? (
        <StandardCard>
          <div className="text-center py-12">
            <CheckSquareIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Tasks Found</h3>
            <p className="text-gray-500 mb-6">
              {filter === "all" 
                ? "Get started by creating your first task"
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
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <StandardCard key={task.id}>
              <div className="p-3 sm:p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-base sm:text-lg text-gray-900 pr-2 leading-tight">
                    {task.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                  {task.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      task.status === "pending"
                        ? "bg-orange-100 text-orange-800"
                        : task.status === "in_progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {getStatusIcon(task.status)}
                      <span className="hidden sm:inline">
                        {task.status === "in_progress" ? "in progress" : task.status}
                      </span>
                    </div>
                  </div>

                  {task.assigned_user_name && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Assigned:</span>
                      <span className="text-gray-700 text-right truncate max-w-32">
                        {task.assigned_user_name}
                      </span>
                    </div>
                  )}

                  {task.due_date && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Due:</span>
                      <span className="text-gray-700 text-right">
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {task.category && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Category:</span>
                      <span className="text-gray-700 text-right capitalize">
                        {task.category}
                      </span>
                    </div>
                  )}

                  {task.is_recurring && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Recurring:</span>
                      <span className="text-blue-700 text-right capitalize flex items-center gap-1">
                        🔄 Every {task.recurrence_interval || 1} {task.recurrence_pattern}
                        {(task.recurrence_interval || 1) > 1 && task.recurrence_pattern !== "quarterly" ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {task.status === "pending" && (
                    <button
                      onClick={() => claimTask(task.id)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Claim
                    </button>
                  )}

                  {/* Add Edit button - only show for task creator or assigned user */}
                  {(task.created_by === userId || task.assigned_to === userId) && task.status !== "completed" && (
                    <button
                      onClick={() => setEditingTask({
                        id: task.id,
                        title: task.title,
                        description: task.description,
                        priority: task.priority,
                        due_date: task.due_date,
                        assigned_to: task.assigned_to,
                      })}
                      className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <EditIcon className="h-3 w-3" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                  )}

                  {task.status !== "completed" && task.assigned_to === userId && (
                    <button
                      onClick={() => completeTask(task.id)}
                      className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <CheckIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Complete</span>
                    </button>
                  )}
                </div>

                <div className="border-t border-gray-100 mt-3 pt-3">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span className="truncate max-w-24">
                      {task.created_by_name || 'Unknown'}
                    </span>
                    <span>{new Date(task.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </StandardCard>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
            {/* Mobile-friendly header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Create New Task</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  aria-label="Close modal"
                >
                  <XIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto px-4 sm:px-6 pb-6">
              <form onSubmit={handleCreateTask} className="space-y-4 sm:space-y-6 pt-4">
                <div>
                  <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title *
                  </label>
                  <input
                    id="task-title"
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="What needs to be done?"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="task-description"
                    className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none"
                    rows={3}
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Provide details about the task..."
                    required
                  />
                </div>

                {/* Mobile-stacked grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      id="task-priority"
                      className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as "low" | "medium" | "high" })}
                    >
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🔴 High</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="task-category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      id="task-category"
                      className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      value={newTask.category}
                      onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
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
                    <label htmlFor="task-due-date" className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                    <input
                      id="task-due-date"
                      type="date"
                      className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="task-assigned-to" className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to
                  </label>
                  <select
                    id="task-assigned-to"
                    className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={newTask.assigned_to}
                    onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                  >
                    <option value="">👥 Unassigned (anyone can claim)</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        👤 {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Task Templates - Mobile Friendly */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Templates
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {taskTemplates.slice(0, 4).map((template, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setNewTask({
                          ...newTask,
                          title: template.title,
                          description: template.description,
                          category: template.category,
                          priority: template.priority as "low" | "medium" | "high",
                          is_recurring: template.is_recurring,
                          recurrence_pattern: template.recurrence_pattern as any,
                          recurrence_interval: template.recurrence_interval,
                        })}
                        className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900">{template.title}</div>
                        <div className="text-xs text-gray-500 mt-1 truncate">{template.description}</div>
                        {template.is_recurring && (
                          <div className="text-xs text-blue-600 mt-1">🔄 Recurring</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recurring Task Options - Collapsible for mobile */}
                <div>
                  <div className="flex items-center mb-3">
                    <input
                      id="task-recurring"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={newTask.is_recurring}
                      onChange={(e) => setNewTask({ ...newTask, is_recurring: e.target.checked })}
                    />
                    <label htmlFor="task-recurring" className="ml-2 block text-sm font-medium text-gray-700">
                      🔄 Make this a recurring task
                    </label>
                  </div>

                  {newTask.is_recurring && (
                    <div className="pl-6 space-y-4 border-l-2 border-blue-100 bg-blue-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="task-recurrence-pattern" className="block text-sm font-medium text-gray-700 mb-2">
                            Repeat Every
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="1"
                              max="12"
                              className="w-16 sm:w-20 border border-gray-300 rounded-lg px-2 sm:px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                              value={newTask.recurrence_interval}
                              onChange={(e) => setNewTask({ ...newTask, recurrence_interval: parseInt(e.target.value) || 1 })}
                            />
                            <select
                              id="task-recurrence-pattern"
                              className="flex-1 border border-gray-300 rounded-lg px-2 sm:px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                              value={newTask.recurrence_pattern}
                              onChange={(e) => setNewTask({ ...newTask, recurrence_pattern: e.target.value as any })}
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
                          <label htmlFor="task-recurring-end" className="block text-sm font-medium text-gray-700 mb-2">
                            End Date (Optional)
                          </label>
                          <input
                            id="task-recurring-end"
                            type="date"
                            className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                            value={newTask.recurring_end_date}
                            onChange={(e) => setNewTask({ ...newTask, recurring_end_date: e.target.value })}
                            min={newTask.due_date || new Date().toISOString().split("T")[0]}
                          />
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm text-gray-700">
                          <strong>📅 Preview:</strong> {newTask.due_date ? (
                            <>
                              First due: {new Date(newTask.due_date).toLocaleDateString()}, then every{" "}
                              {newTask.recurrence_interval > 1 ? `${newTask.recurrence_interval} ` : ""}
                              {newTask.recurrence_pattern.replace("ly", "").replace("quarter", "quarter")}
                              {newTask.recurrence_interval > 1 && newTask.recurrence_pattern !== "quarterly" ? "s" : ""}
                              {newTask.recurring_end_date && ` until ${new Date(newTask.recurring_end_date).toLocaleDateString()}`}
                            </>
                          ) : (
                            "Set a due date to see preview"
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile-friendly buttons */}
                <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button
                    type="button"
                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors order-2 sm:order-1"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors order-1 sm:order-2"
                  >
                    ✨ Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Edit Task</h3>
                <button
                  onClick={() => setEditingTask(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleEditTask} className="space-y-6">
                <div>
                  <label htmlFor="edit-task-title" className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title
                  </label>
                  <input
                    id="edit-task-title"
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    placeholder="What needs to be done?"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-task-description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="edit-task-description"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    value={editingTask.description}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                    placeholder="Provide details about the task..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-task-priority" className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      id="edit-task-priority"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editingTask.priority}
                      onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as "low" | "medium" | "high" })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="edit-task-due-date" className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date (Optional)
                    </label>
                    <input
                      id="edit-task-due-date"
                      type="date"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editingTask.due_date || ""}
                      onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value || null })}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="edit-task-assigned-to" className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to (Optional)
                  </label>
                  <select
                    id="edit-task-assigned-to"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingTask.assigned_to || ""}
                    onChange={(e) => setEditingTask({ ...editingTask, assigned_to: e.target.value || null })}
                  >
                    <option value="">Unassigned (anyone can claim)</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                    onClick={() => setEditingTask(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    Update Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </StandardPageLayout>
  );
}
