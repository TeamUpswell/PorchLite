import { Trash2, Save, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Reservation } from "../types";

interface ReservationModalProps {
  reservation?: Reservation | null;
  selectedSlot?: { start: Date; end: Date } | null;
  onClose: () => void;
  onSaved: () => void;
  onDelete?: (id: string) => void;
}

export function ReservationModal({
  reservation,
  selectedSlot,
  onClose,
  onSaved,
  onDelete,
}: ReservationModalProps) {
  const isEditing = Boolean(reservation?.id);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    guests: 1,
    status: "confirmed" as const,
  });

  // Helper function to safely format date
  const formatDateForInput = (dateValue: string | Date | null | undefined): string => {
    if (!dateValue) return "";
    
    try {
      const date = new Date(dateValue);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid date value:", dateValue);
        return "";
      }
      
      return date.toISOString().slice(0, 16);
    } catch (error) {
      console.error("Error formatting date:", error, dateValue);
      return "";
    }
  };

  // Initialize form data with better error handling
  useEffect(() => {
    if (reservation) {
      setFormData({
        title: reservation.title || "",
        description: reservation.description || "",
        start_date: formatDateForInput(reservation.start_date),
        end_date: formatDateForInput(reservation.end_date),
        guests: reservation.guests || 1,
        status: reservation.status || "confirmed",
      });
    } else if (selectedSlot) {
      setFormData({
        title: "",
        description: "",
        start_date: formatDateForInput(selectedSlot.start),
        end_date: formatDateForInput(selectedSlot.end),
        guests: 1,
        status: "confirmed",
      });
    }
  }, [reservation, selectedSlot]);

  // Delete handler
  const handleDelete = async () => {
    if (!reservation?.id || !onDelete) return;

    if (
      window.confirm(
        "Are you sure you want to delete this reservation? This action cannot be undone."
      )
    ) {
      try {
        await onDelete(reservation.id);
        toast.success("Reservation deleted successfully");
        onClose();
      } catch (error) {
        console.error("Error deleting reservation:", error);
        toast.error("Failed to delete reservation");
      }
    }
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

    // Add your save logic here
    console.log("Form data to save:", formData);
    
    // Then call onSaved() to refresh the calendar
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Edit Reservation" : "New Reservation"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Reservation title"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Additional details..."
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Guests */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Guests
            </label>
            <input
              type="number"
              min="1"
              value={formData.guests}
              onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Status */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="requested">Requested</option>
            </select>
          </div>

          {/* Modal Footer with Delete Button */}
          <div className="flex justify-between items-center pt-4 border-t">
            {/* Delete Button - Only show for existing reservations */}
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? "Save Changes" : "Create Reservation"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
