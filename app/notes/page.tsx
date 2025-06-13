"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import { supabase } from "@/lib/supabase";
import { PlusIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

// Add this hook to any component with loading states
function useLoadingTimeout(initialLoading = false, timeoutMs = 10000) {
  const [loading, setLoading] = useState(initialLoading);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (loading) {
      timeoutId = setTimeout(() => {
        setTimedOut(true);
      }, timeoutMs);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, timeoutMs]);

  return {
    loading,
    setLoading,
    timedOut,
    setTimedOut, // Add this line to expose the setTimedOut function
  };
}

interface Note {
  id: string;
  title: string;
  content: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string | null;
}

export default function NotesPage() {
  const { user, loading } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [error, setError] = useState("");

  const { loading: loadingNotes, setLoading, timedOut, setTimedOut } =
    useLoadingTimeout(true, 8000);

  // Wrap fetchNotes with useCallback
  const fetchNotes = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, setNotes]);

  // Update the useEffect to include fetchNotes in dependency array
  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user, fetchNotes]);

  const handleAddNote = async () => {
    if (!user) return;
    if (!newNote.title.trim()) {
      alert("Please provide a title for your note");
      return;
    }

    try {
      const { error } = await supabase.from("notes").insert([
        {
          title: newNote.title,
          content: newNote.content,
          user_id: user.id,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setNewNote({ title: "", content: "" });
      setIsAddingNote(false);
      fetchNotes();
    } catch (error) {
      console.error("Error adding note:", error);
      alert("Failed to add note. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Auth will redirect
  }

  return (
    <div className="p-6">
      <Header title="Notes" />
      <PageContainer>
        <div className="space-y-6">
          <StandardCard
            title="Property Notes"
            subtitle="Property notes and documentation"
          >
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Notes</h1>
                <button
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  onClick={() => setIsAddingNote(true)}
                  aria-label="Add new note"
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Add Note
                </button>
              </div>

              {loadingNotes && !timedOut ? (
                <div>Loading...</div>
              ) : timedOut ? (
                <div className="text-center p-8">
                  <p className="text-red-500">Loading timed out</p>
                  <p className="text-gray-600 mt-1">
                    There might be an issue connecting to the database.
                  </p>
                  <button
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
                    onClick={() => {
                      setTimedOut(false);
                      setLoading(true);
                      fetchNotes();
                    }}
                  >
                    Retry
                  </button>
                  <button
                    className="mt-4 ml-2 px-4 py-2 border border-gray-300 rounded-md"
                    onClick={() => (window.location.href = "/admin/diagnostics")}
                  >
                    Run Diagnostics
                  </button>
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                  <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="mt-4 text-gray-600">No notes found</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-white p-4 rounded-lg border border-gray-200"
                    >
                      <h3 className="font-medium text-lg mb-2">{note.title}</h3>
                      <p className="text-gray-600">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </StandardCard>
        </div>
      </PageContainer>
    </div>
  );
}
