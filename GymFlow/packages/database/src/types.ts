export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      academies: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          slug: string
          cnpj: string | null
          email: string | null
          phone: string | null
          address_street: string | null
          address_number: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_city: string | null
          address_state: string | null
          address_zip: string | null
          logo_url: string | null
          cover_url: string | null
          photos: string[] | null
          place_id: string | null
          latitude: number | null
          longitude: number | null
          opening_hours: Json | null
          plan: 'free' | 'starter' | 'pro'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing' | null
          trial_ends_at: string | null
          owner_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          slug: string
          cnpj?: string | null
          email?: string | null
          phone?: string | null
          address_street?: string | null
          address_number?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_city?: string | null
          address_state?: string | null
          address_zip?: string | null
          logo_url?: string | null
          cover_url?: string | null
          photos?: string[] | null
          place_id?: string | null
          latitude?: number | null
          longitude?: number | null
          opening_hours?: Json | null
          plan?: 'free' | 'starter' | 'pro'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing' | null
          trial_ends_at?: string | null
          owner_id: string
        }
        Update: Partial<Database['public']['Tables']['academies']['Insert']>
      }

      academy_members: {
        Row: {
          id: string
          created_at: string
          academy_id: string
          user_id: string
          role: 'owner' | 'personal' | 'student'
          is_active: boolean
          invited_by: string | null
          joined_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          academy_id: string
          user_id: string
          role: 'owner' | 'personal' | 'student'
          is_active?: boolean
          invited_by?: string | null
          joined_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['academy_members']['Insert']>
      }

      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          birth_date: string | null
          gender: 'male' | 'female' | 'other' | null
          height_cm: number | null
          weight_kg: number | null
          goal: string | null
          bio: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          birth_date?: string | null
          gender?: 'male' | 'female' | 'other' | null
          height_cm?: number | null
          weight_kg?: number | null
          goal?: string | null
          bio?: string | null
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }

      invites: {
        Row: {
          id: string
          created_at: string
          expires_at: string | null
          academy_id: string
          created_by: string
          code: string
          token: string
          role: 'personal' | 'student'
          uses_limit: number | null
          uses_count: number
          is_active: boolean
          email: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          expires_at?: string | null
          academy_id: string
          created_by: string
          code: string
          token?: string
          role?: 'personal' | 'student'
          uses_limit?: number | null
          uses_count?: number
          is_active?: boolean
          email?: string | null
        }
        Update: Partial<Database['public']['Tables']['invites']['Insert']>
      }

      exercises: {
        Row: {
          id: string
          created_at: string
          name: string
          name_pt: string
          description: string | null
          muscle_groups: string[]
          equipment: string[]
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          video_url: string | null
          image_url: string | null
          instructions: string[] | null
          is_global: boolean
          created_by: string | null
          academy_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          name_pt: string
          description?: string | null
          muscle_groups?: string[]
          equipment?: string[]
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          video_url?: string | null
          image_url?: string | null
          instructions?: string[] | null
          is_global?: boolean
          created_by?: string | null
          academy_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['exercises']['Insert']>
      }

      workout_sheets: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          academy_id: string
          student_id: string
          personal_id: string
          name: string
          goal: string | null
          description: string | null
          is_active: boolean
          valid_until: string | null
          order_index: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          academy_id: string
          student_id: string
          personal_id: string
          name: string
          goal?: string | null
          description?: string | null
          is_active?: boolean
          valid_until?: string | null
          order_index?: number
        }
        Update: Partial<Database['public']['Tables']['workout_sheets']['Insert']>
      }

      sheet_exercises: {
        Row: {
          id: string
          created_at: string
          sheet_id: string
          exercise_id: string
          order_index: number
          sets: number
          reps: string
          rest_seconds: number
          notes: string | null
          weight_suggestion: number | null
          rpe_target: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          sheet_id: string
          exercise_id: string
          order_index?: number
          sets?: number
          reps?: string
          rest_seconds?: number
          notes?: string | null
          weight_suggestion?: number | null
          rpe_target?: number | null
        }
        Update: Partial<Database['public']['Tables']['sheet_exercises']['Insert']>
      }

      workout_logs: {
        Row: {
          id: string
          created_at: string
          completed_at: string | null
          student_id: string
          sheet_id: string
          academy_id: string
          duration_seconds: number | null
          notes: string | null
          rating: number | null
          perceived_effort: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          completed_at?: string | null
          student_id: string
          sheet_id: string
          academy_id: string
          duration_seconds?: number | null
          notes?: string | null
          rating?: number | null
          perceived_effort?: number | null
        }
        Update: Partial<Database['public']['Tables']['workout_logs']['Insert']>
      }

      set_logs: {
        Row: {
          id: string
          created_at: string
          workout_log_id: string
          sheet_exercise_id: string
          exercise_id: string
          set_number: number
          reps_done: number
          weight_kg: number | null
          duration_seconds: number | null
          notes: string | null
          is_completed: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          workout_log_id: string
          sheet_exercise_id: string
          exercise_id: string
          set_number: number
          reps_done?: number
          weight_kg?: number | null
          duration_seconds?: number | null
          notes?: string | null
          is_completed?: boolean
        }
        Update: Partial<Database['public']['Tables']['set_logs']['Insert']>
      }
    }

    Views: {
      [_ in never]: never
    }

    Functions: {
      get_user_academy_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_user_role_in_academy: {
        Args: { academy_id: string }
        Returns: 'owner' | 'personal' | 'student' | null
      }
    }

    Enums: {
      academy_plan: 'free' | 'starter' | 'pro'
      member_role: 'owner' | 'personal' | 'student'
      exercise_difficulty: 'beginner' | 'intermediate' | 'advanced'
      subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing'
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
