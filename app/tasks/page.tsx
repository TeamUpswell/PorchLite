"use client";

import { useState, useEffect, useCallback } from "react";
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
  CheckSquareIcon, // For header icon
} from "lucide-react";
import { toast } from "react-hot-toast";

// Updated Task type to match your database
type Task = {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed";
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
  user_id?: string; // Legacy field, keeping for compatibility
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
  });

  // Check user's role and permissions
  useEffect(() => {
    async function checkUserRole() {
      if (!user || !currentProperty) return;

      try {
        const { data, error } = await supabase
          .from("tenant_users")
          .select("role, status")
          .eq("tenant_id", currentProperty.tenant_id)
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();

        if (!error && data) {
          setUserRole(data.role);
        }
      } catch (error) {
        console.error("Error checking user role:", error);
      }
    }

    checkUserRole();
  }, [user, currentProperty]);

  // Load users for assignment
  const loadUsers = useCallback(async () => {
    if (!currentProperty) return;

    console.log("🔧 Loading users for tenant:", currentProperty.tenant_id);

    try {
      // Get tenant users with auth.users data
      const { data, error } = await supabase
        .from("tenant_users")
        .select("user_id, role")
        .eq("tenant_id", currentProperty.tenant_id)
        .eq("status", "active");

      console.log("🔧 Tenant users result:", { data, error });

      if (error) {
        console.error("❌ Error loading tenant users:", error);
        return;
      }

      if (data && data.length > 0) {
        // Get user details from auth.users for each user_id
        const userIds = data.map(item => item.user_id);
        
        const { data: authUsers, error: authError } = await supabase
          .from("auth.users")
          .select("id, email, raw_user_meta_data")
          .in("id", userIds);

        console.log("🔧 Auth users result:", { authUsers, authError });

        if (authUsers) {
          const userProfiles = data.map((item) => {
            const authUser = authUsers.find(u => u.id === item.user_id);
            return {
              id: item.user_id,
              name: authUser?.raw_user_meta_data?.full_name || authUser?.email || "Unknown User",
              role: item.role,
            };
          });
          console.log("🔧 Processed user profiles:", userProfiles);
          setUsers(userProfiles);
        }
      }
    } catch (error) {
      console.error("❌ Error loading users:", error);
    }
  }, [currentProperty]);

  // Simplified loadTasks function (no user joins for now)
  const loadTasks = useCallback(async () => {
    if (!user || !currentProperty) {
      console.log("🔧 Cannot load tasks - missing user or property");
      return;
    }

    console.log("🔧 Loading tasks for property:", currentProperty.id);
    setLoading(true);
    
    try {
      // Simplified query without user joins
      let query = supabase
        .from("tasks")
        .select(`
          id,
          title,
          description,
          status,
          priority,
          category,
          assigned_to,
          created_by,
          created_at,
          updated_at,
          due_date,
          completed_at,
          property_id,
          tenant_id,
          user_id
        `)
        .eq("property_id", currentProperty.id);

      // Apply filters
      if (filter === "pending") {
        query = query.eq("status", "pending");
      } else if (filter === "in-progress") {
        query = query.eq("status", "in-progress");
      } else if (filter === "completed") {
        query = query.eq("status", "completed");
      } else if (filter === "mine") {
        query = query.eq("assigned_to", user.id);
      } else if (filter === "created-by-me") {
        query = query.eq("created_by", user.id);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false });

      console.log("🔧 Tasks query result:", { data, error, count: data?.length });

      if (error) {
        console.error("❌ Tasks query error:", error);
        throw error;
      }

      if (data) {
        // Get user details for assigned_to and created_by
        const userIds = [...new Set([
          ...data.map(task => task.assigned_to).filter(Boolean),
          ...data.map(task => task.created_by).filter(Boolean)
        ])];

        let userMap = {};
        if (userIds.length > 0) {
          const { data: authUsers } = await supabase
            .from("auth.users")
            .select("id, email, raw_user_meta_data")
            .in("id", userIds);

          if (authUsers) {
            userMap = authUsers.reduce((acc, user) => {
              acc[user.id] = user.raw_user_meta_data?.full_name || user.email || "Unknown User";
              return acc;
            }, {});
          }
        }

        const tasksWithNames = data.map((task) => ({
          ...task,
          assigned_user_name: task.assigned_to ? userMap[task.assigned_to] : null,
          created_by_name: task.created_by ? userMap[task.created_by] : "Unknown",
        }));

        console.log("🔧 Processed tasks:", tasksWithNames);
        setTasks(tasksWithNames);
      }
    } catch (err) {
      console.error("❌ Failed to load tasks:", err);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [user, currentProperty, filter]);

  useEffect(() => {
    loadTasks();
    loadUsers();
  }, [loadTasks, loadUsers]);

  // Create a new task
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
        status: newTask.assigned_to ? "in-progress" : "pending",
        created_by: user.id,
        property_id: currentProperty.id,
        tenant_id: currentProperty.tenant_id,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("tasks")
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;

      await loadTasks(); // Reload to get user names
      setIsCreateModalOpen(false);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        category: "maintenance",
        due_date: "",
        assigned_to: "",
      });

      toast.success("Task created successfully!");
    } catch (err) {
      console.error("Error creating task:", err);
      toast.error("Failed to create task");
    }
  };

  // Claim a task
  const claimTask = async (taskId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          assigned_to: user.id,
          status: "in-progress",
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

  // Complete a task
  const completeTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      if (error) throw error;

      await loadTasks();
      toast.success("Task completed! Great job! 🎉");
    } catch (err) {
      console.error("Error completing task:", err);
      toast.error("Failed to complete task");
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <ClockIcon className="h-4 w-4" />;
      case "in-progress":
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

  return (
    <StandardPageLayout
      title={`${currentProperty.name} - Tasks`}
      headerIcon={<CheckSquareIcon className="h-6 w-6 text-blue-600" />}
      action={
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Task
        </button>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StandardCard>
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {tasks.filter((t) => t.status === "pending").length}
              </p>
            </div>
          </div>
        </StandardCard>

        <StandardCard>
          <div className="flex items-center">
            <PlayCircleIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {tasks.filter((t) => t.status === "in-progress").length}
              </p>
            </div>
          </div>
        </StandardCard>

        <StandardCard>
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {tasks.filter((t) => t.status === "completed").length}
              </p>
            </div>
          </div>
        </StandardCard>

        <StandardCard>
          <div className="flex items-center">
            <UserIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">My Tasks</p>
              <p className="text-2xl font-bold text-gray-900">
                {tasks.filter((t) => t.assigned_to === user?.id && t.status !== "completed").length}
              </p>
            </div>
          </div>
        </StandardCard>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "All Tasks" },
            { value: "pending", label: "Pending" },
            { value: "in-progress", label: "In Progress" },
            { value: "completed", label: "Completed" },
            { value: "mine", label: "My Tasks" },
            { value: "created-by-me", label: "Created by Me" },
          ].map((filterOption) => (
            <button
              key={filterOption.value}
              onClick={() => setFilter(filterOption.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === filterOption.value
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <StandardCard key={task.id}>
              <div className="p-2">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 pr-2">
                    {task.title}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {task.description}
                </p>

                {/* Metadata */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      task.status === "pending"
                        ? "bg-orange-100 text-orange-800"
                        : task.status === "in-progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {getStatusIcon(task.status)}
                      {task.status.replace("-", " ")}
                    </div>
                  </div>

                  {task.category && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Category:</span>
                      <span className="text-gray-700 capitalize">{task.category}</span>
                    </div>
                  )}

                  {task.assigned_user_name && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Assigned to:</span>
                      <span className="text-gray-700">{task.assigned_user_name}</span>
                    </div>
                  )}

                  {task.due_date && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Due:</span>
                      <span className="text-gray-700">
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {task.status === "pending" && (
                    <button
                      onClick={() => claimTask(task.id)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Claim Task
                    </button>
                  )}

                  {task.status !== "completed" && task.assigned_to === user?.id && (
                    <button
                      onClick={() => completeTask(task.id)}
                      className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <CheckIcon className="h-4 w-4" />
                      Complete
                    </button>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 mt-4 pt-3">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Created by {task.created_by_name || 'Unknown'}</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Create New Task</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-6">
                <div>
                  <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title
                  </label>
                  <input
                    id="task-title"
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="What needs to be done?"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="task-description"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Provide details about the task..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      id="task-priority"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as "low" | "medium" | "high" })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="task-category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      id="task-category"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newTask.category}
                      onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    >
                      <option value="maintenance">Maintenance</option>
                      <option value="cleaning">Cleaning</option>
                      <option value="supplies">Supplies</option>
                      <option value="repairs">Repairs</option>
                      <option value="inspection">Inspection</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="task-due-date" className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date (Optional)
                    </label>
                    <input
                      id="task-due-date"
                      type="date"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="task-assigned-to" className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to (Optional)
                  </label>
                  <select
                    id="task-assigned-to"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newTask.assigned_to}
                    onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
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
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    Create Task
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
