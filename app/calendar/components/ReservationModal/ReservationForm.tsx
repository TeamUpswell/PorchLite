import { format } from "date-fns";
import { Reservation, Companion } from "../../types";
import { CompanionSection } from "./CompanionSection";

interface ReservationFormProps {
  selectedReservation: Reservation | null;
  selectedSlot: { start: Date; end: Date } | null;
  companions: Companion[];
  canAutoApprove: boolean;
  onAddCompanion: () => void;
  onUpdateCompanion: (index: number, field: keyof Companion, value: string | boolean) => void;
  onRemoveCompanion: (index: number) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const ReservationForm = ({
  selectedReservation,
  selectedSlot,
  companions,
  canAutoApprove,
  onAddCompanion,
  onUpdateCompanion,
  onRemoveCompanion,
  onSubmit,
}: ReservationFormProps) => {
  const getDefaultStartDate = () => {
    if (selectedReservation) {
      return format(new Date(selectedReservation.start), "yyyy-MM-dd'T'HH:mm");
    }
    if (selectedSlot) {
      return format(selectedSlot.start, "yyyy-MM-dd'T'HH:mm");
    }
    return format(new Date(), "yyyy-MM-dd'T'HH:mm");
  };

  const getDefaultEndDate = () => {
    if (selectedReservation) {
      return format(new Date(selectedReservation.end), "yyyy-MM-dd'T'HH:mm");
    }
    if (selectedSlot) {
      return format(selectedSlot.end, "yyyy-MM-dd'T'HH:mm");
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return format(tomorrow, "yyyy-MM-dd'T'HH:mm");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Title Field */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Reservation Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          defaultValue={selectedReservation?.title || ""}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Weekend getaway, Family vacation, etc."
        />
      </div>

      {/* Date Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date *
          </label>
          <input
            type="datetime-local"
            id="startDate"
            name="startDate"
            required
            defaultValue={getDefaultStartDate()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            End Date *
          </label>
          <input
            type="datetime-local"
            id="endDate"
            name="endDate"
            required
            defaultValue={getDefaultEndDate()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Number of Guests */}
      <div>
        <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-1">
          Number of Guests (including yourself) *
        </label>
        <input
          type="number"
          id="guests"
          name="guests"
          min="1"
          required
          defaultValue={selectedReservation?.guests || 1}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Description Field */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description (Optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={selectedReservation?.description || ""}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Add any special notes or requirements..."
        />
      </div>

      {/* Companions Section */}
      <CompanionSection
        companions={companions}
        onAddCompanion={onAddCompanion}
        onUpdateCompanion={onUpdateCompanion}
        onRemoveCompanion={onRemoveCompanion}
        canAutoApprove={canAutoApprove}
      />

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {selectedReservation ? "Update Reservation" : "Create Reservation"}
        </button>
      </div>
    </form>
  );
};