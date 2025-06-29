import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useProperty } from "@/lib/hooks/useProperty";
import { Reservation } from "../types";
import { statusColors } from "../utils/constants";

export const useReservations = () => {
  const { currentProperty } = useProperty();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReservations = useCallback(async () => {
    try {
      if (!currentProperty) {
        setReservations([]);
        setIsLoading(false);
        return;
      }

      console.log("🔍 Fetching reservations for property:", currentProperty.id);
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          reservation_companions(*)
        `)
        .eq("property_id", currentProperty.id);

      if (error) throw error;

      if (data) {
        const calendarReservations = data.map((reservation) => ({
          id: reservation.id,
          title: `${reservation.title}${
            reservation.reservation_companions?.length > 0
              ? ` (${reservation.reservation_companions.length + 1} people)`
              : ""
          }`,
          start: new Date(reservation.start_date),
          end: new Date(reservation.end_date),
          description: reservation.description,
          guests: reservation.guests || 1,
          status: reservation.status || "pending approval",
          user_id: reservation.user_id,
          companion_count: reservation.reservation_companions?.length || 0,
          companions: reservation.reservation_companions || [],
          allDay: true,
          color:
            statusColors[reservation.status as keyof typeof statusColors] ||
            statusColors.default,
          // ✅ ADD: Include all the original reservation fields
          start_date: reservation.start_date,
          end_date: reservation.end_date,
          tenant_id: reservation.tenant_id,
          property_id: reservation.property_id,
          created_at: reservation.created_at,
          updated_at: reservation.updated_at,
        }));

        setReservations(calendarReservations);
      }
    } catch (error) {
      console.error("❌ Error fetching reservations:", error);
      setReservations([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentProperty]);

  const deleteReservation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Remove from local state
      setReservations(prev => prev.filter(r => r.id !== id));
      
      return { success: true };
    } catch (error) {
      console.error("Error deleting reservation:", error);
      return { success: false, error };
    }
  };

  // Make sure your reservations are being formatted correctly for FullCalendar
  const formattedEvents = reservations.map(reservation => ({
    id: reservation.id,
    title: reservation.title,
    start: reservation.start_date,
    end: reservation.end_date,
    // ✅ Make sure ALL data is in extendedProps so it's available on click
    extendedProps: {
      user_id: reservation.user_id,
      description: reservation.description,
      guests: reservation.guests,
      status: reservation.status,
      tenant_id: reservation.tenant_id,
      property_id: reservation.property_id,
      companion_count: reservation.companion_count,
      created_at: reservation.created_at,
      updated_at: reservation.updated_at,
    }
  }));

  return {
    reservations,
    setReservations, // ✅ EXPORT setReservations function
    isLoading,
    fetchReservations,
    deleteReservation,
    formattedEvents,
  };
};