import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth";
import { Check, Camera, Info, Loader2 } from "lucide-react";
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

  // Refs to track component mount and abort operations
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Component cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Abort any ongoing operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoized task name with fallback
  const taskName = task.name || task.task || "Unnamed Task";

  // Optimized task completion toggle
  const toggleTaskCompletion = useCallback(async () => {
    if (!user || completing) return;

    // Create abort controller for this operation
    abortControllerRef.current = new AbortController();

    try {
      setCompleting(true);

      console.log("🔄 Toggling task completion:", {
        taskId: task.visit_task_id,
        currentState: task.is_completed,
        newState: !task.is_completed,
      });

      const { error } = await supabase
        .from("cleaning_visit_tasks")
        .update({
          is_completed: !task.is_completed,
          completed_by: !task.is_completed ? user.id : null,
          completed_at: !task.is_completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.visit_task_id);

      if (error) throw error;

      if (mountedRef.current) {
        console.log("✅ Task completion updated successfully");
        toast.success(
          task.is_completed ? "Task marked as incomplete" : "Task completed! 🎉"
        );
        onUpdate();
      }
    } catch (error) {
      console.error("❌ Error updating task completion:", error);
      if (mountedRef.current) {
        toast.error("Failed to update task. Please try again.");
      }
    } finally {
      if (mountedRef.current) {
        setCompleting(false);
      }
      abortControllerRef.current = null;
    }
  }, [user, completing, task.is_completed, task.visit_task_id, onUpdate]);

  // Optimized photo upload handler
  const handlePhotoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || uploading) return;

      // Validate file size (5MB limit)
      const maxSizeMB = 5;
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`File size must be less than ${maxSizeMB}MB`);
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      // Create abort controller for this operation
      abortControllerRef.current = new AbortController();

      try {
        setUploading(true);

        console.log("📸 Starting photo upload:", {
          fileName: file.name,
          fileSize: file.size,
          taskId: task.visit_task_id,
        });

        // Generate unique filename
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const timestamp = Date.now();
        const fileName = `${visitId}-${task.id}-${timestamp}.${fileExt}`;
        const filePath = `cleaning-photos/${fileName}`;

        // Upload photo to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("cleaning-photos")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data } = supabase.storage.from("cleaning-photos").getPublicUrl(
          filePath
        );

        if (!data.publicUrl) {
          throw new Error("Failed to get public URL for uploaded photo");
        }

        // Update the task with the photo URL
        const { error: updateError } = await supabase
          .from("cleaning_visit_tasks")
          .update({
            photo_url: data.publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", task.visit_task_id);

        if (updateError) throw updateError;

        if (mountedRef.current) {
          console.log("✅ Photo uploaded and task updated successfully");
          toast.success("Photo uploaded successfully! 📸");
          onUpdate();
        }
      } catch (error) {
        console.error("❌ Error uploading photo:", error);
        if (mountedRef.current) {
          if (error instanceof Error) {
            toast.error(`Upload failed: ${error.message}`);
          } else {
            toast.error("Failed to upload photo. Please try again.");
          }
        }
      } finally {
        if (mountedRef.current) {
          setUploading(false);
        }
        abortControllerRef.current = null;

        // Clear the file input
        e.target.value = "";
      }
    },
    [uploading, visitId, task.id, task.visit_task_id, onUpdate]
  );

  // Optimized details toggle
  const toggleDetails = useCallback(() => {
    setShowDetails((prev) => !prev);
  }, []);

  // Format completion date
  const formattedCompletionDate = task.completed_at
    ? new Date(task.completed_at).toLocaleString()
    : null;

  return (
    <div className="py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {/* Completion toggle button */}
          <button
            onClick={toggleTaskCompletion}
            disabled={completing}
            className={`flex items-center justify-center h-6 w-6 rounded-full border transition-all duration-200 mr-3 ${
              task.is_completed
                ? "bg-green-500 border-green-500 hover:bg-green-600"
                : "bg-white border-gray-300 hover:border-gray-400"
            } ${completing ? "opacity-50 cursor-not-allowed" : ""}`}
            aria-label={
              task.is_completed ? "Mark as incomplete" : "Mark as complete"
            }
          >
            {completing ? (
              <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
            ) : task.is_completed ? (
              <Check className="h-4 w-4 text-white" />
            ) : null}
          </button>

          <div>
            <span
              className={`transition-colors ${
                task.is_completed
                  ? "text-gray-500 line-through"
                  : "font-medium text-gray-900"
              }`}
            >
              {taskName}
            </span>

            {task.is_completed && formattedCompletionDate && (
              <div className="text-xs text-gray-500 mt-0.5">
                Completed {formattedCompletionDate}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Details toggle button */}
          {task.description && (
            <button
              onClick={toggleDetails}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={showDetails ? "Hide details" : "Show details"}
            >
              <Info className="h-5 w-5" />
            </button>
          )}

          {/* Photo upload button */}
          <label
            className={`cursor-pointer transition-colors ${
              uploading
                ? "text-gray-400 cursor-not-allowed"
                : "text-blue-500 hover:text-blue-700"
            }`}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
            <span className="sr-only">
              {uploading ? "Uploading photo..." : "Upload photo"}
            </span>
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
        <div className="mt-3 pl-9 border-l-2 border-gray-200 animate-in slide-in-from-top-2 duration-200">
          {task.description && (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Description:
              </p>
              <p className="text-sm text-gray-600">{task.description}</p>
            </div>
          )}

          {task.photo_url && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Reference photo:
              </p>
              <div className="relative h-40 w-full max-w-xs rounded-md overflow-hidden border border-gray-200 bg-gray-50">
                <Image
                  src={task.photo_url}
                  alt={`Reference for ${taskName}`}
                  fill
                  style={{ objectFit: "cover" }}
                  className="transition-opacity duration-200"
                  onError={() => {
                    console.warn("Failed to load reference photo:", task.photo_url);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
