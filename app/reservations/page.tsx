"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/auth";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import StandardCard from "@/components/ui/StandardCard";
import { useProperty } from "@/lib/hooks/useProperty";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";
import { CreatePattern } from "@/components/ui/FloatingActionPresets";
import { toast } from "react-hot-toast";
import { useViewMode } from "@/lib/hooks/useViewMode";

// Define Reservation type
interface Reservation {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: "pending" | "approved" | "denied" | "cancelled";
  user_id: string;
  notes?: string;
  property_id: string;
}

interface FormData {
  title: string;
  start_date: string;
  nights: number;
  notes: string;
}

export default function ReservationsPage() {
  // ✅ ALL HOOKS FIRST
  const { user, loading: authLoading } = useAuth();
  const { currentProperty, loading: propertyLoading } = useProperty();
  const { isManagerView, isFamilyView, isGuestView } = useViewMode();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [filter, setFilter] = useState("upcoming");
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  // Form data states
  const [formData, setFormData] = useState<FormData>({
    title: "",
    start_date: "",
    nights: 1,
    notes: "",
  });

  const [editFormData, setEditFormData] = useState<FormData>({
    title: "",
    start_date: "",
    nights: 1,
    notes: "",
  });

  const propertyId = useMemo(() => currentProperty?.id, [currentProperty?.id]);
  const userId = useMemo(() => user?.id, [user?.id]);

  // Permission helper
  const hasPermission = (requiredRole: string) => {
    if (requiredRole === "manager") return isManagerView;
    if (requiredRole === "family") return isFamilyView || isManagerView;
    return true; // guest permissions
  };

  const loadReservations = async () => {
    if (!propertyId) return;

    setLoading(true);
    try {
      let query = supabase
        .from("reservations")
        .select("*")
        .eq("property_id", propertyId);

      // Apply filter
      if (filter === "upcoming") {
        query = query.gte("start_date", new Date().toISOString().split("T")[0]);
      } else if (filter === "past") {
        query = query.lt("start_date", new Date().toISOString().split("T")[0]);
      } else if (filter === "pending") {
        query = query.eq("status", "pending");
      } else if (filter === "approved") {
        query = query.eq("status", "approved");
      } else if (filter === "my-reservations" && userId) {
        query = query.eq("user_id", userId);
      }

      query = query.order("start_date", { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error("Error loading reservations:", error);
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
    if (!user || !propertyId) return;

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
          end_date: endDate.toISOString().split("T")[0],
          notes: formData.notes,
          user_id: user.id,
          status: "pending",
          property_id: propertyId,
        },
      ]);

      if (error) throw error;

      setShowReservationForm(false);
      setFormData({
        title: "",
        start_date: "",
        nights: 1,
        notes: "",
      });
      toast.success("Reservation request submitted!");
      loadReservations();
    } catch (error) {
      console.error("Error creating reservation:", error);
      toast.error("Failed to create reservation");
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
      toast.success(`Reservation ${status}!`);
      loadReservations();
    } catch (error) {
      console.error("Error updating reservation:", error);
      toast.error("Failed to update reservation");
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
      toast.success("Reservation cancelled");
      loadReservations();
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      toast.error("Failed to cancel reservation");
    }
  };

  // Nights selector component
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

  // Handle reservation editing
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

  // Handle reservation update
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
          status: "pending", // Reset to pending when edited
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
      toast.success("Reservation updated!");
      loadReservations();
    } catch (error) {
      console.error("Error updating reservation:", error);
      toast.error("Failed to update reservation");
    }
  };

  // ✅ Early returns AFTER all hooks
  if (authLoading || propertyLoading) {
    return (
      <div className="p-6">
        <Header title="Reservations" />
        <PageContainer>
          <StandardCard>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading...</span>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  if (!user) {
    return null; // Auth will redirect
  }

  if (!currentProperty) {
    return (
      <div className="p-6">
        <Header title="Reservations" />
        <PageContainer>
          <StandardCard>
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900">
                No Property Selected
              </h3>
              <p className="text-gray-500 mt-2">
                Please select a property to view reservations.
              </p>
            </div>
          </StandardCard>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Header title="Reservations" />
      <PageContainer>
        <div className="space-y-6">
          <StandardCard
            title="Guest Reservations"
            subtitle="Manage guest bookings and availability"
            headerActions={
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {currentProperty.name} • {reservations.length} reservations
                </span>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Reservations</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                  <option value="pending">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="my-reservations">My Reservations</option>
                </select>
              </div>
            }
          >
            <div className="space-y-6">
              {/* Add reservation button for family/manager */}
              {(isManagerView || isFamilyView) && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowReservationForm(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Request Reservation
                  </button>
                </div>
              )}

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p>Loading reservations...</p>
                </div>
              ) : reservations.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No reservations found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {filter === "all" 
                      ? "No reservations have been made yet" 
                      : `No ${filter} reservations found`}
                  </p>
                  {(isManagerView || isFamilyView) && (
                    <button
                      onClick={() => setShowReservationForm(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Make First Reservation
                    </button>
                  )}
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
                        className="bg-white p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {reservation.title}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              reservation.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : reservation.status === "denied"
                                ? "bg-red-100 text-red-800"
                                : reservation.status === "cancelled"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {reservation.status.charAt(0).toUpperCase() +
                              reservation.status.slice(1)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                          <div>
                            <span className="font-medium">Check-in:</span>
                            <br />
                            {new Date(reservation.start_date).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Check-out:</span>
                            <br />
                            {new Date(reservation.end_date).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span>
                            <br />
                            <span className="text-blue-600 font-medium">
                              {nights} {nights === 1 ? "night" : "nights"}
                            </span>
                          </div>
                        </div>

                        {reservation.notes && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Notes:</span>
                            <p className="text-sm text-gray-600 mt-1">{reservation.notes}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {/* Manager controls */}
                          {reservation.status === "pending" && hasPermission("manager") && (
                            <>
                              <button
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                                onClick={() =>
                                  updateReservationStatus(reservation.id, "approved")
                                }
                              >
                                ✓ Approve
                              </button>
                              <button
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                                onClick={() =>
                                  updateReservationStatus(reservation.id, "denied")
                                }
                              >
                                ✗ Deny
                              </button>
                            </>
                          )}

                          {/* User controls */}
                          {reservation.user_id === user?.id &&
                            ["pending", "approved"].includes(reservation.status) && (
                              <>
                                <button
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                                  onClick={() => handleEditReservation(reservation)}
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  className="px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 transition-colors"
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
                              </>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </StandardCard>
        </div>
      </PageContainer>

      {/* Floating Action Button */}
      {(isManagerView || isFamilyView) && (
        <CreatePattern
          onClick={() => setShowReservationForm(true)}
          label="Request Reservation"
        />
      )}

      {/* New Reservation Modal */}
      {showReservationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Request Reservation</h2>
              <button
                onClick={() => setShowReservationForm(false)}
                className="text-gray-500 hover:text-gray-700"
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
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Weekend getaway, Business trip, etc."
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="start-date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Check-in Date *
                </label>
                <input
                  type="date"
                  id="start-date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Number of Nights *
                </label>
                <NightsSelector
                  nights={formData.nights}
                  onChange={(nights) => setFormData({ ...formData, nights })}
                />
                {formData.start_date && (
                  <p className="text-sm text-gray-600 mt-2">
                    Check-out:{" "}
                    {new Date(
                      new Date(formData.start_date).getTime() +
                        formData.nights * 24 * 60 * 60 * 1000
                    ).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="mb-6">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any special requests or additional details..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReservationForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Reservation Modal */}
      {showEditForm && editingReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Edit Reservation</h2>
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setEditingReservation(null);
                }}
                className="text-gray-500 hover:text-gray-700"
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
                  Title *
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="edit-start-date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Check-in Date *
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Number of Nights *
                </label>
                <NightsSelector
                  nights={editFormData.nights}
                  onChange={(nights) =>
                    setEditFormData({ ...editFormData, nights })
                  }
                />
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

              <div className="mb-6">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any special requests or additional details..."
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Editing this reservation will reset its status to "pending" and require re-approval.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingReservation(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Update Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
