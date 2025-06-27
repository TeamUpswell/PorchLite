"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { canManageCleaning } from "@/lib/utils/roles";
import { supabase } from "@/lib/supabase";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import StandardCard from "@/components/ui/StandardCard";
import Button from "@/components/ui/button";
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
  Shield,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
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

export default function ManageCleaningChecklistPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);
  const [newChecklist, setNewChecklist] = useState({
    name: "",
    description: "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [checklistToDelete, setChecklistToDelete] = useState<Checklist | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Check if user has access
  const hasAccess = canManageCleaning(user);

  // Define navigation items
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
  const fetchChecklists = async (showRefreshFeedback = false) => {
    if (!user || !hasAccess) {
      setLoading(false);
      return;
    }

    try {
      if (showRefreshFeedback) {
        setRefreshing(true);
      }
      
      console.log("Fetching checklists...");
      const { data, error } = await supabase
        .from("cleaning_checklists")
        .select("*, cleaning_checklist_items(*)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error details:", error);
        setError(`Failed to load checklists: ${error.message}`);
        return;
      }

      console.log("Checklists loaded:", data?.length || 0);
      setChecklists(data || []);
      setError(""); // Clear any previous errors
    } catch (error: unknown) {
      console.error("Error fetching checklists:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(`Failed to load checklists: ${errorMessage}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchChecklists();
    }
  }, [user, hasAccess, authLoading]);

  const handleRefresh = () => {
    if (!refreshing) {
      fetchChecklists(true);
    }
  };

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

      setChecklists([newItem, ...checklists]);
      setNewChecklist({ name: "", description: "" });
      setSuccess("Checklist created successfully");
      setError("");
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
      setError("");
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
      setError("");
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

  // Loading states
  if (authLoading) {
    return (
      <StandardPageLayout title="Manage Checklists" subtitle="Loading...">
        <StandardCard>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600">⏳ Loading checklists...</p>
            </div>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  if (!user) {
    return null; // Auth will redirect
  }

  if (!hasAccess) {
    return (
      <StandardPageLayout title="Manage Checklists" subtitle="Access denied">
        <StandardCard>
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 mb-4">
              You don't have permission to manage cleaning checklists.
            </p>
            <div className="text-xs text-gray-400 bg-gray-50 rounded p-3 inline-block">
              <p>Role: {user?.user_metadata?.role || "undefined"}</p>
              <p>Required: Manager or above</p>
            </div>
          </div>
        </StandardCard>
      </StandardPageLayout>
    );
  }

  const checklistTips = [
    'Click "View Items" to manage individual checklist tasks',
    "Use descriptive names to easily identify checklists",
    "Group related tasks into separate checklists",
  ];

  return (
    <StandardPageLayout
      title="Manage Checklists"
      subtitle="Create and manage your cleaning checklists"
      breadcrumb={[
        { label: "Cleaning", href: "/cleaning" },
        { label: "Manage Checklists" }
      ]}
    >
      <div className="space-y-6">
        {/* Tab-style navigation */}
        <StandardCard>
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px space-x-8">
              {cleaningNavItems.map((item) => {
                const isActive = pathname
                  ? item.href === "/cleaning"
                    ? pathname === item.href
                    : pathname.startsWith(item.href)
                  : false;
                const IconComponent = item.icon;

                return (
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
              })}
            </nav>
          </div>
        </StandardCard>

        {/* Alert messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="ml-3 text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
              <p className="ml-3 text-sm text-green-800 dark:text-green-200">{success}</p>
            </div>
          </div>
        )}

        {/* Create new checklist form */}
        <StandardCard
          title="Create New Checklist"
          subtitle="Add a new cleaning checklist template"
        >
          <form onSubmit={createChecklist} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Checklist Name *
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="e.g., Kitchen Deep Clean, Bathroom Maintenance"
                required
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                rows={3}
                placeholder="Brief description of this checklist and when to use it"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="flex items-center"
            >
              <Plus size={18} className="mr-2" />
              Create Checklist
            </Button>
          </form>
        </StandardCard>

        {/* Existing checklists */}
        <StandardCard
          title="Your Checklists"
          subtitle={`${checklists.length} checklist${checklists.length !== 1 ? 's' : ''} available`}
          headerActions={
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
              title="Refresh checklists"
            >
              <RefreshCw
                className={`h-3 w-3 mr-1 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          }
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading checklists...</span>
            </div>
          ) : checklists.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Checklists Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Create your first cleaning checklist to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {checklists.map((checklist) => (
                <div
                  key={checklist.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {editingChecklist?.id === checklist.id ? (
                        <form
                          onSubmit={updateChecklist}
                          className="space-y-4"
                        >
                          <input
                            value={editingChecklist?.name || ""}
                            onChange={(e) =>
                              editingChecklist &&
                              setEditingChecklist({
                                ...editingChecklist,
                                name: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            placeholder="Checklist name"
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
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            placeholder="Description"
                            rows={3}
                          />
                          <div className="flex space-x-2">
                            <button
                              type="submit"
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                              <Check className="h-4 w-4 inline mr-1" />
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingChecklist(null)}
                              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                            >
                              <X className="h-4 w-4 inline mr-1" />
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center space-x-3 mb-2">
                            <ClipboardList className="h-5 w-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {checklist.name}
                            </h3>
                          </div>
                          {checklist.description && (
                            <p className="text-gray-600 dark:text-gray-400 mb-2">
                              {checklist.description}
                            </p>
                          )}
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            <span className="inline-flex items-center">
                              <ClipboardList className="h-4 w-4 mr-1" />
                              {checklist.cleaning_checklist_items?.length || 0} items
                            </span>
                            {checklist.created_at && (
                              <span className="ml-4">
                                • Created{" "}
                                {new Date(
                                  checklist.created_at
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    {editingChecklist?.id !== checklist.id && (
                      <div className="flex space-x-2 ml-4">
                        <Button
                          onClick={() => handleEditItems(checklist)}
                          variant="secondary"
                          size="sm"
                          aria-label={`View items in ${checklist.name} checklist`}
                        >
                          View Items
                        </Button>
                        <ActionButton
                          onClick={() => setEditingChecklist(checklist)}
                          title="Edit checklist"
                          aria-label={`Edit ${checklist.name} checklist`}
                          variant="edit"
                        />
                        <ActionButton
                          onClick={() => {
                            setChecklistToDelete(checklist);
                            setShowDeleteModal(true);
                          }}
                          title="Delete checklist"
                          aria-label={`Delete ${checklist.name} checklist`}
                          variant="delete"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </StandardCard>

        {/* Tips Card */}
        <StandardCard
          title="Tips & Best Practices"
          subtitle="Make the most of your cleaning checklists"
        >
          <div className="text-gray-600 dark:text-gray-400 text-sm">
            <ul className="space-y-2">
              {checklistTips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </StandardCard>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Delete Checklist
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete '{checklistToDelete?.name}'? 
              This will also delete all items in this checklist. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowDeleteModal(false)}
                variant="outline"
                aria-label="Cancel deletion"
              >
                Cancel
              </Button>
              <Button
                onClick={deleteChecklist}
                variant="destructive"
                aria-label={`Confirm delete ${checklistToDelete?.name}`}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </StandardPageLayout>
  );
}
