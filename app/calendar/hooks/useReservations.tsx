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

  const deleteReservation = async (reservationId: string) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", reservationId);

      if (error) throw error;
      
      await fetchReservations();
      return true;
    } catch (error) {
      console.error("Error deleting reservation:", error);
      return false;
    }
  };

  return {
    reservations,
    isLoading,
    fetchReservations,
    deleteReservation,
  };
};