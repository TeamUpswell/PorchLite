"use client";

import { useState } from "react";
import {
  UserIcon,
  UserPlusIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";

export interface Task {
  id?: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  due_date?: string;
  priority: "low" | "medium" | "high";
  assigned_to?: string;
  user_id?: string;
  created_at?: string;
}

interface TaskBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: Task["status"]) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => Promise<void>;
  onClaim: (taskId: string) => void;
  onUnclaim: (taskId: string) => void;
  currentUserId: string;
}

export default function TaskBoard({
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
  onClaim,
  onUnclaim,
  currentUserId,
}: TaskBoardProps) {
  // Group tasks by status
  const todoTasks = tasks.filter((task) => task.status === "todo");
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress");
  const doneTasks = tasks.filter((task) => task.status === "done");

  const renderTask = (task: Task) => {
    const isAssigned = !!task.assigned_to;
    const isAssignedToCurrentUser = task.assigned_to === currentUserId;

    return (
      <div
        key={task.id}
        className={`bg-white p-4 mb-2 rounded-lg shadow border-l-4 ${
          task.priority === "high"
            ? "border-red-500"
            : task.priority === "medium"
            ? "border-yellow-500"
            : "border-green-500"
        }`}
      >
        <div className="flex justify-between items-start">
          <h3 className="font-medium">{task.title}</h3>
          <div className="flex space-x-1">
            {/* Task assignment indicator */}
            <div
              className={`px-2 py-1 rounded text-xs flex items-center ${
                isAssigned
                  ? isAssignedToCurrentUser
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                  : "bg-gray-50 text-gray-500"
              }`}
            >
              <UserIcon className="h-3 w-3 mr-1" />
              {isAssigned
                ? isAssignedToCurrentUser
                  ? "You"
                  : "Assigned"
                : "Unassigned"}
            </div>

            {/* Claim/Unclaim button */}
            {isAssignedToCurrentUser ? (
              <button
                onClick={() => onUnclaim(task.id!)}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded flex items-center"
                title="Release this task"
              >
                <UserMinusIcon className="h-3 w-3 mr-1" />
                Release
              </button>
            ) : (
              !isAssigned && (
                <button
                  onClick={() => onClaim(task.id!)}
                  className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded flex items-center"
                  title="Claim this task"
                >
                  <UserPlusIcon className="h-3 w-3 mr-1" />
                  Claim
                </button>
              )
            )}
          </div>
        </div>

        {task.description && (
          <p className="text-sm text-gray-600 mt-2">{task.description}</p>
        )}

        {task.due_date && (
          <div className="text-xs text-gray-500 mt-3">
            Due: {new Date(task.due_date).toLocaleDateString()}
          </div>
        )}

        <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={() => onEdit(task)}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(task.id!)}
            className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  // Allow drag and drop functionality (optional enhancement)
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = (e: React.DragEvent, newStatus: Task["status"]) => {
    const taskId = e.dataTransfer.getData("taskId");
    onStatusChange(taskId, newStatus);
  };

  const allowDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        className="bg-gray-50 p-4 rounded-lg"
        onDrop={(e) => handleDrop(e, "todo")}
        onDragOver={allowDrop}
      >
        <h2 className="font-semibold mb-4 text-gray-700 flex items-center justify-between">
          <span>To Do</span>
          <span className="bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs">
            {todoTasks.length}
          </span>
        </h2>
        {todoTasks.map(renderTask)}
      </div>

      <div
        className="bg-gray-50 p-4 rounded-lg"
        onDrop={(e) => handleDrop(e, "in_progress")}
        onDragOver={allowDrop}
      >
        <h2 className="font-semibold mb-4 text-gray-700 flex items-center justify-between">
          <span>In Progress</span>
          <span className="bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs">
            {inProgressTasks.length}
          </span>
        </h2>
        {inProgressTasks.map(renderTask)}
      </div>

      <div
        className="bg-gray-50 p-4 rounded-lg"
        onDrop={(e) => handleDrop(e, "done")}
        onDragOver={allowDrop}
      >
        <h2 className="font-semibold mb-4 text-gray-700 flex items-center justify-between">
          <span>Done</span>
          <span className="bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs">
            {doneTasks.length}
          </span>
        </h2>
        {doneTasks.map(renderTask)}
      </div>
    </div>
  );
}
