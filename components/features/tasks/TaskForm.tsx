"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import styles from "/components/features/tasks/TaskForm.module.css"; // Updated import path

// Update the interface to allow null values for description
interface TaskData {
  title: string;
  description: string | null; // Changed from just string
  status: string;
  priority: string;
  due_date: string | null;
}

interface TaskFormProps {
  task: TaskData | null;
  onSave: (data: TaskData) => void;
  onCancel: () => void;
}

export default function TaskForm({ task, onSave, onCancel }: TaskFormProps) {
  const [formData, setFormData] = useState<TaskData>({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    due_date: null,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "todo",
        priority: task.priority || "medium",
        due_date: task.due_date
          ? new Date(task.due_date).toISOString().split("T")[0]
          : null,
      });
    }
  }, [task]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Format data before sending
    const formattedData = {
      ...formData,
      // Convert empty strings to null for optional fields
      description: formData.description || null,
      due_date: formData.due_date || null,
    };

    onSave(formattedData);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            {task ? "Edit Task" : "Add New Task"}
          </h3>
          <button
            onClick={onCancel}
            className={styles.closeButton}
            aria-label="Close form"
            title="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Title */}
          <div className={styles.formGroup}>
            <label
              htmlFor="title"
              className={styles.label}
            >
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>

          {/* Description */}
          <div className={styles.formGroup}>
            <label
              htmlFor="description"
              className={styles.label}
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ""} // Add the "or empty string" fallback
              onChange={handleChange}
              rows={3}
              className={styles.textarea}
            />
          </div>

          {/* Status */}
          <div className={styles.formGroup}>
            <label
              htmlFor="status"
              className={styles.label}
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Due Date */}
          <div className={styles.formGroup}>
            <label
              htmlFor="due_date"
              className={styles.label}
            >
              Due Date
            </label>
            <input
              type="date"
              id="due_date"
              name="due_date"
              value={formData.due_date || ""}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          {/* Priority */}
          <div className={styles.formGroup}>
            <label
              htmlFor="priority"
              className={styles.label}
            >
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className={styles.actionBar}>
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
            >
              {task ? "Update Task" : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
