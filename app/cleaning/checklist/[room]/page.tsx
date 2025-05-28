"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { supabase } from "@/lib/supabase";
import { useProperty } from "@/lib/hooks/useProperty";
import { ArrowLeft, Plus, History, Calendar } from "lucide-react";
import TaskItem from "../../components/TaskItem";
import { toast } from "react-hot-toast";

// Room icons mapping for header icons
import { Home, Utensils, Bath } from "lucide-react";
const roomIcons = {
  kitchen: Utensils,
  living_room: Home,
  master_bedroom: Home,
  guest_bedroom: Home,
  master_bathroom: Bath,
  guest_bathroom: Bath,
};

const roomNames = {
  kitchen: "Kitchen",
  living_room: "Living Room",
  master_bedroom: "Master Bedroom",
  guest_bedroom: "Guest Bedroom",
  master_bathroom: "Master Bathroom",
  guest_bathroom: "Guest Bathroom",
};

export default function RoomChecklist() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { currentProperty } = useProperty();

  const roomId = params.room as string;
  const visitId = searchParams.get("visit") as string;

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentVisit, setCurrentVisit] = useState<any>(null);

  // Handle completing all tasks at once
  const handleCompleteAll = async () => {
    try {
      if (!currentVisit) return;

      // Update all tasks for this room and visit
      const { error } = await supabase
        .from("cleaning_visit_tasks")
        .update({
          is_completed: true,
          completed_by: user?.id,
          completed_at: new Date().toISOString(),
        })
        .in(
          "id",
          tasks.map((task) => task.visit_task_id)
        );

      if (error) throw error;

      // Refresh the task list
      loadTasksForVisit();
      toast.success("All tasks marked as complete!");
    } catch (error) {
      console.error("Error completing tasks:", error);
      toast.error("Failed to complete tasks");
    }
  };

  // Create/load current visit
  const ensureActiveVisit = async () => {
    try {
      if (visitId) {
        // Load existing visit
        const { data, error } = await supabase
          .from("cleaning_visits")
          .select("*")
          .eq("id", visitId)
          .single();

        if (error) throw error;
        setCurrentVisit(data);
        return data;
      } else {
        // Create new visit
        const { data, error } = await supabase
          .from("cleaning_visits")
          .insert([
            {
              property_id: currentProperty.id,
              visit_date: new Date().toISOString().split("T")[0],
              status: "in_progress",
            },
          ])
          .select()
          .single();

        if (error) throw error;

        // Redirect to include visit ID in URL
        router.push(`/cleaning/checklist/${roomId}?visit=${data.id}`);
        setCurrentVisit(data);
        return data;
      }
    } catch (error) {
      console.error("Error ensuring active visit:", error);
      toast.error("Failed to start cleaning session");
      return null;
    }
  };

  // Load tasks for the current room and visit
  const loadTasksForVisit = async () => {
    try {
      if (!currentProperty || !currentVisit) return;

      // Get all tasks for this room
      const { data: roomTasks, error: tasksError } = await supabase
        .from("cleaning_tasks")
        .select("*")
        .eq("property_id", currentProperty.id)
        .eq("room", roomId)
        .order("display_order", { ascending: true });

      if (tasksError) throw tasksError;

      // Get status for tasks in current visit
      const { data: visitTasks, error: visitTasksError } = await supabase
        .from("cleaning_visit_tasks")
        .select("*")
        .eq("visit_id", currentVisit.id);

      if (visitTasksError) throw visitTasksError;

      // Create visit tasks for any that don't exist yet
      const existingTaskIds = visitTasks.map((vt) => vt.task_id);
      const tasksToCreate = roomTasks
        .filter((task) => !existingTaskIds.includes(task.id))
        .map((task) => ({
          visit_id: currentVisit.id,
          task_id: task.id,
          is_completed: false,
        }));

      if (tasksToCreate.length > 0) {
        const { error } = await supabase
          .from("cleaning_visit_tasks")
          .insert(tasksToCreate);

        if (error) throw error;
      }

      // Reload visit tasks to get the newly created ones
      const { data: allVisitTasks, error } = await supabase
        .from("cleaning_visit_tasks")
        .select("*")
        .eq("visit_id", currentVisit.id);

      if (error) throw error;

      // Combine task details with completion status
      const combinedTasks = roomTasks.map((task) => {
        const visitTask = allVisitTasks.find((vt) => vt.task_id === task.id);
        return {
          ...task,
          // Use name if available, otherwise use task field for backward compatibility
          name: task.name || task.task,
          is_completed: visitTask?.is_completed || false,
          completed_at: visitTask?.completed_at,
          completed_by: visitTask?.completed_by,
          visit_task_id: visitTask?.id,
        };
      });

      setTasks(combinedTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Failed to load cleaning tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // ✅ Use currentProperty instead of getMainProperty()
        if (currentProperty) {
          const visit = await ensureActiveVisit();
          if (visit) {
            await loadTasksForVisit();
          }
        }
      } catch (error) {
        console.error("Error in initial load:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [roomId, currentProperty]); // ✅ Add currentProperty to dependencies

  // Render the room icon
  const RoomIcon = roomIcons[roomId as keyof typeof roomIcons] || Home;

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link
            href="/cleaning/checklist"
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Rooms
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full mr-4">
              <RoomIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-semibold">
              {roomNames[roomId as keyof typeof roomNames] || roomId}
            </h1>
          </div>

          <div className="flex space-x-2">
            <Link
              href={`/cleaning/history${
                currentVisit ? `?visit=${currentVisit.id}` : ""
              }`}
            >
              <button className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md">
                <History className="h-4 w-4 mr-1" />
                History
              </button>
            </Link>

            <button
              onClick={handleCompleteAll}
              className="flex items-center px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md"
            >
              Complete All
            </button>
          </div>
        </div>

        {currentVisit && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              <div>
                <h3 className="font-medium">Current Cleaning Session</h3>
                <p className="text-sm text-gray-600">
                  {new Date(currentVisit.visit_date).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            {tasks.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500 mb-4">
                  No tasks defined for this room yet.
                </p>
                {(user?.roles?.includes("owner") ||
                  user?.roles?.includes("manager")) && (
                  <Link href={`/cleaning/tasks/create?room=${roomId}`}>
                    <button className="flex items-center mx-auto px-4 py-2 bg-blue-600 text-white rounded-md">
                      <Plus className="h-4 w-4 mr-2" /> Add First Task
                    </button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onUpdate={loadTasksForVisit}
                    visitId={currentVisit?.id}
                  />
                ))}
              </div>
            )}

            {tasks.length > 0 &&
              (user?.roles?.includes("owner") ||
                user?.roles?.includes("manager")) && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Link href={`/cleaning/tasks/create?room=${roomId}`}>
                    <button className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700">
                      <Plus className="h-4 w-4 mr-2" /> Add New Task
                    </button>
                  </Link>
                </div>
              )}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
