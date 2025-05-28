import { supabase } from './supabase';

export const createCleaningVisitForReservation = async (reservationId: string) => {
  try {
    // Get the reservation details
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('id, property_id, start_date')
      .eq('id', reservationId)
      .single();
      
    if (reservationError) throw reservationError;
    
    // Create a new cleaning visit linked to the reservation
    const { data, error } = await supabase
      .from('cleaning_visits')
      .insert([{
        property_id: reservation.property_id,
        reservation_id: reservationId,
        visit_date: reservation.start_date,
        status: 'in_progress'
      }])
      .select();
      
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error("Error creating cleaning visit:", error);
    throw error;
  }
};