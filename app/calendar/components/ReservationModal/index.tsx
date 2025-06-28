import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty";
import { Reservation, Companion } from "../../types";
import { useUserRoles } from "../../hooks/useUserRoles";
import { useCompanions } from "../../hooks/useCompanions";
import { ReservationForm } from "./ReservationForm";

interface ReservationModalProps {
  isOpen: boolean; // ✅ Add this
  selectedReservation: Reservation | null;
  selectedSlot: { start: Date; end: Date } | null;
  onClose: () => void;
  onSave: () => void;
  onDelete?: (id: string) => void; // ✅ Add this (optional)
  isManager?: boolean; // ✅ Add this (optional)
  reservation?: Reservation | null; // ✅ Add this as alias
}

export const ReservationModal = ({
  isOpen, // ✅ Accept this prop
  selectedReservation,
  reservation, // ✅ Accept this as alias
  selectedSlot,
  onClose,
  onSave,
  onDelete, // ✅ Accept this prop
  isManager, // ✅ Accept this prop
}: ReservationModalProps) => {
  // ✅ Use reservation as fallback for selectedReservation
  const actualReservation = selectedReservation || reservation;

  // ✅ Add debug logs at the top
  console.log("🏠 ReservationModal received props:", {
    isOpen,
    selectedReservation: actualReservation?.title,
    selectedSlot: !!selectedSlot,
    isManager,
  });

  // ✅ Don't render if not open
  if (!isOpen) {
    console.log("🏠 ReservationModal: Not open, not rendering");
    return null;
  }

  const { user } = useAuth();
  const { currentProperty } = useProperty();
  const {
    userRoles,
    canAutoApprove,
    canApproveOthers,
    determineReservationStatus,
  } = useUserRoles();
  const {
    companions,
    addCompanion,
    updateCompanion,
    removeCompanion,
    sendGuestInvitations,
  } = useCompanions();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user can delete/cancel this reservation
  const canDelete = () => {
    if (!actualReservation || !user) return false;

    // Owners and managers can delete any reservation
    if (isManager || userRoles.includes("owner")) return true;

    // Users can delete their own reservations
    return actualReservation.user_id === user.id;
  };

  // Handle reservation deletion/cancellation
  const handleDelete = async () => {
    if (!actualReservation?.id) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to cancel the reservation "${actualReservation.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    setIsSubmitting(true);

    try {
      // Delete companions first (foreign key constraint)
      await supabase
        .from("reservation_companions")
        .delete()
        .eq("reservation_id", actualReservation.id);

      // Delete approval records
      await supabase
        .from("reservation_approvals")
        .delete()
        .eq("reservation_id", actualReservation.id);

      // Delete the reservation
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", actualReservation.id);

      if (error) throw error;

      alert("✅ Reservation cancelled successfully!");

      // Call onDelete callback if provided
      if (onDelete) {
        onDelete(actualReservation.id);
      }

      onSave(); // Refresh the calendar
      onClose(); // Close the modal
    } catch (error: any) {
      console.error("❌ Error cancelling reservation:", error);
      alert(`❌ Failed to cancel reservation: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reservation approval
  const handleApprove = async () => {
    if (!actualReservation?.id) return;

    setIsSubmitting(true);

    try {
      // Update reservation status to confirmed
      const { error: reservationError } = await supabase
        .from("reservations")
        .update({
          status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", actualReservation.id);

      if (reservationError) throw reservationError;

      // Update approval record
      const { error: approvalError } = await supabase
        .from("reservation_approvals")
        .update({
          status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("reservation_id", actualReservation.id)
        .eq("status", "pending");

      if (approvalError) throw approvalError;

      // Send guest invitations if there are companions
      if (companions.length > 0) {
        const invitesSent = await sendGuestInvitations(actualReservation.id);
        if (invitesSent > 0) {
          console.log(`✅ Sent ${invitesSent} guest invitations`);
        }
      }

      alert("✅ Reservation approved successfully!");
      onSave(); // Refresh the calendar
      onClose(); // Close the modal
    } catch (error: any) {
      console.error("❌ Error approving reservation:", error);
      alert(`❌ Failed to approve reservation: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reservation rejection
  const handleReject = async () => {
    if (!actualReservation?.id) return;

    const reason = window.prompt(
      "Please provide a reason for rejecting this reservation (optional):"
    );

    // User cancelled the prompt
    if (reason === null) return;

    setIsSubmitting(true);

    try {
      // Update reservation status to rejected
      const { error: reservationError } = await supabase
        .from("reservations")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", actualReservation.id);

      if (reservationError) throw reservationError;

      // Update approval record
      const { error: approvalError } = await supabase
        .from("reservation_approvals")
        .update({
          status: "rejected",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          notes: reason || null,
        })
        .eq("reservation_id", actualReservation.id)
        .eq("status", "pending");

      if (approvalError) throw approvalError;

      alert("✅ Reservation rejected successfully!");
      onSave(); // Refresh the calendar
      onClose(); // Close the modal
    } catch (error: any) {
      console.error("❌ Error rejecting reservation:", error);
      alert(`❌ Failed to reject reservation: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ SINGLE handleSubmit function - handles FormData from the form
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user || !currentProperty) {
      alert("Missing user or property data");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get form data
      const formData = new FormData(e.currentTarget);
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const guests = parseInt(formData.get("guests") as string) || 1;

      // ✅ Get the dates that were set by ReservationForm
      const startDateStr = formData.get("start_date") as string;
      const endDateStr = formData.get("end_date") as string;

      if (!startDateStr || !endDateStr) {
        throw new Error("Start date and end date are required");
      }

      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid dates provided");
      }

      // Determine status
      const isEditing = !!selectedReservation?.id;
      let status = determineReservationStatus(isEditing);

      if (isEditing && status === null) {
        status = selectedReservation.status || "pending approval";
      }

      // Include companion count in total guests
      const totalGuests =
        guests + companions.filter((c) => c.name.trim()).length;

      const reservationData = {
        user_id: user.id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        title: title,
        description: description || null,
        guests: totalGuests,
        status: status,
        tenant_id: currentProperty.tenant_id || null,
        property_id: currentProperty.id,
        updated_at: new Date().toISOString(),
      };

      if (!isEditing) {
        reservationData.created_at = new Date().toISOString();
      }

      console.log("💾 Saving reservation:", reservationData);

      // Save reservation
      let result;
      if (isEditing) {
        const updateData = { ...reservationData };
        delete updateData.created_at;

        result = await supabase
          .from("reservations")
          .update(updateData)
          .eq("id", selectedReservation.id)
          .select()
          .single();

        // Delete existing companions
        if (result.data) {
          await supabase
            .from("reservation_companions")
            .delete()
            .eq("reservation_id", result.data.id);
        }
      } else {
        result = await supabase
          .from("reservations")
          .insert([reservationData])
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      // Save companions
      if (companions.length > 0 && result.data) {
        const companionsData = companions
          .filter((companion) => companion.name.trim())
          .map((companion) => ({
            reservation_id: result.data.id,
            name: companion.name.trim(),
            email: companion.email?.trim() || null,
            phone: companion.phone?.trim() || null,
            relationship: companion.relationship,
            age_range: companion.age_range,
            invited_to_system: companion.invited_to_system || false,
          }));

        if (companionsData.length > 0) {
          const companionResult = await supabase
            .from("reservation_companions")
            .insert(companionsData);

          if (companionResult.error) {
            console.error(
              "⚠️ Failed to save companions:",
              companionResult.error
            );
          }
        }
      }

      // Send invitations if confirmed
      if (status === "confirmed" && result.data) {
        const invitesSent = await sendGuestInvitations(result.data.id);
        if (invitesSent > 0) {
          console.log(`✅ Sent ${invitesSent} guest invitations`);
        }
      }

      // Create approval request if needed
      if (status === "pending approval" && result.data) {
        await supabase.from("reservation_approvals").insert([
          {
            reservation_id: result.data.id,
            requested_by: user.id,
            status: "pending",
            requested_at: new Date().toISOString(),
          },
        ]);
      }

      // Success message
      let successMessage = "✅ Reservation saved!";
      if (status === "confirmed") {
        const companionCount = companions.filter((c) => c.name.trim()).length;
        const inviteCount = companions.filter(
          (c) => c.name.trim() && c.email && c.invited_to_system
        ).length;

        if (canAutoApprove()) {
          successMessage = `✅ Reservation confirmed automatically!`;
        } else {
          successMessage = "✅ Reservation confirmed!";
        }

        if (companionCount > 0) {
          successMessage += `\n👥 ${companionCount} companion(s) added.`;
        }

        if (inviteCount > 0) {
          successMessage += `\n📧 Sent ${inviteCount} invitation(s).`;
        }
      } else if (status === "pending approval") {
        const companionCount = companions.filter((c) => c.name.trim()).length;
        const inviteCount = companions.filter(
          (c) => c.name.trim() && c.email && c.invited_to_system
        ).length;

        successMessage = "✅ Reservation submitted for approval!";

        if (companionCount > 0) {
          successMessage += `\n👥 ${companionCount} companion(s) will be included.`;
        }

        if (inviteCount > 0) {
          successMessage += `\n📧 ${inviteCount} invitation(s) will be sent once approved.`;
        }
      }

      alert(successMessage);
      onSave();
    } catch (error: any) {
      console.error("❌ Error saving reservation:", error);
      alert(`❌ Failed to save reservation: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose(); // This will close the modal and return to calendar
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedReservation ? "Edit Reservation" : "New Reservation"}
            </h2>
            
            {/* Status Badge */}
            {actualReservation?.status && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                actualReservation.status === 'confirmed' 
                  ? 'bg-green-100 text-green-800'
                  : actualReservation.status === 'pending approval'
                  ? 'bg-yellow-100 text-yellow-800'
                  : actualReservation.status === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {actualReservation.status === 'pending approval' ? 'Pending' : 
                 actualReservation.status.charAt(0).toUpperCase() + actualReservation.status.slice(1)}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Approval Buttons - Only show for pending reservations if user can approve */}
            {actualReservation?.status === "pending approval" && canApproveOthers() && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={handleReject}
                  disabled={isSubmitting}
                  className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  ❌ Reject
                </button>
              </>
            )}
            
            {/* Cancel Button - Only show for existing reservations if user can delete */}
            {actualReservation?.id && canDelete() && (
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                🗑️ Cancel
              </button>
            )}
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          <ReservationForm
            selectedReservation={actualReservation}
            selectedSlot={selectedSlot}
            companions={companions}
            canAutoApprove={canAutoApprove()}
            onAddCompanion={addCompanion}
            onUpdateCompanion={updateCompanion}
            onRemoveCompanion={removeCompanion}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Saving reservation...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
