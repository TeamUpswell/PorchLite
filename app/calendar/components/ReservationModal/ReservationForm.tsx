import { useState, useEffect } from "react"; // ✅ Add useEffect
import { format } from "date-fns";
import { Reservation, Companion } from "../../types";
import { CompanionSection } from "./CompanionSection";

interface ReservationFormProps {
  selectedReservation: Reservation | null;
  selectedSlot: { start: Date; end: Date } | null;
  companions: Companion[];
  canAutoApprove: boolean;
  onAddCompanion: () => void;
  onUpdateCompanion: (
    index: number,
    field: keyof Companion,
    value: string | boolean
  ) => void;
  onRemoveCompanion: (index: number) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

// ✅ Add NightsSelector component
const NightsSelector = ({
  nights,
  onChange,
}: {
  nights: number;
  onChange: (nights: number) => void;
}) => {
  return (
    <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 rounded-lg">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, nights - 1))}
        className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
        disabled={nights <= 1}
      >
        <span className="text-lg font-bold">−</span>
      </button>

      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{nights}</div>
        <div className="text-sm text-gray-600">
          {nights === 1 ? "night" : "nights"}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(Math.min(365, nights + 1))}
        className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
      >
        <span className="text-lg font-bold">+</span>
      </button>
    </div>
  );
};

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
  // 🚨 TEMPORARY DEBUG - Remove this after testing
  console.log("🔍 NIGHTS FORM LOADED!");

  // ✅ Helper functions to get initial values
  const getDefaultStartDate = () => {
    if (selectedReservation) {
      return format(new Date(selectedReservation.start), "yyyy-MM-dd");
    }
    if (selectedSlot) {
      return format(selectedSlot.start, "yyyy-MM-dd");
    }
    return format(new Date(), "yyyy-MM-dd");
  };

  const getDefaultNights = () => {
    if (selectedReservation) {
      const startDate = new Date(selectedReservation.start);
      const endDate = new Date(selectedReservation.end);
      return Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }
    if (selectedSlot) {
      return Math.max(
        1,
        Math.ceil(
          (selectedSlot.end.getTime() - selectedSlot.start.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
    }
    return 1;
  };

  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [nights, setNights] = useState(getDefaultNights());

  // ✅ Update state when selectedReservation or selectedSlot changes
  useEffect(() => {
    setStartDate(getDefaultStartDate());
    setNights(getDefaultNights());
  }, [selectedReservation, selectedSlot]);

  // ✅ Calculate checkout date
  const getCheckoutDate = () => {
    if (!startDate) return "";
    const start = new Date(startDate);
    const checkout = new Date(start.getTime() + nights * 24 * 60 * 60 * 1000);
    return checkout.toLocaleDateString();
  };

  // ✅ Update form submission to include calculated end date
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Calculate end date from start date + nights
    const start = new Date(startDate);
    const end = new Date(start.getTime() + nights * 24 * 60 * 60 * 1000);

    // Get form data
    const formData = new FormData(e.currentTarget);

    // ✅ Add calculated dates directly to FormData
    formData.set("startDate", format(start, "yyyy-MM-dd'T'HH:mm"));
    formData.set("endDate", format(end, "yyyy-MM-dd'T'HH:mm"));

    // ✅ Create a simple event object
    const modifiedEvent = {
      ...e,
      currentTarget: {
        ...e.currentTarget,
        // Override FormData getter to return our modified data
        elements: Array.from(formData.entries()).reduce((acc, [key, value]) => {
          acc[key] = { value };
          return acc;
        }, {} as any),
      },
    } as React.FormEvent<HTMLFormElement>;

    onSubmit(modifiedEvent);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title Field */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Reservation Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          key={selectedReservation?.id || "new"} // ✅ Force re-render when editing
          defaultValue={selectedReservation?.title || ""}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Weekend getaway, Family vacation, etc."
        />
      </div>

      {/* ✅ Updated Date Fields - Start Date + Nights */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Check-in Date *
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Number of Nights *
          </label>
          <NightsSelector nights={nights} onChange={setNights} />
          {/* ✅ Show calculated checkout date */}
          {startDate && (
            <p className="text-sm text-gray-600 mt-2 text-center">
              Check-out:{" "}
              <span className="font-medium">{getCheckoutDate()}</span>
            </p>
          )}
        </div>
      </div>

      {/* Number of Guests */}
      <div>
        <label
          htmlFor="guests"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Number of Guests (including yourself) *
        </label>
        <input
          type="number"
          id="guests"
          name="guests"
          min="1"
          required
          key={`guests-${selectedReservation?.id || "new"}`} // ✅ Force re-render when editing
          defaultValue={selectedReservation?.guests || 1}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Description Field */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description (Optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          key={`description-${selectedReservation?.id || "new"}`} // ✅ Force re-render when editing
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

      {/* ✅ Hidden fields to pass calculated dates */}
      <input
        type="hidden"
        name="calculatedStartDate"
        value={
          startDate ? format(new Date(startDate), "yyyy-MM-dd'T'HH:mm") : ""
        }
      />
      <input
        type="hidden"
        name="calculatedEndDate"
        value={
          startDate
            ? format(
                new Date(
                  new Date(startDate).getTime() + nights * 24 * 60 * 60 * 1000
                ),
                "yyyy-MM-dd'T'HH:mm"
              )
            : ""
        }
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
