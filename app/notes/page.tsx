"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import { supabase } from "@/lib/supabase";
import {
  PlusIcon,
  DocumentTextIcon,
  XMarkIcon,
  AlertTriangle,
  Calendar,
  User,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

interface Note {
  id: string;
  title: string;
  content: string;
  user_id: string;
  property_id: string;
  created_at: string;
  updated_at: string | null;
}

interface FormData {
  title: string;
  content: string;
}

export default function NotesPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: "",
    content: "",
  });

  // Refs for optimization
  const mountedRef = useRef(true);
  const savingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  // Component cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Memoized loading state
  const isInitializing = useMemo(() => {
    return authLoading || propertyLoading;
  }, [authLoading, propertyLoading]);

  // Fetch notes function
  const fetchNotes = useCallback(async () => {
    if (!user?.id || !currentProperty?.id || !mountedRef.current) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("📝 Fetching notes for property:", currentProperty.id);

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .eq("property_id", currentProperty.id)
        .order("created_at", { ascending: false });

      if (!mountedRef.current) {
        console.log("⚠️ Component unmounted, aborting");
        return;
      }

      if (error) {
        console.error("❌ Error fetching notes:", error);
        setError("Failed to load notes");
        toast.error("Failed to load notes");
      } else {
        console.log("✅ Notes loaded:", data?.length || 0);
        setNotes(data || []);
      }
    } catch (error) {
      console.error("❌ Unexpected error fetching notes:", error);
      if (mountedRef.current) {
        setError("Failed to load notes");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user?.id, currentProperty?.id]);

  // Main loading effect
  useEffect(() => {
    if (isInitializing) {
      return;
    }

    if (!user?.id) {
      console.log("⏳ Waiting for user...");
      if (mountedRef.current) {
        setLoading(false);
        hasLoadedRef.current = true;
      }
      return;
    }

    if (!currentProperty?.id) {
      console.log("⏳ Waiting for property...");
      if (mountedRef.current) {
        setLoading(false);
        setError("No property selected");
        hasLoadedRef.current = true;
      }
      return;
    }

    if (!hasLoadedRef.current) {
      console.log("🔄 Loading notes for the first time");
      hasLoadedRef.current = true;
      fetchNotes();
    }
  }, [user?.id, currentProperty?.id, isInitializing, fetchNotes]);

  // Memoized form handlers
  const handleFormChange = useCallback(
    (field: keyof FormData) => {
      return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!mountedRef.current) return;

        setFormData((prev) => ({ ...prev, [field]: e.target.value }));

        // Clear error when user starts typing
        if (error) {
          setError(null);
        }
      };
    },
    [error]
  );

  // Form validation
  const isFormValid = useMemo(() => {
    return (
      formData.title.trim().length > 0 && formData.content.trim().length > 0
    );
  }, [formData.title, formData.content]);

  // Add note handler
  const handleAddNote = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      // Prevent duplicate saves
      if (savingRef.current || saving || !mountedRef.current || !isFormValid) {
        return;
      }

      if (!user?.id || !currentProperty?.id) {
        setError("Missing user or property information");
        return;
      }

      savingRef.current = true;
      setSaving(true);
      setError(null);

      try {
        console.log("💾 Adding new note...");

        const { error } = await supabase.from("notes").insert([
          {
            title: formData.title.trim(),
            content: formData.content.trim(),
            user_id: user.id,
            property_id: currentProperty.id,
          },
        ]);

        if (!mountedRef.current) {
          console.log("⚠️ Component unmounted, aborting");
          return;
        }

        if (error) {
          console.error("❌ Error adding note:", error);
          setError(error.message || "Failed to add note");
          toast.error("Failed to add note");
        } else {
          console.log("✅ Note added successfully");
          toast.success("Note added successfully!");

          // Reset form and close modal
          setFormData({ title: "", content: "" });
          setIsAddingNote(false);

          // Refresh notes
          fetchNotes();
        }
      } catch (error) {
        console.error("❌ Unexpected error adding note:", error);
        if (mountedRef.current) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to add note";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (mountedRef.current) {
          setSaving(false);
        }
        savingRef.current = false;
      }
    },
    [formData, user?.id, currentProperty?.id, saving, isFormValid, fetchNotes]
  );

  // Cancel modal handler
  const handleCancelModal = useCallback(() => {
    if (saving) return; // Don't allow cancel while saving

    setFormData({ title: "", content: "" });
    setIsAddingNote(false);
    setError(null);
  }, [saving]);

  // Retry function
  const retryLoad = useCallback(() => {
    if (user?.id && currentProperty?.id) {
      hasLoadedRef.current = false;
      setError(null);
      fetchNotes();
    }
  }, [user?.id, currentProperty?.id, fetchNotes]);

  // Loading state
  if (isInitializing || loading) {
    return (
      <div className="p-6">
        <Header title="Notes" />
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-600">
                  {isInitializing
                    ? "⏳ Initializing..."
                    : "📝 Loading notes..."}
                </p>
              </div>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  if (!user) {
    return null; // Auth will redirect
  }

  // Error state
  if (error && !currentProperty) {
    return (
      <div className="p-6">
        <Header title="Notes" />
        <PageContainer>
          <StandardCard
            title="No Property Selected"
            subtitle="Please select a property to view notes"
          >
            <div className="text-center py-8">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-600 dark:text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Property Selected
              </h3>
              <p className="text-gray-600 mb-4">
                Notes are organized by property. Please select a property to
                continue.
              </p>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Header title="Notes" />
      <PageContainer>
        <div className="space-y-6">
          <StandardCard
            title="Property Notes"
            subtitle={`Notes and documentation for ${
              currentProperty?.name || "current property"
            }`}
            headerActions={
              <button
                onClick={() => setIsAddingNote(true)}
                disabled={!currentProperty}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Add new note"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Note
              </button>
            }
          >
            <div className="space-y-6">
              {error && currentProperty ? (
                <div className="text-center py-8">
                  <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Error Loading Notes
                  </h3>
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={retryLoad}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                  <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-600 dark:text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No notes found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create your first note to get started documenting important
                    information.
                  </p>
                  <button
                    onClick={() => setIsAddingNote(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add First Note
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-white p-6 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <h3 className="font-semibold text-lg mb-3 text-gray-900 line-clamp-2">
                        {note.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {note.content}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(note.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </div>
                        {note.updated_at &&
                          note.updated_at !== note.created_at && (
                            <span className="text-blue-600">Updated</span>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </StandardCard>
        </div>
      </PageContainer>

      {/* Add Note Modal */}
      {isAddingNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Add New Note
              </h2>
              <button
                onClick={handleCancelModal}
                disabled={saving}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-600 disabled:opacity-50"
                aria-label="Close modal"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddNote} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={handleFormChange("title")}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  placeholder="Enter note title..."
                  maxLength={100}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.title.length}/100 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={handleFormChange("content")}
                  disabled={saving}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  placeholder="Write your note content..."
                  maxLength={5000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.content.length}/5000 characters
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancelModal}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !isFormValid}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Note
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
