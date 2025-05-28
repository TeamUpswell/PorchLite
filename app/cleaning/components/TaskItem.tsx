import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { Check, Camera, Info } from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";

interface TaskItemProps {
  task: {
    id: string;
    name?: string; // Make optional for backward compatibility
    task?: string; // Add this for backward compatibility
    description?: string;
    photo_url?: string;
    is_completed: boolean;
    completed_at?: string;
    completed_by?: string;
    visit_task_id: string;
  };
  onUpdate: () => void;
  visitId: string;
}

export default function TaskItem({ task, onUpdate, visitId }: TaskItemProps) {
  const { user } = useAuth();
  const [completing, setCompleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Use name if available, otherwise fall back to task
  const taskName = task.name || task.task || "Unnamed Task";

  const toggleTaskCompletion = async () => {
    if (!user) return;

    try {
      setCompleting(true);

      const { error } = await supabase
        .from("cleaning_visit_tasks")
        .update({
          is_completed: !task.is_completed,
          completed_by: !task.is_completed ? user.id : null,
          completed_at: !task.is_completed ? new Date().toISOString() : null,
        })
        .eq("id", task.visit_task_id);

      if (error) throw error;

      toast.success(
        task.is_completed ? "Task marked as incomplete" : "Task completed!"
      );
      onUpdate();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    } finally {
      setCompleting(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // Upload photo to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${visitId}-${task.id}-${Date.now()}.${fileExt}`;
      const filePath = `cleaning-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("cleaning-photos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data } = supabase.storage
        .from("cleaning-photos")
        .getPublicUrl(filePath);

      // Update the task with the photo URL
      const { error: updateError } = await supabase
        .from("cleaning_visit_tasks")
        .update({ photo_url: data.publicUrl })
        .eq("id", task.visit_task_id);

      if (updateError) throw updateError;

      toast.success("Photo uploaded successfully");
      onUpdate();
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={toggleTaskCompletion}
            disabled={completing}
            className={`flex items-center justify-center h-6 w-6 rounded-full border ${
              task.is_completed
                ? "bg-green-500 border-green-500"
                : "bg-white border-gray-300"
            } transition-colors mr-3`}
            aria-label={
              task.is_completed ? "Mark as incomplete" : "Mark as complete"
            }
          >
            {task.is_completed && <Check className="h-4 w-4 text-white" />}
            {completing && (
              <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
            )}
          </button>

          <div>
            <span
              className={task.is_completed ? "text-gray-500" : "font-medium"}
            >
              {taskName}
            </span>

            {task.is_completed && task.completed_at && (
              <div className="text-xs text-gray-500 mt-0.5">
                Completed {new Date(task.completed_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center">
          {task.description && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-gray-500 hover:text-gray-700 mr-3"
            >
              <Info className="h-5 w-5" />
            </button>
          )}

          <label className="cursor-pointer text-blue-500 hover:text-blue-700">
            <Camera className="h-5 w-5" />
            <span className="sr-only">Upload photo</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Task details section */}
      {showDetails && (
        <div className="mt-3 pl-9 border-l-2 border-gray-200">
          {task.description && (
            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
          )}

          {task.photo_url && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">Reference photo:</p>
              <div className="relative h-40 w-full max-w-xs rounded-md overflow-hidden">
                <Image
                  src={task.photo_url}
                  alt={`Reference for ${taskName}`}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
