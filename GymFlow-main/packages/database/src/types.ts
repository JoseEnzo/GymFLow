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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      academies: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          cnpj: string | null
          cover_url: string | null
          created_at: string
          email: string | null
          id: string
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          opening_hours: Json | null
          owner_id: string
          phone: string | null
          photos: string[] | null
          place_id: string | null
          plan: Database["public"]["Enums"]["academy_plan"]
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          cnpj?: string | null
          cover_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          opening_hours?: Json | null
          owner_id: string
          phone?: string | null
          photos?: string[] | null
          place_id?: string | null
          plan?: Database["public"]["Enums"]["academy_plan"]
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          cnpj?: string | null
          cover_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string
          phone?: string | null
          photos?: string[] | null
          place_id?: string | null
          plan?: Database["public"]["Enums"]["academy_plan"]
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      academy_members: {
        Row: {
          academy_id: string
          created_at: string
          id: string
          invited_by: string | null
          is_active: boolean
          joined_at: string | null
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          academy_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string | null
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          academy_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_members_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_completions: {
        Row: {
          academy_id: string
          completed_on: string
          created_at: string
          id: string
          sheet_id: string
          student_id: string
        }
        Insert: {
          academy_id: string
          completed_on?: string
          created_at?: string
          id?: string
          sheet_id: string
          student_id: string
        }
        Update: {
          academy_id?: string
          completed_on?: string
          created_at?: string
          id?: string
          sheet_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_completions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_completions_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "workout_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      bioimpedance_assessments: {
        Row: {
          academy_id: string
          assessed_at: string
          bmi: number | null
          body_fat_pct: number | null
          body_water_pct: number | null
          bone_mass_kg: number | null
          created_at: string
          id: string
          metabolic_age: number | null
          muscle_mass_kg: number | null
          notes: string | null
          personal_id: string
          student_id: string
          visceral_fat: number | null
          weight_kg: number | null
        }
        Insert: {
          academy_id: string
          assessed_at?: string
          bmi?: number | null
          body_fat_pct?: number | null
          body_water_pct?: number | null
          bone_mass_kg?: number | null
          created_at?: string
          id?: string
          metabolic_age?: number | null
          muscle_mass_kg?: number | null
          notes?: string | null
          personal_id: string
          student_id: string
          visceral_fat?: number | null
          weight_kg?: number | null
        }
        Update: {
          academy_id?: string
          assessed_at?: string
          bmi?: number | null
          body_fat_pct?: number | null
          body_water_pct?: number | null
          bone_mass_kg?: number | null
          created_at?: string
          id?: string
          metabolic_age?: number | null
          muscle_mass_kg?: number | null
          notes?: string | null
          personal_id?: string
          student_id?: string
          visceral_fat?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bioimpedance_assessments_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      body_measurements: {
        Row: {
          abdomen_cm: number | null
          academy_id: string
          arm_left_cm: number | null
          arm_right_cm: number | null
          calf_left_cm: number | null
          calf_right_cm: number | null
          chest_cm: number | null
          created_at: string
          forearm_left_cm: number | null
          forearm_right_cm: number | null
          hip_cm: number | null
          id: string
          measured_at: string
          neck_cm: number | null
          notes: string | null
          personal_id: string
          shoulder_cm: number | null
          student_id: string
          thigh_left_cm: number | null
          thigh_right_cm: number | null
          waist_cm: number | null
        }
        Insert: {
          abdomen_cm?: number | null
          academy_id: string
          arm_left_cm?: number | null
          arm_right_cm?: number | null
          calf_left_cm?: number | null
          calf_right_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          forearm_left_cm?: number | null
          forearm_right_cm?: number | null
          hip_cm?: number | null
          id?: string
          measured_at?: string
          neck_cm?: number | null
          notes?: string | null
          personal_id: string
          shoulder_cm?: number | null
          student_id: string
          thigh_left_cm?: number | null
          thigh_right_cm?: number | null
          waist_cm?: number | null
        }
        Update: {
          abdomen_cm?: number | null
          academy_id?: string
          arm_left_cm?: number | null
          arm_right_cm?: number | null
          calf_left_cm?: number | null
          calf_right_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          forearm_left_cm?: number | null
          forearm_right_cm?: number | null
          hip_cm?: number | null
          id?: string
          measured_at?: string
          neck_cm?: number | null
          notes?: string | null
          personal_id?: string
          shoulder_cm?: number | null
          student_id?: string
          thigh_left_cm?: number | null
          thigh_right_cm?: number | null
          waist_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_measurements_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          academy_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: Database["public"]["Enums"]["exercise_difficulty"]
          equipment: string[]
          id: string
          image_url: string | null
          instructions: string[] | null
          is_global: boolean
          muscle_groups: string[]
          name: string
          name_pt: string
          video_url: string | null
        }
        Insert: {
          academy_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["exercise_difficulty"]
          equipment?: string[]
          id?: string
          image_url?: string | null
          instructions?: string[] | null
          is_global?: boolean
          muscle_groups?: string[]
          name: string
          name_pt: string
          video_url?: string | null
        }
        Update: {
          academy_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["exercise_difficulty"]
          equipment?: string[]
          id?: string
          image_url?: string | null
          instructions?: string[] | null
          is_global?: boolean
          muscle_groups?: string[]
          name?: string
          name_pt?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          academy_id: string
          code: string
          created_at: string
          created_by: string
          email: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["member_role"]
          token: string
          uses_count: number
          uses_limit: number | null
        }
        Insert: {
          academy_id: string
          code: string
          created_at?: string
          created_by: string
          email?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["member_role"]
          token?: string
          uses_count?: number
          uses_limit?: number | null
        }
        Update: {
          academy_id?: string
          code?: string
          created_at?: string
          created_by?: string
          email?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["member_role"]
          token?: string
          uses_count?: number
          uses_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          cpf: string | null
          cref: string | null
          created_at: string
          email: string | null
          full_name: string | null
          gender: string | null
          goal: string | null
          height_cm: number | null
          id: string
          phone: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          cpf?: string | null
          cref?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          goal?: string | null
          height_cm?: number | null
          id: string
          phone?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          cpf?: string | null
          cref?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          goal?: string | null
          height_cm?: number | null
          id?: string
          phone?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      set_logs: {
        Row: {
          created_at: string
          duration_seconds: number | null
          exercise_id: string
          id: string
          is_completed: boolean
          notes: string | null
          reps_done: number
          set_number: number
          sheet_exercise_id: string
          weight_kg: number | null
          workout_log_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          exercise_id: string
          id?: string
          is_completed?: boolean
          notes?: string | null
          reps_done?: number
          set_number: number
          sheet_exercise_id: string
          weight_kg?: number | null
          workout_log_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          exercise_id?: string
          id?: string
          is_completed?: boolean
          notes?: string | null
          reps_done?: number
          set_number?: number
          sheet_exercise_id?: string
          weight_kg?: number | null
          workout_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_sheet_exercise_id_fkey"
            columns: ["sheet_exercise_id"]
            isOneToOne: false
            referencedRelation: "sheet_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          order_index: number
          reps: string
          rest_seconds: number
          rpe_target: number | null
          sets: number
          sheet_id: string
          weight_suggestion: number | null
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          order_index?: number
          reps?: string
          rest_seconds?: number
          rpe_target?: number | null
          sets?: number
          sheet_id: string
          weight_suggestion?: number | null
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number
          reps?: string
          rest_seconds?: number
          rpe_target?: number | null
          sets?: number
          sheet_id?: string
          weight_suggestion?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sheet_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheet_exercises_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "workout_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_processed_events: {
        Row: {
          event_id: string
          processed_at: string
        }
        Insert: {
          event_id: string
          processed_at?: string
        }
        Update: {
          event_id?: string
          processed_at?: string
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          academy_id: string
          client_id: string | null
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          notes: string | null
          perceived_effort: number | null
          rating: number | null
          sheet_id: string | null
          student_id: string
          workout_type: string | null
        }
        Insert: {
          academy_id: string
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          perceived_effort?: number | null
          rating?: number | null
          sheet_id?: string | null
          student_id: string
          workout_type?: string | null
        }
        Update: {
          academy_id?: string
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          perceived_effort?: number | null
          rating?: number | null
          sheet_id?: string | null
          student_id?: string
          workout_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "workout_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sheets: {
        Row: {
          academy_id: string
          created_at: string
          description: string | null
          goal: string | null
          id: string
          is_active: boolean
          name: string
          order_index: number
          personal_id: string
          scheduled_days: number[]
          student_id: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          academy_id: string
          created_at?: string
          description?: string | null
          goal?: string | null
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          personal_id: string
          scheduled_days?: number[]
          student_id: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          academy_id?: string
          created_at?: string
          description?: string | null
          goal?: string | null
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          personal_id?: string
          scheduled_days?: number[]
          student_id?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sheets_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: {
        Args: { p_token: string; p_user_id: string }
        Returns: {
          academy_id: string
          academy_name: string
          academy_slug: string
          role: Database["public"]["Enums"]["member_role"]
        }[]
      }
      can_manage_personals: { Args: { p_academy_id: string }; Returns: boolean }
      complete_workout: {
        Args: {
          p_academy_id: string
          p_client_id?: string
          p_duration_seconds: number
          p_set_logs: Json
          p_sheet_id: string
        }
        Returns: string
      }
      generate_academy_slug: { Args: { name: string }; Returns: string }
      get_user_academy_ids: { Args: never; Returns: string[] }
      get_user_role_in_academy: {
        Args: { p_academy_id: string }
        Returns: Database["public"]["Enums"]["member_role"]
      }
      list_academy_students: {
        Args: {
          p_academy_id: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_status?: string
        }
        Returns: {
          active_sheets: number
          full_name: string
          goal: string
          is_active: boolean
          last_workout: string
          total_count: number
          total_workouts: number
          user_id: string
        }[]
      }
    }
    Enums: {
      academy_plan: "free" | "starter" | "pro"
      exercise_difficulty: "beginner" | "intermediate" | "advanced"
      member_role: "owner" | "personal" | "student"
      subscription_status: "active" | "canceled" | "past_due" | "trialing"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      academy_plan: ["free", "starter", "pro"],
      exercise_difficulty: ["beginner", "intermediate", "advanced"],
      member_role: ["owner", "personal", "student"],
      subscription_status: ["active", "canceled", "past_due", "trialing"],
    },
  },
} as const
