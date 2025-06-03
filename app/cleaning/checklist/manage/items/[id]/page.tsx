"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Plus,
  Check,
  X,
  Trash2,
  MoveUp,
  MoveDown,
  GripVertical,
  Edit,
} from "lucide-react";
import PermissionGate from "@/components/PermissionGate";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { ActionButton } from "@/components/ui/Icons";

// Define interfaces for our data structures
interface ChecklistItem {
  id: string;
  checklist_id: string;
  text: string;
  position?: number;
  created_at?: string;
}

interface Checklist {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at?: string;
}

// Props for SortableItem component
interface SortableItemProps {
  item: ChecklistItem;
  onEdit: (item: ChecklistItem) => void;
  onDelete: (item: ChecklistItem) => void;
}

// Sortable item component
function SortableItem({ item, onEdit, onDelete }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: transform ? `translateY(${transform.y}px)` : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-md mb-2"
    >
      <div className="flex items-center">
        <button
          className="cursor-grab mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          title="Drag to reorder"
        >
          <GripVertical size={18} />
        </button>
        <span>{item.text}</span>
      </div>
      <div className="flex space-x-1">
        <button
          onClick={() => onEdit(item)}
          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          aria-label="Edit item"
          title="Edit item"
        >
          <Edit size={16} />
        </button>
        <button
          onClick={() => onDelete(item)}
          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          aria-label="Delete item"
          title="Delete item"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

// Update the page component definition
interface PageParams {
  params: {
    id: string;
  };
}

export default function ChecklistItemsPage({ params }: PageParams) {
  const router = useRouter();
  const { id } = params;
  const { user } = useAuth();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newItem, setNewItem] = useState("");
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ChecklistItem | null>(null);

  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Fetch checklist and items
  useEffect(() => {
    async function fetchChecklist() {
      if (!user || !id) return;

      try {
        const { data: checklistData, error: checklistError } = await supabase
          .from("cleaning_checklists")
          .select("*")
          .eq("id", id)
          .single();

        if (checklistError) throw checklistError;

        const { data: itemsData, error: itemsError } = await supabase
          .from("cleaning_checklist_items")
          .select("*")
          .eq("checklist_id", id)
          .order("position", { ascending: true });

        if (itemsError) throw itemsError;

        setChecklist(checklistData as Checklist);
        setItems((itemsData as ChecklistItem[]) || []);
      } catch (error: unknown) {
        console.error("Error fetching checklist:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setError(`Failed to load checklist: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }

    fetchChecklist();
  }, [user, id]);

  // Add new item
  const addItem = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newItem.trim()) {
      setError("Item text is required");
      return;
    }

    try {
      // Calculate next position
      const nextPosition =
        items.length > 0
          ? Math.max(...items.map((item) => item.position || 0)) + 1
          : 1;

      const { data, error } = await supabase
        .from("cleaning_checklist_items")
        .insert({
          checklist_id: id,
          text: newItem,
          position: nextPosition,
        })
        .select();

      if (error) throw error;

      // Update state
      setItems([...items, data[0] as ChecklistItem]);
      setNewItem("");
      setSuccess("Item added successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: unknown) {
      console.error("Error adding item:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(`Failed to add item: ${errorMessage}`);
    }
  };

  // Update item
  const updateItem = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) {
      setError("No item selected for editing");
      return;
    }

    if (!editingItem.text.trim()) {
      setError("Item text is required");
      return;
    }

    try {
      const { error } = await supabase
        .from("cleaning_checklist_items")
        .update({ text: editingItem.text })
        .eq("id", editingItem.id);

      if (error) throw error;

      // Update state
      setItems(
        items.map((item) =>
          item.id === editingItem.id
            ? { ...item, text: editingItem.text }
            : item
        )
      );
      setEditingItem(null);
      setSuccess("Item updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: unknown) {
      console.error("Error updating item:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(`Failed to update item: ${errorMessage}`);
    }
  };

  // Delete item
  const deleteItem = async () => {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from("cleaning_checklist_items")
        .delete()
        .eq("id", itemToDelete.id);

      if (error) throw error;

      // Update state
      setItems(items.filter((item) => item.id !== itemToDelete.id));
      setItemToDelete(null);
      setShowDeleteModal(false);
      setSuccess("Item deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: unknown) {
      console.error("Error deleting item:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(`Failed to delete item: ${errorMessage}`);
    }
  };

  // Handle drag end - update item positions
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      // Find the items
      const activeItem = items.find((item) => item.id === active.id);
      const overItem = items.find((item) => item.id === over.id);

      if (!activeItem || !overItem) return;

      // Create the new array with updated positions
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = [...items];
      newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, activeItem);

      // Update the state optimistically
      setItems(newItems);

      // Update positions in the database
      try {
        // Generate batch updates
        const updates = newItems.map((item, index) => ({
          id: item.id,
          position: index + 1,
        }));

        // Use upsert to update all positions at once
        const { error } = await supabase
          .from("cleaning_checklist_items")
          .upsert(updates, { onConflict: "id" });

        if (error) throw error;
      } catch (error: unknown) {
        console.error("Error updating positions:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setError(`Failed to update item positions: ${errorMessage}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Checklist not found
        </div>
        <Link
          href="/cleaning/checklist/manage"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to checklists
        </Link>
      </div>
    );
  }

  return (
    <PermissionGate
      requiredRole="manager"
      fallback={
        <div className="p-6">
          You don&apos;t have permission to manage checklist items.
        </div>
      }
    >
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Link
            href="/cleaning/checklist/manage"
            className="text-blue-600 hover:text-blue-800 flex items-center mr-4"
          >
            <ArrowLeft size={20} className="mr-1" />
            Back
          </Link>
          <h1 className="text-2xl font-bold">Manage Items: {checklist.name}</h1>
        </div>

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

        {/* Add new item form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Item</h2>
          <form onSubmit={addItem} className="flex items-end gap-2">
            <div className="flex-grow">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Item Text
              </label>
              <input
                type="text"
                value={newItem}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setNewItem(e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                placeholder="e.g., Clean window sills"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
            >
              <Plus size={18} className="mr-1" />
              Add
            </button>
          </form>
        </div>

        {/* Checklist items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Checklist Items</h2>

          {items.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No items in this checklist yet.
            </p>
          ) : (
            <div>
              {editingItem ? (
                <form onSubmit={updateItem} className="mb-4">
                  <div className="flex items-end gap-2">
                    <div className="flex-grow">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Edit Item
                      </label>
                      <input
                        type="text"
                        value={editingItem?.text || ""}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setEditingItem(
                            editingItem
                              ? { ...editingItem, text: e.target.value }
                              : null
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                        aria-label="Edit item text"
                        placeholder="Enter item text"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      aria-label="Save changes"
                      title="Save changes"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingItem(null)}
                      className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      aria-label="Cancel editing"
                      title="Cancel editing"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </form>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis]}
                >
                  <p className="text-sm text-gray-500 mb-3">
                    Drag items to reorder. Click &quot;Edit&quot; to modify or
                    &quot;Delete&quot; to remove an item.
                  </p>
                  <SortableContext
                    items={items.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg shadow-sm border p-4"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            {editingItem?.id === item.id ? (
                              // Edit form
                              <div className="flex items-center space-x-2">
                                <input
                                  value={editingItem?.text || ""}
                                  onChange={(e) =>
                                    editingItem &&
                                    setEditingItem({
                                      ...editingItem,
                                      text: e.target.value,
                                    })
                                  }
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                                />
                                <button
                                  onClick={updateItem}
                                  className="px-3 py-1 bg-blue-600 text-white rounded-md"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingItem(null)}
                                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-900">{item.text}</span>
                            )}
                          </div>
                          {editingItem?.id !== item.id && (
                            <div className="flex space-x-2 ml-4">
                              <ActionButton
                                onClick={() => setEditingItem(item)}
                                title="Edit item"
                                variant="edit"
                              />
                              <ActionButton
                                onClick={() => handleDeleteItem(item.id)}
                                title="Delete item"
                                variant="delete"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Delete Item</h3>
            <p className="mb-6">
              Are you sure you want to delete &apos;{itemToDelete?.text}&apos;?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={deleteItem}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </PermissionGate>
  );
}
