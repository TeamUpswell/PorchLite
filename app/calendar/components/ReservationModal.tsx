import { Trash2, Save, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProperty } from "../../../lib/hooks/useProperty";
import { debugLog, debugError } from "@/lib/utils/debug";

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
  status: ReservationStatus;
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
  debugLog("🏠 ReservationModal received props:", {
    isOpen,
    hasReservation: !!reservation,
    reservationId: reservation?.id,
    reservationTitle: reservation?.title,
    selectedSlot,
    isEditing: !!reservation?.id,
  });

  // ✅ ALL HOOKS MUST BE AT THE TOP - BEFORE ANY EARLY RETURNS
  const { user } = useAuth();
  const { currentProperty } = useProperty();

  // Form state
  const [formData, setFormData] = useState<ReservationFormData>({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    guests: 1,
    companion_count: 0,
    status: "pending",
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
        debugError("Invalid date value:", dateValue);
        return "";
      }

      // Format for datetime-local input (YYYY-MM-DDTHH:MM)
      return date.toISOString().slice(0, 16);
    } catch (error) {
      debugError("Error formatting date:", error, dateValue);
      return "";
    }
  };

  // Add debug logging for modal state
  useEffect(() => {
    if (isOpen) {
      debugLog("📅 ReservationModal opened with:", {
        reservation: reservation
          ? {
              id: reservation.id,
              title: reservation.title,
              start_date: reservation.start_date,
              end_date: reservation.end_date,
            }
          : null,
        selectedSlot,
        isEditing: Boolean(reservation?.id),
      });
    }
  }, [isOpen, reservation, selectedSlot]);

  // Log props changes
  useEffect(() => {
    debugLog("🎭 ReservationModal props changed:", {
      isOpen,
      hasReservation: !!reservation,
      reservationId: reservation?.id,
      hasSelectedSlot: !!selectedSlot,
      isEditing: Boolean(reservation?.id),
    });

    if (isOpen && reservation) {
      debugLog("🎭 Modal opening for editing reservation:", {
        id: reservation.id,
        title: reservation.title,
        start_date: reservation.start_date,
        end_date: reservation.end_date,
      });
    }

    if (isOpen && selectedSlot) {
      debugLog("🎭 Modal opening for new reservation:", selectedSlot);
    }
  }, [isOpen, reservation, selectedSlot]);

  // Initialize form data
  useEffect(() => {
    debugLog("📅 Initializing form data:", {
      reservation,
      selectedSlot,
      isEditing: Boolean(reservation?.id),
    });

    if (reservation) {
      // Editing existing reservation
      const newFormData = {
        title: reservation.title || "",
        description: reservation.description || "",
        start_date: formatDateForInput(reservation.start_date),
        end_date: formatDateForInput(reservation.end_date),
        guests: reservation.guests || 1,
        companion_count: reservation.companion_count || 0,
        status: reservation.status || "confirmed",
      };
      debugLog("📅 Setting form data for existing reservation:", newFormData);
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
      debugLog("📅 Setting form data for new reservation:", newFormData);
      setFormData(newFormData);
    }
  }, [reservation, selectedSlot]);

  // ✅ NOW we can have early return AFTER all hooks
  if (!isOpen) return null;

  const isEditing = Boolean(reservation?.id);
  debugLog("📅 ReservationModal rendering - isEditing:", isEditing);

  const handleDeleteClick = () => {
    debugLog("📅 Delete button clicked");
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!reservation || !onDelete) return;

    debugLog("📅 Confirming delete for:", reservation.title);
    try {
      onDelete(reservation);
      onClose();
    } catch (error) {
      debugError("Error deleting reservation:", error);
      toast.error("Failed to delete reservation");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    debugLog("📅 Form submitted:", { formData, isEditing });

    // Wrap the entire function in a try-catch to catch ANY error
    try {
      if (!user || !currentProperty) {
        debugError("📅 Missing context:", {
          user: !!user,
          currentProperty: !!currentProperty,
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
      debugLog("📅 Starting save operation...");

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
          user_id: user.id,
          updated_at: new Date().toISOString(),
        };

        debugLog("📅 Reservation data prepared:", reservationData);

        if (isEditing && reservation) {
          debugLog("📅 Updating existing reservation:", reservation.id);

          // Update existing reservation
          const { error } = await supabase
            .from("reservations")
            .update(reservationData)
            .eq("id", reservation.id);

          if (error) {
            debugError("📅 Update error:", error);
            throw error;
          }

          toast.success("Reservation updated successfully");
          debugLog("✅ Updated reservation:", reservation.id);
        } else {
          debugLog("📅 Creating new reservation");

          // Create new reservation
          const newReservationData = {
            ...reservationData,
            created_at: new Date().toISOString(),
          };

          debugLog("📅 New reservation data:", newReservationData);

          const { error } = await supabase
            .from("reservations")
            .insert([newReservationData]);

          if (error) {
            debugError("📅 Insert error:", error);
            throw error;
          }

          toast.success("Reservation created successfully");
          debugLog("✅ Created new reservation");
        }

        // *** CRITICAL DEBUG POINT ***
        debugLog("📅 About to call onSave()");
        debugLog("📅 onSave type:", typeof onSave);

        // Check if onSave is actually a function
        if (typeof onSave !== "function") {
          debugError("❌ onSave is not a function!", onSave);
          toast.error("Internal error: onSave callback is invalid");
          return;
        }

        // Call onSave and catch any errors from it
        try {
          onSave();
          debugLog("📅 onSave() called successfully");
        } catch (onSaveError: unknown) {
          debugError("❌ Error in onSave():", onSaveError);

          // Safe error handling
          const errorMessage =
            onSaveError instanceof Error
              ? onSaveError.message
              : String(onSaveError);

          const errorStack =
            onSaveError instanceof Error ? onSaveError.stack : undefined;

          debugError("❌ onSave error message:", errorMessage);
          if (errorStack) {
            debugError("❌ onSave error stack:", errorStack);
          }

          throw onSaveError;
        }
      } catch (saveError) {
        const errorMessage =
          saveError instanceof Error ? saveError.message : String(saveError);
        const errorStack =
          saveError instanceof Error ? saveError.stack : undefined;

        debugError("❌ Failed to save reservation:", saveError);
        debugError("❌ Save error message:", errorMessage);
        if (errorStack) {
          debugError("❌ Save error stack:", errorStack);
        }

        toast.error(
          isEditing
            ? "Failed to update reservation"
            : "Failed to create reservation"
        );
      } finally {
        setSaving(false);
      }
    } catch (outerError: unknown) {
      const errorMessage =
        outerError instanceof Error ? outerError.message : String(outerError);
      const errorStack =
        outerError instanceof Error ? outerError.stack : undefined;

      debugError("❌ Outer catch - Failed to save reservation:", outerError);
      debugError("❌ Error message:", errorMessage);
      if (errorStack) {
        debugError("❌ Outer error stack:", errorStack);
      }

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
              className="text-gray-600 dark:text-gray-400 hover:text-gray-600 transition-colors"
              disabled={saving}
              aria-label="Close modal"
              title="Close modal"
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
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in *
                </label>
                <input
                  id="start_date"
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
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out *
                </label>
                <input
                  id="end_date"
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
                <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Guests *
                </label>
                <input
                  id="guests"
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
                <label htmlFor="companion_count" className="block text-sm font-medium text-gray-700 mb-2">
                  Companions
                </label>
                <input
                  id="companion_count"
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
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
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
              Are you sure you want to delete &quot;{reservation?.title}&quot;? This
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
