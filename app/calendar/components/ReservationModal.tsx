import { Trash2, Save, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../lib/hooks/useAuth";
import { useProperty } from "../../../lib/hooks/useProperty";

// Define the Reservation type to match your database
interface Reservation {
  id: string;
  user_id: string;
  start_date: string | Date;
  end_date: string | Date;
  title: string;
  description?: string | null;
  guests: number;
  status: "confirmed" | "pending" | "cancelled" | "requested";
  tenant_id: string;
  property_id: string;
  companion_count: number;
  created_at?: string;
  updated_at?: string;
}

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  selectedSlot: { start: Date; end: Date } | null;
  onSave: () => void;
  onDelete?: (event: any) => void;
  isManager: boolean;
}

// Define the status type
type ReservationStatus = "confirmed" | "pending" | "requested" | "cancelled";

// Define your form data interface
interface ReservationFormData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  guests: number;
  companion_count: number;
  status: ReservationStatus; // ✅ Allow all status types
}

export default function ReservationModal({
  isOpen,
  onClose,
  reservation,
  selectedSlot,
  onSave,
  onDelete,
  isManager,
}: ReservationModalProps) {
  // ✅ Add debug log at the very top
  console.log("🏠 ReservationModal received props:", {
    isOpen,
    hasReservation: !!reservation,
    reservationId: reservation?.id,
    reservationTitle: reservation?.title,
    selectedSlot,
    isEditing: !!reservation?.id,
  });

  // ✅ ALL HOOKS MUST BE AT THE TOP - BEFORE ANY EARLY RETURNS
  const { user } = useAuth();
  const { currentProperty, currentTenant } = useProperty();

  // Form state
  const [formData, setFormData] = useState<ReservationFormData>({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    guests: 1,
    companion_count: 0,
    status: "pending", // or whatever default you want
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Helper function to safely format date for datetime-local input
  const formatDateForInput = (
    dateValue: string | Date | null | undefined
  ): string => {
    if (!dateValue) return "";

    try {
      const date = new Date(dateValue);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid date value:", dateValue);
        return "";
      }

      // Format for datetime-local input (YYYY-MM-DDTHH:MM)
      return date.toISOString().slice(0, 16);
    } catch (error) {
      console.error("Error formatting date:", error, dateValue);
      return "";
    }
  };

  // Add debug logging for modal state
  useEffect(() => {
    if (isOpen) {
      console.log("[DEBUG] 📅 ReservationModal opened with:", {
        reservation: reservation
          ? {
              id: reservation.id,
              title: reservation.title,
              start: reservation.start,
              end: reservation.end,
            }
          : null,
        selectedSlot,
        isEditing: Boolean(reservation?.id),
      });
    }
  }, [isOpen, reservation, selectedSlot]);

  // Log props changes
  useEffect(() => {
    console.log("[DEBUG] 🎭 ReservationModal props changed:", {
      isOpen,
      hasReservation: !!reservation,
      reservationId: reservation?.id,
      hasSelectedSlot: !!selectedSlot,
      isEditing: Boolean(reservation?.id),
    });

    if (isOpen && reservation) {
      console.log("[DEBUG] 🎭 Modal opening for editing reservation:", {
        id: reservation.id,
        title: reservation.title,
        start_date: reservation.start,
        end_date: reservation.end,
      });
    }

    if (isOpen && selectedSlot) {
      console.log(
        "[DEBUG] 🎭 Modal opening for new reservation:",
        selectedSlot
      );
    }
  }, [isOpen, reservation, selectedSlot]);

  // Initialize form data
  useEffect(() => {
    console.log("[DEBUG] 📅 Initializing form data:", {
      reservation,
      selectedSlot,
      isEditing: Boolean(reservation?.id),
    });

    if (reservation) {
      // Editing existing reservation
      const newFormData = {
        title: reservation.title || "",
        description: reservation.description || "",
        // ✅ Fix: Use start_date and end_date, not start/end
        start_date: formatDateForInput(reservation.start_date),
        end_date: formatDateForInput(reservation.end_date),
        guests: reservation.guests || 1,
        companion_count: reservation.companion_count || 0,
        status: reservation.status || "confirmed",
      };
      console.log(
        "[DEBUG] 📅 Setting form data for existing reservation:",
        newFormData
      );
      setFormData(newFormData);
    } else if (selectedSlot) {
      // Creating new reservation
      const newFormData = {
        title: "",
        description: "",
        start_date: formatDateForInput(selectedSlot.start),
        end_date: formatDateForInput(selectedSlot.end),
        guests: 1,
        companion_count: 0,
        status: "confirmed" as const,
      };
      console.log(
        "[DEBUG] 📅 Setting form data for new reservation:",
        newFormData
      );
      setFormData(newFormData);
    }
  }, [reservation, selectedSlot]);

  // ✅ NOW we can have early return AFTER all hooks
  if (!isOpen) return null;

  const isEditing = Boolean(reservation?.id);
  console.log("[DEBUG] 📅 ReservationModal rendering - isEditing:", isEditing);

  const handleDeleteClick = () => {
    console.log("[DEBUG] 📅 Delete button clicked");
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!reservation || !onDelete) return;

    console.log("[DEBUG] 📅 Confirming delete for:", reservation.title);
    try {
      onDelete(reservation);
      onClose();
    } catch (error) {
      console.error("Error deleting reservation:", error);
      toast.error("Failed to delete reservation");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[DEBUG] 📅 Form submitted:", { formData, isEditing });

    // Wrap the entire function in a try-catch to catch ANY error
    try {
      if (!user || !currentProperty || !currentTenant) {
        console.error("[DEBUG] 📅 Missing context:", {
          user: !!user,
          currentProperty: !!currentProperty,
          currentTenant: !!currentTenant,
        });
        toast.error("Missing authentication or property context");
        return;
      }

      // Validate dates before submitting
      if (!formData.start_date || !formData.end_date) {
        toast.error("Please select both start and end dates");
        return;
      }

      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        toast.error("Invalid date values");
        return;
      }

      if (startDate >= endDate) {
        toast.error("End date must be after start date");
        return;
      }

      if (!formData.title.trim()) {
        toast.error("Please enter a title for the reservation");
        return;
      }

      setSaving(true);
      console.log("[DEBUG] 📅 Starting save operation...");

      try {
        // Prepare data for database
        const reservationData = {
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          guests: formData.guests,
          companion_count: formData.companion_count,
          status: formData.status,
          property_id: currentProperty.id,
          tenant_id: currentTenant.id,
          user_id: user.id,
          updated_at: new Date().toISOString(),
        };

        console.log("[DEBUG] 📅 Reservation data prepared:", reservationData);

        if (isEditing && reservation) {
          console.log(
            "[DEBUG] 📅 Updating existing reservation:",
            reservation.id
          );

          // Update existing reservation
          const { error } = await supabase
            .from("reservations")
            .update(reservationData)
            .eq("id", reservation.id);

          if (error) {
            console.error("[DEBUG] 📅 Update error:", error);
            throw error;
          }

          toast.success("Reservation updated successfully");
          console.log("✅ Updated reservation:", reservation.id);
        } else {
          console.log("[DEBUG] 📅 Creating new reservation");

          // Create new reservation
          const newReservationData = {
            ...reservationData,
            created_at: new Date().toISOString(),
          };

          console.log("[DEBUG] 📅 New reservation data:", newReservationData);

          const { error } = await supabase
            .from("reservations")
            .insert([newReservationData]);

          if (error) {
            console.error("[DEBUG] 📅 Insert error:", error);
            throw error;
          }

          toast.success("Reservation created successfully");
          console.log("✅ Created new reservation");
        }

        // *** CRITICAL DEBUG POINT ***
        console.log("[DEBUG] 📅 About to call onSave()");
        console.log("[DEBUG] 📅 onSave type:", typeof onSave);
        console.log("[DEBUG] 📅 onSave function:", onSave);

        // Check if onSave is actually a function
        if (typeof onSave !== "function") {
          console.error("❌ onSave is not a function!", onSave);
          toast.error("Internal error: onSave callback is invalid");
          return;
        }

        // Call onSave and catch any errors from it
        try {
          onSave();
          console.log("[DEBUG] 📅 onSave() called successfully");
        } catch (onSaveError) {
          console.error("❌ Error in onSave():", onSaveError);
          console.error("❌ onSave error stack:", onSaveError.stack);
          throw onSaveError;
        }
      } catch (saveError) {
        console.error("❌ Failed to save reservation:", saveError);
        console.error("❌ Save error stack:", saveError.stack);
        toast.error(
          isEditing
            ? "Failed to update reservation"
            : "Failed to create reservation"
        );
      } finally {
        setSaving(false);
      }
    } catch (outerError) {
      console.error("❌ Outer catch - Failed to save reservation:", outerError);
      console.error("❌ Outer error stack:", outerError.stack);
      console.error("❌ Error message:", outerError.message);
      setSaving(false);
    }
  };

  return (
    <>
      {/* ✅ Keep only this main modal JSX */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditing ? "Edit Reservation" : "New Reservation"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={saving}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Reservation title"
                required
                disabled={saving}
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Additional details..."
                disabled={saving}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in *
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out *
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={saving}
                />
              </div>
            </div>

            {/* Guests and Companions */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Guests *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.guests}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      guests: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Companions
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.companion_count}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      companion_count: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Total Guest Count Display */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">
                Total guests: {formData.guests + formData.companion_count}
              </span>
            </div>

            {/* Status */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={saving}
              >
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="requested">Requested</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-4 border-t">
              {/* Delete Button - Only show for existing reservations and if user is manager */}
              {isEditing && onDelete && isManager && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              )}

              {/* Right side buttons */}
              <div className="flex space-x-3 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditing ? "Save Changes" : "Create Reservation"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Reservation</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{reservation?.title}"? This
              action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
