"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import PermissionGate from "@/components/PermissionGate";
import { useAuth } from "@/components/AuthProvider";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";

// Define Reservation type
interface Reservation {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: "pending" | "approved" | "denied" | "cancelled";
  user_id: string;
  notes?: string;
}

export default function ReservationsPage() {
  const { user, hasPermission } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    start_date: "",
    end_date: "",
    notes: "",
  });

  // Memoize the fetchReservations function with useCallback
  const fetchReservations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("start_date", { ascending: true });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, setReservations]);

  // Now update the dependency array to include fetchReservations
  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user, fetchReservations]);

  // Handle creating a reservation
  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from("reservations").insert([
        {
          title: formData.title,
          start_date: formData.start_date,
          end_date: formData.end_date,
          notes: formData.notes,
          user_id: user.id,
          status: "pending",
        },
      ]);

      if (error) throw error;

      setShowReservationForm(false);
      setFormData({ title: "", start_date: "", end_date: "", notes: "" });
      fetchReservations();
    } catch (error) {
      console.error("Error creating reservation:", error);
    }
  };

  // Update reservation status
  const updateReservationStatus = async (
    id: string,
    status: "approved" | "denied"
  ) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      fetchReservations();
    } catch (error) {
      console.error("Error updating reservation:", error);
    }
  };

  // Cancel reservation
  const cancelReservation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", id)
        .eq("user_id", user?.id || "");

      if (error) throw error;
      fetchReservations();
    } catch (error) {
      console.error("Error cancelling reservation:", error);
    }
  };

  return (
    <ProtectedPageWrapper>
      <PermissionGate
        requiredRole="family"
        fallback={
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-gray-600">
              Sorry, you need family member permissions to access reservations.
            </p>
          </div>
        }
      >
        <div className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Reservations</h1>
              <button
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg"
                onClick={() => setShowReservationForm(true)}
              >
                <PlusIcon className="h-5 w-5 mr-1" />
                Request Reservation
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading reservations...</div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No reservations found</p>
                <p className="text-gray-500 text-sm mt-2">
                  Make a reservation request to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="bg-white p-4 border rounded-lg shadow-sm"
                  >
                    <h3 className="font-medium text-lg">{reservation.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                      <p>
                        From:{" "}
                        {new Date(reservation.start_date).toLocaleDateString()}
                      </p>
                      <p>
                        To:{" "}
                        {new Date(reservation.end_date).toLocaleDateString()}
                      </p>
                      <p
                        className={`font-medium ${
                          reservation.status === "approved"
                            ? "text-green-600"
                            : reservation.status === "denied"
                            ? "text-red-600"
                            : reservation.status === "cancelled"
                            ? "text-gray-600"
                            : "text-amber-600"
                        }`}
                      >
                        Status:{" "}
                        {reservation.status.charAt(0).toUpperCase() +
                          reservation.status.slice(1)}
                      </p>
                    </div>

                    {reservation.notes && (
                      <p className="mt-2 text-gray-700">{reservation.notes}</p>
                    )}

                    {/* Manager controls */}
                    {reservation.status === "pending" &&
                      hasPermission("manager") && (
                        <div className="flex space-x-2 mt-4">
                          <button
                            className="px-3 py-1 bg-green-500 text-white text-sm rounded-md"
                            onClick={() =>
                              updateReservationStatus(
                                reservation.id,
                                "approved"
                              )
                            }
                          >
                            Approve
                          </button>
                          <button
                            className="px-3 py-1 bg-red-500 text-white text-sm rounded-md"
                            onClick={() =>
                              updateReservationStatus(reservation.id, "denied")
                            }
                          >
                            Deny
                          </button>
                        </div>
                      )}

                    {/* User controls - can cancel their own reservations if pending/approved */}
                    {reservation.user_id === user?.id &&
                      ["pending", "approved"].includes(reservation.status) && (
                        <button
                          className="px-3 py-1 mt-4 bg-gray-200 text-gray-800 text-sm rounded-md"
                          onClick={() => cancelReservation(reservation.id)}
                        >
                          Cancel
                        </button>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reservation Form Modal */}
        {showReservationForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-semibold">Request Reservation</h2>
                <button
                  onClick={() => setShowReservationForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close form"
                  title="Close"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreateReservation} className="p-4">
                <div className="mb-4">
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Reservation purpose"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="start-date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start-date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="end-date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end-date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Any additional details..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReservationForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PermissionGate>
    </ProtectedPageWrapper>
  );
}
