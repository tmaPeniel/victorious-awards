export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      applications: {
        Row: {
          admin_notes: string | null;
          category_slug: string;
          city: string;
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          phone: string;
          photo_path: string | null;
          status: Database["public"]["Enums"]["application_status"];
          testimony: string;
          updated_at: string;
        };
        Insert: {
          admin_notes?: string | null;
          category_slug: string;
          city: string;
          created_at?: string;
          email: string;
          first_name: string;
          id?: string;
          last_name: string;
          phone: string;
          photo_path?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          testimony: string;
          updated_at?: string;
        };
        Update: {
          admin_notes?: string | null;
          category_slug?: string;
          city?: string;
          created_at?: string;
          email?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          phone?: string;
          photo_path?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          testimony?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          criteria: string[];
          description: string;
          documents: string[];
          id: string;
          image_url: string | null;
          published: boolean;
          slug: string;
          sort_order: number;
          tagline: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          criteria?: string[];
          description?: string;
          documents?: string[];
          id?: string;
          image_url?: string | null;
          published?: boolean;
          slug: string;
          sort_order?: number;
          tagline?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          criteria?: string[];
          description?: string;
          documents?: string[];
          id?: string;
          image_url?: string | null;
          published?: boolean;
          slug?: string;
          sort_order?: number;
          tagline?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      gallery_items: {
        Row: {
          alt: string;
          aspect: string;
          caption: string | null;
          created_at: string;
          id: string;
          image_url: string;
          published: boolean;
          sort_order: number;
          type: string;
          updated_at: string;
        };
        Insert: {
          alt?: string;
          aspect?: string;
          caption?: string | null;
          created_at?: string;
          id?: string;
          image_url: string;
          published?: boolean;
          sort_order?: number;
          type?: string;
          updated_at?: string;
        };
        Update: {
          alt?: string;
          aspect?: string;
          caption?: string | null;
          created_at?: string;
          id?: string;
          image_url?: string;
          published?: boolean;
          sort_order?: number;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ticket_events: {
        Row: {
          id: string;
          slug: string;
          name: string;
          starts_at: string;
          venue: string;
          city: string;
          capacity: number | null;
          booking_enabled: boolean;
          booking_opens_at: string | null;
          booking_closes_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          starts_at: string;
          venue: string;
          city: string;
          capacity?: number | null;
          booking_enabled?: boolean;
          booking_opens_at?: string | null;
          booking_closes_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          starts_at?: string;
          venue?: string;
          city?: string;
          capacity?: number | null;
          booking_enabled?: boolean;
          booking_opens_at?: string | null;
          booking_closes_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ticket_reservations: {
        Row: {
          id: string;
          event_id: string;
          reference: string;
          contact_first_name: string;
          contact_last_name: string;
          contact_email: string;
          contact_phone: string;
          party_size: number;
          status: Database["public"]["Enums"]["ticket_reservation_status"];
          management_token_hash: string;
          idempotency_key: string;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          reference: string;
          contact_first_name: string;
          contact_last_name: string;
          contact_email: string;
          contact_phone: string;
          party_size: number;
          status: Database["public"]["Enums"]["ticket_reservation_status"];
          management_token_hash: string;
          idempotency_key: string;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ticket_reservations"]["Insert"]>;
        Relationships: [];
      };
      ticket_attendees: {
        Row: {
          id: string;
          event_id: string;
          reservation_id: string;
          position: number;
          first_name: string;
          last_name: string;
          email: string;
          ticket_token_hash: string;
          ticket_version: number;
          status: Database["public"]["Enums"]["ticket_attendee_status"];
          checked_in_at: string | null;
          checked_in_by: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          reservation_id: string;
          position: number;
          first_name: string;
          last_name: string;
          email: string;
          ticket_token_hash: string;
          ticket_version?: number;
          status?: Database["public"]["Enums"]["ticket_attendee_status"];
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ticket_attendees"]["Insert"]>;
        Relationships: [];
      };
      ticket_email_log: {
        Row: {
          id: string;
          reservation_id: string;
          attendee_id: string | null;
          kind: string;
          recipient: string;
          provider_id: string | null;
          status: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reservation_id: string;
          attendee_id?: string | null;
          kind: string;
          recipient: string;
          provider_id?: string | null;
          status: string;
          error_message?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ticket_email_log"]["Insert"]>;
        Relationships: [];
      };
      ticket_checkin_audit: {
        Row: {
          id: string;
          attendee_id: string;
          action: string;
          admin_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          attendee_id: string;
          action: string;
          admin_user_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ticket_checkin_audit"]["Insert"]>;
        Relationships: [];
      };
      ticket_rate_limits: {
        Row: { key_hash: string; attempts: number; window_started_at: string };
        Insert: { key_hash: string; attempts?: number; window_started_at?: string };
        Update: { key_hash?: string; attempts?: number; window_started_at?: string };
        Relationships: [];
      };
      testimonials: {
        Row: {
          category_slug: string | null;
          created_at: string;
          edition_year: number;
          full_story: string | null;
          id: string;
          photo_url: string | null;
          published: boolean;
          quote: string;
          sort_order: number;
          type: string;
          updated_at: string;
          video_thumbnail_url: string | null;
          video_url: string | null;
          winner_name: string;
        };
        Insert: {
          category_slug?: string | null;
          created_at?: string;
          edition_year: number;
          full_story?: string | null;
          id?: string;
          photo_url?: string | null;
          published?: boolean;
          quote?: string;
          sort_order?: number;
          type: string;
          updated_at?: string;
          video_thumbnail_url?: string | null;
          video_url?: string | null;
          winner_name: string;
        };
        Update: {
          category_slug?: string | null;
          created_at?: string;
          edition_year?: number;
          full_story?: string | null;
          id?: string;
          photo_url?: string | null;
          published?: boolean;
          quote?: string;
          sort_order?: number;
          type?: string;
          updated_at?: string;
          video_thumbnail_url?: string | null;
          video_url?: string | null;
          winner_name?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_in_ticket: {
        Args: { p_ticket_token_hash: string };
        Returns: Json;
      };
      create_ticket_reservation: {
        Args: {
          p_event_slug: string;
          p_contact_first_name: string;
          p_contact_last_name: string;
          p_contact_email: string;
          p_contact_phone: string;
          p_management_token_hash: string;
          p_idempotency_key: string;
          p_rate_key_hash: string;
          p_attendees: Json;
        };
        Returns: Json;
      };
      get_ticketing_availability: {
        Args: { p_event_slug: string };
        Returns: Json;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      promote_ticket_waitlist: { Args: { p_event_id: string }; Returns: string[] };
      undo_ticket_check_in: { Args: { p_attendee_id: string }; Returns: undefined };
      update_ticket_reservation: {
        Args: {
          p_management_token_hash: string;
          p_contact_first_name: string;
          p_contact_last_name: string;
          p_contact_email: string;
          p_contact_phone: string;
          p_attendees: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      app_role: "admin" | "moderator";
      application_status: "pending" | "reviewing" | "shortlisted" | "rejected" | "winner";
      ticket_attendee_status: "active" | "cancelled" | "checked_in";
      ticket_reservation_status: "confirmed" | "waitlisted" | "cancelled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator"],
      application_status: ["pending", "reviewing", "shortlisted", "rejected", "winner"],
    },
  },
} as const;
