"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import PermissionGate from "@/components/PermissionGate";
import { useAuth } from "@/components/auth";
import { useProperty } from "@/lib/hooks/useProperty";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";
import { CreatePattern } from "@/components/ui/FloatingActionPresets";

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
  // ✅ ALL HOOKS FIRST
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [filter, setFilter] = useState("upcoming");
  const [showReservationForm, setShowReservationForm] = useState(false);
  // ... other state hooks

  const propertyId = useMemo(() => currentProperty?.id, [currentProperty?.id]);
  const userId = useMemo(() => user?.id, [user?.id]);

  const loadReservations = async () => {
    if (!propertyId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("property_id", propertyId)
        .order("start_date", { ascending: true });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      if (hasInitialized) {
        toast.error("Failed to load reservations");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || propertyLoading) return;
    if (!userId || !propertyId) {
      setLoading(false);
      setHasInitialized(true);
      return;
    }

    setHasInitialized(true);
    loadReservations();
  }, [userId, propertyId, authLoading, propertyLoading, filter]);

  // Handle creating a reservation
  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Calculate end date from start date + nights
    const startDate = new Date(formData.start_date);
    const endDate = new Date(
      startDate.getTime() + formData.nights * 24 * 60 * 60 * 1000
    );

    try {
      const { error } = await supabase.from("reservations").insert([
        {
          title: formData.title,
          start_date: formData.start_date,
          end_date: endDate.toISOString().split("T")[0], // ✅ Calculate end date
          notes: formData.notes,
          user_id: user.id,
          status: "pending",
          property_id: propertyId, // Associate with property
        },
      ]);

      if (error) throw error;

      setShowReservationForm(false);
      setFormData({
        title: "",
        start_date: "",
        nights: 1, // ✅ Reset to default
        notes: "",
      });
      loadReservations();
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
      loadReservations();
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
      loadReservations();
    } catch (error) {
      console.error("Error cancelling reservation:", error);
    }
  };

  // Add this helper component for a more visual nights selector:
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

  // New function to handle reservation editing
  const handleEditReservation = (reservation: Reservation) => {
    // Warn if editing an approved reservation
    if (reservation.status === "approved") {
      const confirmEdit = confirm(
        "This reservation is already approved. Editing will change its status back to pending. Continue?"
      );
      if (!confirmEdit) return;
    }

    // Calculate nights from start and end dates
    const startDate = new Date(reservation.start_date);
    const endDate = new Date(reservation.end_date);
    const nights = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    setEditingReservation(reservation);
    setEditFormData({
      title: reservation.title,
      start_date: reservation.start_date,
      nights: nights,
      notes: reservation.notes || "",
    });
    setShowEditForm(true);
  };

  // Add the update function:
  const handleUpdateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReservation) return;

    // Calculate end date from start date + nights
    const startDate = new Date(editFormData.start_date);
    const endDate = new Date(
      startDate.getTime() + editFormData.nights * 24 * 60 * 60 * 1000
    );

    try {
      const { error } = await supabase
        .from("reservations")
        .update({
          title: editFormData.title,
          start_date: editFormData.start_date,
          end_date: endDate.toISOString().split("T")[0],
          notes: editFormData.notes,
        })
        .eq("id", editingReservation.id);

      if (error) throw error;

      setShowEditForm(false);
      setEditingReservation(null);
      setEditFormData({
        title: "",
        start_date: "",
        nights: 1,
        notes: "",
      });
      loadReservations();
    } catch (error) {
      console.error("Error updating reservation:", error);
    }
  };

  // Standard fix pattern for any page:
  if (authLoading || propertyLoading) {
    return (
      <ProtectedPageWrapper>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </ProtectedPageWrapper>
    );
  }

  // Early return for no user
  if (!user) {
    return null;
  }
  if (!currentProperty) {
    return <div>No property selected</div>;
  }

  // Rest of component...
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
            {/* Header - Remove the old button */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Reservations</h1>
              {/* Remove this old button:
              <button
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg"
                onClick={() => setShowReservationForm(true)}
              >
                <PlusIcon className="h-5 w-5 mr-1" />
                Request Reservation
              </button>
              */}
            </div>

            {/* Existing content - keep all your loading states and reservation list */}
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
                {reservations.map((reservation) => {
                  // Calculate nights for display
                  const startDate = new Date(reservation.start_date);
                  const endDate = new Date(reservation.end_date);
                  const nights = Math.ceil(
                    (endDate.getTime() - startDate.getTime()) /
                      (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div
                      key={reservation.id}
                      className="bg-white p-4 border rounded-lg shadow-sm"
                    >
                      <h3 className="font-medium text-lg">
                        {reservation.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                        <p>
                          Check-in:{" "}
                          {new Date(
                            reservation.start_date
                          ).toLocaleDateString()}
                        </p>
                        <p>
                          Check-out:{" "}
                          {new Date(reservation.end_date).toLocaleDateString()}
                        </p>
                        <p className="font-medium text-blue-600">
                          {nights} {nights === 1 ? "night" : "nights"}
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
                        <p className="mt-2 text-gray-700">
                          {reservation.notes}
                        </p>
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
                                updateReservationStatus(
                                  reservation.id,
                                  "denied"
                                )
                              }
                            >
                              Deny
                            </button>
                          </div>
                        )}

                      {/* User controls */}
                      {reservation.user_id === user?.id &&
                        ["pending", "approved"].includes(
                          reservation.status
                        ) && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            <button
                              className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                              onClick={() => handleEditReservation(reservation)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300 transition-colors"
                              onClick={() => {
                                if (
                                  confirm(
                                    "Are you sure you want to cancel this reservation?"
                                  )
                                ) {
                                  cancelReservation(reservation.id);
                                }
                              }}
                            >
                              ❌ Cancel
                            </button>
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* NEW: Floating Action Button - Mobile/Desktop Optimized */}
        <CreatePattern
          onClick={() => setShowReservationForm(true)}
          label="Request Reservation"
        />

        {/* Keep your existing modal for new reservations */}
        {showReservationForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              {/* ... keep all your existing modal content */}
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
                {/* ... keep all your existing form fields */}
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
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    id="start-date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min={new Date().toISOString().split("T")[0]} // ✅ Prevent past dates
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Number of Nights
                  </label>
                  <NightsSelector
                    nights={formData.nights}
                    onChange={(nights) => setFormData({ ...formData, nights })}
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

        {/* NEW: Edit Reservation Form Modal */}
        {showEditForm && editingReservation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-semibold">Edit Reservation</h2>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingReservation(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close form"
                  title="Close"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateReservation} className="p-4">
                <div className="mb-4">
                  <label
                    htmlFor="edit-title"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    id="edit-title"
                    value={editFormData.title}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Reservation purpose"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="edit-start-date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    id="edit-start-date"
                    value={editFormData.start_date}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        start_date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Number of Nights
                  </label>
                  <NightsSelector
                    nights={editFormData.nights}
                    onChange={(nights) =>
                      setEditFormData({ ...editFormData, nights })
                    }
                  />
                  {/* Show calculated checkout date */}
                  {editFormData.start_date && (
                    <p className="text-sm text-gray-600 mt-2">
                      Check-out:{" "}
                      {new Date(
                        new Date(editFormData.start_date).getTime() +
                          editFormData.nights * 24 * 60 * 60 * 1000
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="edit-notes"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Notes
                  </label>
                  <textarea
                    id="edit-notes"
                    value={editFormData.notes}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        notes: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Any additional details..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingReservation(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update Reservation
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
