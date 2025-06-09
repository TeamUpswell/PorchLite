export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      auth_users_view: {
        Row: {
          id: string | null;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          email_confirmed_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string | null;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          email_confirmed_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string | null;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          email_confirmed_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      cleaning_checklist_items: {
        Row: {
          id: string;
          checklist_id: string | null;
          title: string;
          description: string | null;
          order_index: number | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          checklist_id?: string | null;
          title: string;
          description?: string | null;
          order_index?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          checklist_id?: string | null;
          title?: string;
          description?: string | null;
          order_index?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      cleaning_checklists: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_by: string | null;
          created_at: string | null;
          property_id: string;
        };
        Insert: {
          id: string;
          name: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string | null;
          property_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string | null;
          property_id?: string;
        };
        Relationships: [];
      };
      cleaning_issues: {
        Row: {
          id: string;
          property_id: string | null;
          description: string;
          severity: string;
          location: string;
          photo_urls: string[] | null;
          reported_by: string | null;
          reported_at: string | null;
          is_resolved: boolean | null;
          resolved_by: string | null;
          resolved_at: string | null;
          notes: string | null;
          status: string | null;
          category: string | null;
        };
        Insert: {
          id?: string;
          property_id?: string | null;
          description: string;
          severity: string;
          location: string;
          photo_urls?: string[] | null;
          reported_by?: string | null;
          reported_at?: string | null;
          is_resolved?: boolean | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          notes?: string | null;
          status?: string | null;
          category?: string | null;
        };
        Update: {
          id?: string;
          property_id?: string | null;
          description?: string;
          severity?: string;
          location?: string;
          photo_urls?: string[] | null;
          reported_by?: string | null;
          reported_at?: string | null;
          is_resolved?: boolean | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          notes?: string | null;
          status?: string | null;
          category?: string | null;
        };
        Relationships: [];
      };
      cleaning_room_types: {
        Row: {
          id: string;
          property_id: string | null;
          name: string;
          slug: string;
          icon: string | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          property_id?: string | null;
          name: string;
          slug: string;
          icon?: string | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          property_id?: string | null;
          name?: string;
          slug?: string;
          icon?: string | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      cleaning_tasks: {
        Row: {
          id: string;
          property_id: string | null;
          room: string;
          task: string;
          is_completed: boolean | null;
          completed_by: string | null;
          completed_at: string | null;
          created_at: string | null;
          updated_at: string | null;
          name: string | null;
          photo_url: string | null;
          description: string | null;
          display_order: number | null;
        };
        Insert: {
          id?: string;
          property_id?: string | null;
          room: string;
          task: string;
          is_completed?: boolean | null;
          completed_by?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          name?: string | null;
          photo_url?: string | null;
          description?: string | null;
          display_order?: number | null;
        };
        Update: {
          id?: string;
          property_id?: string | null;
          room?: string;
          task?: string;
          is_completed?: boolean | null;
          completed_by?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          name?: string | null;
          photo_url?: string | null;
          description?: string | null;
          display_order?: number | null;
        };
        Relationships: [];
      };
      cleaning_visit_tasks: {
        Row: {
          id: string;
          visit_id: string | null;
          task_id: string | null;
          is_completed: boolean | null;
          completed_by: string | null;
          completed_at: string | null;
          photo_url: string | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          visit_id?: string | null;
          task_id?: string | null;
          is_completed?: boolean | null;
          completed_by?: string | null;
          completed_at?: string | null;
          photo_url?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          visit_id?: string | null;
          task_id?: string | null;
          is_completed?: boolean | null;
          completed_by?: string | null;
          completed_at?: string | null;
          photo_url?: string | null;
          notes?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      cleaning_visits: {
        Row: {
          id: string;
          property_id: string | null;
          reservation_id: string | null;
          visit_date: string;
          notes: string | null;
          status: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          property_id?: string | null;
          reservation_id?: string | null;
          visit_date: string;
          notes?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          property_id?: string | null;
          reservation_id?: string | null;
          visit_date?: string;
          notes?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          id: string;
          name: string;
          role: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          description: string | null;
          website: string | null;
          priority: number;
          created_at: string | null;
          updated_at: string | null;
          created_by: string | null;
          property_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          role: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          description?: string | null;
          website?: string | null;
          priority?: number;
          created_at?: string | null;
          updated_at?: string | null;
          created_by?: string | null;
          property_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          role?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          description?: string | null;
          website?: string | null;
          priority?: number;
          created_at?: string | null;
          updated_at?: string | null;
          created_by?: string | null;
          property_id?: string;
        };
        Relationships: [];
      };
      default_staples: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          default_threshold: number | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          default_threshold?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string | null;
          default_threshold?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      guest_book_entries: {
        Row: {
          id: string;
          property_id: string | null;
          reservation_id: string | null;
          guest_name: string;
          guest_email: string | null;
          visit_date: string;
          rating: number | null;
          title: string | null;
          message: string | null;
          is_public: boolean | null;
          is_approved: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          everything_was_great: boolean | null;
          everything_well_stocked: boolean | null;
          number_of_nights: number | null;
          photos: string[] | null;
          photo_captions: string[] | null;
          status: string | null;
        };
        Insert: {
          id?: string;
          property_id?: string | null;
          reservation_id?: string | null;
          guest_name: string;
          guest_email?: string | null;
          visit_date: string;
          rating?: number | null;
          title?: string | null;
          message?: string | null;
          is_public?: boolean | null;
          is_approved?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          everything_was_great?: boolean | null;
          everything_well_stocked?: boolean | null;
          number_of_nights?: number | null;
          photos?: string[] | null;
          photo_captions?: string[] | null;
          status?: string | null;
        };
        Update: {
          id?: string;
          property_id?: string | null;
          reservation_id?: string | null;
          guest_name?: string;
          guest_email?: string | null;
          visit_date?: string;
          rating?: number | null;
          title?: string | null;
          message?: string | null;
          is_public?: boolean | null;
          is_approved?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          everything_was_great?: boolean | null;
          everything_well_stocked?: boolean | null;
          number_of_nights?: number | null;
          photos?: string[] | null;
          photo_captions?: string[] | null;
          status?: string | null;
        };
        Relationships: [];
      };
      inventory: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          quantity: number;
          threshold: number;
          last_updated_by: string | null;
          created_at: string | null;
          updated_at: string | null;
          user_id: string | null;
          property_id: string;
          item_type: string | null;
          display_order: number | null;
          is_active: boolean | null;
          status: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          quantity?: number;
          threshold?: number;
          last_updated_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          property_id: string;
          item_type?: string | null;
          display_order?: number | null;
          is_active?: boolean | null;
          status?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string | null;
          quantity?: number;
          threshold?: number;
          last_updated_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          property_id?: string;
          item_type?: string | null;
          display_order?: number | null;
          is_active?: boolean | null;
          status?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone_number: string | null;
          email: string | null;
          avatar_url: string | null;
          created_at: string | null;
          updated_at: string | null;
          address: string | null;
          show_in_contacts: boolean | null;
          role: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone_number?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          address?: string | null;
          show_in_contacts?: boolean | null;
          role?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone_number?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          address?: string | null;
          show_in_contacts?: boolean | null;
          role?: string | null;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          id: string;
          name: string | null;
          address: string | null;
          description: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          main_photo_url: string | null;
          is_active: boolean | null;
          property_type: string | null;
          bedrooms: number | null;
          bathrooms: number | null;
          max_occupancy: number | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          country: string | null;
          latitude: number | null;
          longitude: number | null;
          neighborhood_description: string | null;
          wifi_name: string | null;
          wifi_password: string | null;
          check_in_instructions: string | null;
          check_out_instructions: string | null;
          house_rules: string | null;
          security_info: string | null;
          parking_info: string | null;
          amenities: string[] | null;
          tenant_id: string;
          header_image_url: string | null;
          updated_by: string | null;
          house_tour_enabled: boolean | null;
        };
        Insert: {
          id?: string;
          name?: string | null;
          address?: string | null;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          main_photo_url?: string | null;
          is_active?: boolean | null;
          property_type?: string | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          max_occupancy?: number | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          neighborhood_description?: string | null;
          wifi_name?: string | null;
          wifi_password?: string | null;
          check_in_instructions?: string | null;
          check_out_instructions?: string | null;
          house_rules?: string | null;
          security_info?: string | null;
          parking_info?: string | null;
          amenities?: string[] | null;
          tenant_id: string;
          header_image_url?: string | null;
          updated_by?: string | null;
          house_tour_enabled?: boolean | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          address?: string | null;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          main_photo_url?: string | null;
          is_active?: boolean | null;
          property_type?: string | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          max_occupancy?: number | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          neighborhood_description?: string | null;
          wifi_name?: string | null;
          wifi_password?: string | null;
          check_in_instructions?: string | null;
          check_out_instructions?: string | null;
          house_rules?: string | null;
          security_info?: string | null;
          parking_info?: string | null;
          amenities?: string[] | null;
          tenant_id?: string;
          header_image_url?: string | null;
          updated_by?: string | null;
          house_tour_enabled?: boolean | null;
        };
        Relationships: [];
      };
      reservations: {
        Row: {
          id: string;
          user_id: string | null;
          start_date: string;
          end_date: string;
          title: string;
          description: string | null;
          created_at: string | null;
          updated_at: string | null;
          guests: number | null;
          status: string | null;
          tenant_id: string | null;
          property_id: string | null;
          companion_count: number | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          start_date: string;
          end_date: string;
          title: string;
          description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          guests?: number | null;
          status?: string | null;
          tenant_id?: string | null;
          property_id?: string | null;
          companion_count?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          start_date?: string;
          end_date?: string;
          title?: string;
          description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          guests?: number | null;
          status?: string | null;
          tenant_id?: string | null;
          property_id?: string | null;
          companion_count?: number | null;
        };
        Relationships: [];
      };
      tenant_users: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          role: string;
          invited_by: string | null;
          invited_at: string | null;
          joined_at: string | null;
          status: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          role?: string;
          invited_by?: string | null;
          invited_at?: string | null;
          joined_at?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          role?: string;
          invited_by?: string | null;
          invited_at?: string | null;
          joined_at?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never;
