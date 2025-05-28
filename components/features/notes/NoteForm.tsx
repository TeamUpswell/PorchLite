"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { DocumentTextIcon, XMarkIcon } from "@heroicons/react/24/outline";

export interface Note {
  id?: string;
  title: string;
  content: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface NoteFormProps {
  note?: Note | null;
  onSave: (note: Note) => Promise<void>;
  onCancel: () => void;
}

export default function NoteForm({ note, onSave, onCancel }: NoteFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Populate form if editing existing note
  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
    } else {
      setTitle("");
      setContent("");
    }
  }, [note]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const noteData: Note = {
        title,
        content,
        user_id: user?.id,
      };

      // If editing, include the id
      if (note?.id) {
        noteData.id = note.id;
      }

      await onSave(noteData);
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {note ? "Edit Note" : "New Note"}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Note title"
              />
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700"
              >
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Write your note here..."
              ></textarea>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : note ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
