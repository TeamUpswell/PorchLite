"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth";
import { supabase } from "@/lib/supabase";
import PermissionGate from "@/components/PermissionGate";
import SideNavigation from "@/components/SideNavigation";
import {
  ClipboardList,
  Settings,
  Edit,
  Trash2,
  Plus,
  Check,
  X,
  MoveUp,
  MoveDown,
} from "lucide-react";
import Image from "next/image";
import { ActionButton } from "@/components/ui/Icons";

// Type definitions
interface ChecklistItem {
  id: string;
  checklist_id: string;
  description: string;
  order?: number;
  created_at?: string;
}

interface Checklist {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at?: string;
  cleaning_checklist_items: ChecklistItem[];
}

// For user with metadata
interface ExtendedUser {
  id: string;
  email?: string;
  roles: string[];
  isAdmin: boolean;
  isFamily: boolean;
  isManager: boolean;
  user_metadata?: {
    role?: string;
    [key: string]: any;
  };
}

export default function ManageChecklistsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const pathname = usePathname();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(
    null
  );
  const [newChecklist, setNewChecklist] = useState({
    name: "",
    description: "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [checklistToDelete, setChecklistToDelete] = useState<Checklist | null>(
    null
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) {
      // Cast user to ExtendedUser to access user_metadata
      const extendedUser = user as unknown as ExtendedUser;
      console.log("Current user:", extendedUser);
      console.log("User role:", extendedUser.user_metadata?.role);

      // Check if user has the required role
      if (
        extendedUser.user_metadata?.role !== "manager" &&
        extendedUser.user_metadata?.role !== "owner"
      ) {
        setError("You don't have permission to manage checklists");
      }
    }
  }, [user]);

  // Define navigation items (same as in main cleaning page)
  const cleaningNavItems = [
    { name: "Cleaning Schedule", href: "/cleaning", icon: ClipboardList },
    {
      name: "Manage Checklists",
      href: "/cleaning/checklist/manage",
      icon: Settings,
      requiredRole: "manager",
    },
  ];

  // Fetch checklists
  useEffect(() => {
    async function fetchChecklists() {
      if (!user) return;

      try {
        console.log("Fetching checklists...");
        const { data, error } = await supabase
          .from("cleaning_checklists")
          .select("*, cleaning_checklist_items(*)");

        if (error) {
          console.error("Supabase error details:", error);
          setError(`Failed to load checklists: ${error.message}`);
          return;
        }

        console.log("Checklists loaded:", data?.length || 0);
        setChecklists(data || []);
      } catch (error: unknown) {
        console.error("Error fetching checklists:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setError(`Failed to load checklists: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }

    fetchChecklists();
  }, [user]);

  // Create new checklist
  const createChecklist = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newChecklist.name.trim()) {
      setError("Checklist name is required");
      return;
    }

    if (!user) {
      setError("You must be logged in to create a checklist");
      return;
    }

    try {
      console.log("Creating checklist with data:", {
        name: newChecklist.name,
        description: newChecklist.description,
        created_by: user.id,
      });

      const { data, error } = await supabase
        .from("cleaning_checklists")
        .insert({
          id: crypto.randomUUID(),
          name: newChecklist.name,
          description: newChecklist.description,
          created_by: user.id,
          created_at: new Date().toISOString(),
        })
        .select();

      if (error) {
        console.error("Supabase error details:", error);
        setError(`Failed to create checklist: ${error.message}`);
        return;
      }

      console.log("Checklist created successfully:", data);

      // Add to state with proper typing
      const newItem: Checklist = {
        ...data[0],
        cleaning_checklist_items: [],
      };

      setChecklists([...checklists, newItem]);
      setNewChecklist({ name: "", description: "" });
      setSuccess("Checklist created successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: unknown) {
      console.error("Error creating checklist:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(`Failed to create checklist: ${errorMessage}`);
    }
  };

  // Update existing checklist
  const updateChecklist = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingChecklist) {
      setError("No checklist selected for editing");
      return;
    }

    if (!editingChecklist.name.trim()) {
      setError("Checklist name is required");
      return;
    }

    try {
      const { error } = await supabase
        .from("cleaning_checklists")
        .update({
          name: editingChecklist.name,
          description: editingChecklist.description,
        })
        .eq("id", editingChecklist.id);

      if (error) throw error;

      // Update state with properly typed data
      setChecklists(
        checklists.map((cl) =>
          cl.id === editingChecklist.id
            ? {
                ...cl,
                name: editingChecklist.name,
                description: editingChecklist.description,
              }
            : cl
        )
      );

      setEditingChecklist(null);
      setSuccess("Checklist updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: unknown) {
      console.error("Error updating checklist:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(`Failed to update checklist: ${errorMessage}`);
    }
  };

  // Delete checklist
  const deleteChecklist = async () => {
    if (!checklistToDelete) return;

    try {
      console.log("Deleting checklist:", checklistToDelete.id);

      // Delete the checklist
      const { error } = await supabase
        .from("cleaning_checklists")
        .delete()
        .eq("id", checklistToDelete.id);

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      // Update state
      setChecklists(checklists.filter((cl) => cl.id !== checklistToDelete.id));
      setChecklistToDelete(null);
      setShowDeleteModal(false);
      setSuccess("Checklist deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: unknown) {
      console.error("Error deleting checklist:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(`Failed to delete checklist: ${errorMessage}`);
    }
  };

  // Edit checklist items
  const handleEditItems = (checklist: Checklist) => {
    router.push(`/cleaning/checklist/manage/items/${checklist.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <SideNavigation user={user} />
        <div className="lg:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            <div className="p-6 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SideNavigation user={user} />
      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          <PermissionGate
            requiredRole="manager"
            fallback={
              <div className="p-6">
                You don&apos;t have permission to manage checklists.
              </div>
            }
          >
            <div className="px-4 py-8">
              <h1 className="text-2xl font-semibold mb-6">
                Cleaning Management
              </h1>

              {/* Tab-style navigation - directly in the page */}
              <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="flex -mb-px space-x-8">
                  {cleaningNavItems.map((item) => {
                    const isActive = pathname
                      ? item.href === "/cleaning"
                        ? pathname === item.href
                        : pathname.startsWith(item.href)
                      : false;
                    const IconComponent = item.icon;

                    // Wrap with PermissionGate if required role is specified
                    const linkElement = (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                          isActive
                            ? "border-blue-500 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                        }`}
                      >
                        <IconComponent
                          className={`mr-2 h-4 w-4 ${
                            isActive
                              ? "text-blue-500 dark:text-blue-400"
                              : "text-gray-400"
                          }`}
                        />
                        {item.name}
                      </Link>
                    );

                    // If item requires specific role, wrap with PermissionGate
                    if (item.requiredRole) {
                      return (
                        <PermissionGate
                          key={item.name}
                          requiredRole={item.requiredRole}
                        >
                          {linkElement}
                        </PermissionGate>
                      );
                    }

                    return linkElement;
                  })}
                </nav>
              </div>

              {/* Rest of your manage checklists content */}
              <h2 className="text-xl font-bold mb-6">
                Manage Cleaning Checklists
              </h2>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                  {success}
                </div>
              )}

              {/* Create new checklist form */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">
                  Create New Checklist
                </h2>
                <form onSubmit={createChecklist} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Checklist Name
                    </label>
                    <input
                      type="text"
                      value={newChecklist.name}
                      onChange={(e) =>
                        setNewChecklist({
                          ...newChecklist,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                      placeholder="e.g., Garage Cleaning"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={newChecklist.description}
                      onChange={(e) =>
                        setNewChecklist({
                          ...newChecklist,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                      rows={3}
                      placeholder="Brief description of this checklist"
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
                    >
                      <Plus size={18} className="mr-1" />
                      Create Checklist
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing checklists */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Existing Checklists
                </h2>

                {checklists.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">
                    No checklists created yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {checklists.map((checklist) => (
                      <div
                        key={checklist.id}
                        className="bg-white rounded-lg shadow-sm border p-6"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            {editingChecklist?.id === checklist.id ? (
                              // Edit form content...
                              <div className="space-y-4">
                                <input
                                  value={editingChecklist?.name || ""}
                                  onChange={(e) =>
                                    editingChecklist &&
                                    setEditingChecklist({
                                      ...editingChecklist,
                                      name: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                                <textarea
                                  value={editingChecklist?.description || ""}
                                  onChange={(e) =>
                                    editingChecklist &&
                                    setEditingChecklist({
                                      ...editingChecklist,
                                      description: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                                <div className="flex space-x-2">
                                  <button
                                    onClick={updateChecklist}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingChecklist(null)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <h3 className="text-lg font-semibold">
                                  {checklist.name}
                                </h3>
                                <p className="text-gray-600">
                                  {checklist.description}
                                </p>
                              </>
                            )}
                          </div>
                          {editingChecklist?.id !== checklist.id && (
                            <div className="flex space-x-2">
                              <ActionButton
                                onClick={() => setEditingChecklist(checklist)}
                                title="Edit checklist"
                                variant="edit"
                              />
                              <ActionButton
                                onClick={() => {
                                  setChecklistToDelete(checklist);
                                  setShowDeleteModal(true);
                                }}
                                title="Delete checklist"
                                variant="delete"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 text-gray-500 dark:text-gray-400 text-sm">
                <p>
                  Click &quot;View Items&quot; to manage checklist items or
                  &quot;Edit&quot; to modify checklist details.
                </p>
              </div>
            </div>
          </PermissionGate>
        </main>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Delete Checklist</h3>
            <p className="mb-6">
              Are you sure you want to delete &apos;{checklistToDelete?.name}
              &apos;? This will also delete all items in this checklist. This
              action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={deleteChecklist}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
