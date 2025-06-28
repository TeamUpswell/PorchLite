import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useProperty } from "@/lib/hooks/useProperty";
import { Reservation } from "../types";

export const useReservations = () => {
  const { currentProperty } = useProperty();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReservations = useCallback(async () => {
    if (!currentProperty?.id) {
      console.log("🔍 No property ID available for fetching reservations");
      setReservations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    console.log("🔍 Fetching reservations for property:", currentProperty.id);

    try {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          reservation_companions(*)
        `)
        .eq("property_id", currentProperty.id)
        .order("start_date", { ascending: true });

      if (error) {
        console.error("❌ Error fetching reservations:", error);
        throw error;
      }

      // ✅ Transform database data to match TypeScript interface
      const transformedReservations: Reservation[] = data?.map((reservation: any) => {
        // ✅ Ensure dates are proper Date objects
        const startDate = new Date(reservation.start_date);
        const endDate = new Date(reservation.end_date);
        
        // ✅ Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.warn("Invalid date found in reservation:", reservation.id, {
            start_date: reservation.start_date,
            end_date: reservation.end_date,
          });
          return null; // Skip invalid reservations
        }

        return {
          // ✅ Don't spread the original reservation - it overwrites our dates!
          id: reservation.id,
          title: reservation.title,
          description: reservation.description,
          guests: reservation.guests,
          status: reservation.status,
          user_id: reservation.user_id,
          tenant_id: reservation.tenant_id,
          property_id: reservation.property_id,
          companion_count: reservation.companion_count || 0,
          created_at: reservation.created_at,
          updated_at: reservation.updated_at,
          
          // ✅ Keep database columns for reference
          start_date: reservation.start_date,
          end_date: reservation.end_date,
          
          // ✅ Add transformed Date objects for React Big Calendar
          start: startDate,
          end: endDate,
          
          // ✅ Transform companions
          companions: reservation.reservation_companions?.map((comp: any) => ({
            id: comp.id,
            name: comp.name,
            email: comp.email,
            phone: comp.phone,
            relationship: comp.relationship,
            age_range: comp.age_range,
            invited_to_system: comp.invited_to_system,
            invite_sent_at: comp.invite_sent_at,
          })) || [],
        };
      }).filter(Boolean) || []; // ✅ Remove null entries

      console.log("✅ Transformed reservations:", transformedReservations.length);
      if (transformedReservations.length > 0) {
        console.log("🔍 Sample reservation dates:", {
          id: transformedReservations[0].id,
          start: transformedReservations[0].start,
          end: transformedReservations[0].end,
          startType: typeof transformedReservations[0].start,
          endType: typeof transformedReservations[0].end,
          isValidStart: transformedReservations[0].start instanceof Date,
          isValidEnd: transformedReservations[0].end instanceof Date,
        });
      }
      setReservations(transformedReservations);
    } catch (error) {
      console.error("❌ Error fetching reservations:", error);
      setError(error as Error);
      setReservations([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentProperty?.id]);

  const deleteReservation = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Remove from local state
      setReservations((prev) => prev.filter((r) => r.id !== id));
      console.log("✅ Reservation deleted:", id);

      return { success: true };
    } catch (error) {
      console.error("❌ Error deleting reservation:", error);
      return { success: false, error };
    }
  }, []);

  return {
    reservations,
    isLoading,
    error,
    fetchReservations,
    deleteReservation,
    setReservations,
  };
};
