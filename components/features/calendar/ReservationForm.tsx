"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  CalendarIcon,
  XMarkIcon, // Updated from XIcon
  CheckIcon,
} from "@heroicons/react/24/outline";

interface ReservationFormProps {
  reservation: any | null;
  onSave: (reservationData: any) => Promise<void>;
  onCancel: () => void;
}

export default function ReservationForm({
  reservation,
  onSave,
  onCancel,
}: ReservationFormProps) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If editing an existing reservation, populate form fields
    if (reservation) {
      setTitle(reservation.title || "");
      // Format dates for input[type=date]
      setStartDate(format(new Date(reservation.start_date), "yyyy-MM-dd"));
      setEndDate(format(new Date(reservation.end_date), "yyyy-MM-dd"));
      setDescription(reservation.description || "");
    } else {
      // Default values for new reservation
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      
      setTitle("");
      setStartDate(format(today, "yyyy-MM-dd"));
      setEndDate(format(tomorrow, "yyyy-MM-dd"));
      setDescription("");
    }
  }, [reservation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const reservationData = {
        title,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        description,
        ...(reservation?.id && { id: reservation.id }),
      };
      
      await onSave(reservationData);
    } catch (error) {
      console.error("Error saving reservation:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {reservation ? "Edit Reservation" : "New Reservation"}
          </h3>
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Close reservation form"
            title="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : reservation ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
