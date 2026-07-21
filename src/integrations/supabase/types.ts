export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          admin_notes: string | null
          category_slug: string
          city: string
          civility: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string
          photo_path: string | null
          status: Database["public"]["Enums"]["application_status"]
          testimony: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          category_slug: string
          city: string
          civility: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          phone: string
          photo_path?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          testimony: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          category_slug?: string
          city?: string
          civility?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string
          photo_path?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          testimony?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          criteria: string[]
          description: string
          documents: string[]
          id: string
          image_url: string | null
          published: boolean
          slug: string
          sort_order: number
          tagline: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          criteria?: string[]
          description?: string
          documents?: string[]
          id?: string
          image_url?: string | null
          published?: boolean
          slug: string
          sort_order?: number
          tagline?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          criteria?: string[]
          description?: string
          documents?: string[]
          id?: string
          image_url?: string | null
          published?: boolean
          slug?: string
          sort_order?: number
          tagline?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          alt: string
          aspect: string
          caption: string | null
          created_at: string
          id: string
          image_url: string
          published: boolean
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          alt?: string
          aspect?: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          published?: boolean
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Update: {
          alt?: string
          aspect?: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          published?: boolean
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          category_slug: string | null
          created_at: string
          edition_year: number
          full_story: string | null
          id: string
          photo_url: string | null
          published: boolean
          quote: string
          sort_order: number
          type: string
          updated_at: string
          video_thumbnail_url: string | null
          video_url: string | null
          winner_name: string
        }
        Insert: {
          category_slug?: string | null
          created_at?: string
          edition_year: number
          full_story?: string | null
          id?: string
          photo_url?: string | null
          published?: boolean
          quote?: string
          sort_order?: number
          type: string
          updated_at?: string
          video_thumbnail_url?: string | null
          video_url?: string | null
          winner_name: string
        }
        Update: {
          category_slug?: string | null
          created_at?: string
          edition_year?: number
          full_story?: string | null
          id?: string
          photo_url?: string | null
          published?: boolean
          quote?: string
          sort_order?: number
          type?: string
          updated_at?: string
          video_thumbnail_url?: string | null
          video_url?: string | null
          winner_name?: string
        }
        Relationships: []
      }
      ticket_attendees: {
        Row: {
          cancelled_at: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          email: string
          event_id: string
          first_name: string
          id: string
          last_name: string
          position: number
          reservation_id: string
          status: Database["public"]["Enums"]["ticket_attendee_status"]
          ticket_token_hash: string
          ticket_version: number
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          email: string
          event_id: string
          first_name: string
          id?: string
          last_name: string
          position: number
          reservation_id: string
          status?: Database["public"]["Enums"]["ticket_attendee_status"]
          ticket_token_hash: string
          ticket_version?: number
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          email?: string
          event_id?: string
          first_name?: string
          id?: string
          last_name?: string
          position?: number
          reservation_id?: string
          status?: Database["public"]["Enums"]["ticket_attendee_status"]
          ticket_token_hash?: string
          ticket_version?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_attendees_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "ticket_reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_checkin_audit: {
        Row: {
          action: string
          admin_user_id: string
          attendee_id: string
          created_at: string
          id: string
        }
        Insert: {
          action: string
          admin_user_id: string
          attendee_id: string
          created_at?: string
          id?: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          attendee_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_checkin_audit_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "ticket_attendees"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_email_log: {
        Row: {
          attendee_id: string | null
          created_at: string
          error_message: string | null
          id: string
          kind: string
          provider_id: string | null
          recipient: string
          reservation_id: string
          status: string
        }
        Insert: {
          attendee_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          kind: string
          provider_id?: string | null
          recipient: string
          reservation_id: string
          status: string
        }
        Update: {
          attendee_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          kind?: string
          provider_id?: string | null
          recipient?: string
          reservation_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_email_log_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "ticket_attendees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_email_log_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "ticket_reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_events: {
        Row: {
          booking_closes_at: string | null
          booking_enabled: boolean
          booking_opens_at: string | null
          capacity: number | null
          city: string
          created_at: string
          id: string
          name: string
          slug: string
          starts_at: string
          updated_at: string
          venue: string
        }
        Insert: {
          booking_closes_at?: string | null
          booking_enabled?: boolean
          booking_opens_at?: string | null
          capacity?: number | null
          city: string
          created_at?: string
          id?: string
          name: string
          slug: string
          starts_at: string
          updated_at?: string
          venue: string
        }
        Update: {
          booking_closes_at?: string | null
          booking_enabled?: boolean
          booking_opens_at?: string | null
          capacity?: number | null
          city?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
          starts_at?: string
          updated_at?: string
          venue?: string
        }
        Relationships: []
      }
      ticket_rate_limits: {
        Row: {
          attempts: number
          key_hash: string
          window_started_at: string
        }
        Insert: {
          attempts?: number
          key_hash: string
          window_started_at?: string
        }
        Update: {
          attempts?: number
          key_hash?: string
          window_started_at?: string
        }
        Relationships: []
      }
      ticket_reservations: {
        Row: {
          cancelled_at: string | null
          contact_email: string
          contact_first_name: string
          contact_last_name: string
          contact_phone: string
          created_at: string
          event_id: string
          id: string
          idempotency_key: string
          management_token_hash: string
          party_size: number
          reference: string
          status: Database["public"]["Enums"]["ticket_reservation_status"]
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          contact_email: string
          contact_first_name: string
          contact_last_name: string
          contact_phone: string
          created_at?: string
          event_id: string
          id?: string
          idempotency_key: string
          management_token_hash: string
          party_size: number
          reference: string
          status: Database["public"]["Enums"]["ticket_reservation_status"]
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          contact_email?: string
          contact_first_name?: string
          contact_last_name?: string
          contact_phone?: string
          created_at?: string
          event_id?: string
          id?: string
          idempotency_key?: string
          management_token_hash?: string
          party_size?: number
          reference?: string
          status?: Database["public"]["Enums"]["ticket_reservation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_reservations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ticket_events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_in_ticket: { Args: { p_ticket_token_hash: string }; Returns: Json }
      create_ticket_reservation: {
        Args: {
          p_attendees: Json
          p_contact_email: string
          p_contact_first_name: string
          p_contact_last_name: string
          p_contact_phone: string
          p_event_slug: string
          p_idempotency_key: string
          p_management_token_hash: string
          p_rate_key_hash: string
        }
        Returns: Json
      }
      get_ticketing_availability: {
        Args: { p_event_slug: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      promote_ticket_waitlist: {
        Args: { p_event_id: string }
        Returns: string[]
      }
      undo_ticket_check_in: {
        Args: { p_attendee_id: string }
        Returns: undefined
      }
      update_ticket_reservation: {
        Args: {
          p_attendees: Json
          p_contact_email: string
          p_contact_first_name: string
          p_contact_last_name: string
          p_contact_phone: string
          p_management_token_hash: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator"
      application_status:
        | "pending"
        | "reviewing"
        | "shortlisted"
        | "rejected"
        | "winner"
      ticket_attendee_status: "active" | "cancelled" | "checked_in"
      ticket_reservation_status: "confirmed" | "waitlisted" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator"],
      application_status: [
        "pending",
        "reviewing",
        "shortlisted",
        "rejected",
        "winner",
      ],
      ticket_attendee_status: ["active", "cancelled", "checked_in"],
      ticket_reservation_status: ["confirmed", "waitlisted", "cancelled"],
    },
  },
} as const
