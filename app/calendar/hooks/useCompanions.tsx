import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Companion } from "../types";

export const useCompanions = () => {
  const [companions, setCompanions] = useState<Companion[]>([]);

  const addCompanion = () => {
    const newCompanion: Companion = {
      name: "",
      email: "",
      phone: "",
      relationship: "friend",
      age_range: "adult",
      invited_to_system: false,
    };
    setCompanions([...companions, newCompanion]);
  };

  const updateCompanion = (
    index: number,
    field: keyof Companion,
    value: string | boolean
  ) => {
    const updatedCompanions = companions.map((companion, i) =>
      i === index ? { ...companion, [field]: value } : companion
    );
    setCompanions(updatedCompanions);
  };

  const removeCompanion = (index: number) => {
    setCompanions(companions.filter((_, i) => i !== index));
  };

  const clearCompanions = () => {
    setCompanions([]);
  };

  const fetchCompanions = async (reservationId: string) => {
    try {
      const { data, error } = await supabase
        .from("reservation_companions")
        .select("*")
        .eq("reservation_id", reservationId);

      if (error) throw error;

      if (data) {
        setCompanions(
          data.map((companion) => ({
            id: companion.id,
            name: companion.name,
            email: companion.email || "",
            phone: companion.phone || "",
            relationship: companion.relationship,
            age_range: companion.age_range,
            invited_to_system: companion.invited_to_system,
            invite_sent_at: companion.invite_sent_at,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching companions:", error);
    }
  };

  const sendGuestInvitations = async (reservationId: string) => {
    try {
      const { data: companionsToInvite, error } = await supabase
        .from('reservation_companions')
        .select('*')
        .eq('reservation_id', reservationId)
        .eq('invited_to_system', true)
        .is('invite_sent_at', null)
        .not('email', 'is', null);

      if (error) throw error;

      if (companionsToInvite && companionsToInvite.length > 0) {
        console.log(`📧 Sending invitations to ${companionsToInvite.length} companions`);

        const invitePromises = companionsToInvite.map(async (companion) => {
          try {
            await sendGuestInvitation(companion.email, companion.name, reservationId);
            
            await supabase
              .from('reservation_companions')
              .update({ invite_sent_at: new Date().toISOString() })
              .eq('id', companion.id);

            console.log(`✅ Invitation sent to ${companion.name}`);
          } catch (error) {
            console.error(`❌ Failed to send invitation to ${companion.name}:`, error);
          }
        });

        await Promise.all(invitePromises);
        return companionsToInvite.length;
      }
      
      return 0;
    } catch (error) {
      console.error('Error sending guest invitations:', error);
      return 0;
    }
  };

  const sendGuestInvitation = async (email: string, name: string, reservationId: string) => {
    console.log(`📧 Sending invitation to ${name} (${email}) for reservation ${reservationId}`);
    
    // TODO: Implement actual email sending
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`✅ Simulated email sent to ${email}`);
        resolve(true);
      }, 1000);
    });
  };

  return {
    companions,
    addCompanion,
    updateCompanion,
    removeCompanion,
    clearCompanions,
    fetchCompanions,
    sendGuestInvitations,
  };
};