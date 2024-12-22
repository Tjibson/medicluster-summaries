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
      auth_config: {
        Row: {
          enable_signup: boolean | null
          id: string
          updated_at: string
        }
        Insert: {
          enable_signup?: boolean | null
          id?: string
          updated_at?: string
        }
        Update: {
          enable_signup?: boolean | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      github_repos: {
        Row: {
          branch: string | null
          created_at: string
          id: string
          is_scraper: boolean | null
          last_sync_at: string | null
          repo_url: string
          user_id: string
        }
        Insert: {
          branch?: string | null
          created_at?: string
          id?: string
          is_scraper?: boolean | null
          last_sync_at?: string | null
          repo_url: string
          user_id: string
        }
        Update: {
          branch?: string | null
          created_at?: string
          id?: string
          is_scraper?: boolean | null
          last_sync_at?: string | null
          repo_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_repos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_journals: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      report_schedules: {
        Row: {
          created_at: string
          frequency: string
          id: string
          last_run_at: string | null
          search_history_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency: string
          id?: string
          last_run_at?: string | null
          search_history_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          frequency?: string
          id?: string
          last_run_at?: string | null
          search_history_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_schedules_search_history_id_fkey"
            columns: ["search_history_id"]
            isOneToOne: false
            referencedRelation: "search_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_papers: {
        Row: {
          authors: string[]
          created_at: string
          id: string
          is_liked: boolean | null
          journal: string
          list_id: string | null
          paper_id: string
          pdf_url: string | null
          title: string
          user_id: string
          year: number
        }
        Insert: {
          authors: string[]
          created_at?: string
          id?: string
          is_liked?: boolean | null
          journal: string
          list_id?: string | null
          paper_id: string
          pdf_url?: string | null
          title: string
          user_id: string
          year: number
        }
        Update: {
          authors?: string[]
          created_at?: string
          id?: string
          is_liked?: boolean | null
          journal?: string
          list_id?: string | null
          paper_id?: string
          pdf_url?: string | null
          title?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "saved_papers_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_papers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      search_cache: {
        Row: {
          cache_key: string
          created_at: string
          results: Json
        }
        Insert: {
          cache_key: string
          created_at?: string
          results: Json
        }
        Update: {
          cache_key?: string
          created_at?: string
          results?: Json
        }
        Relationships: []
      }
      search_history: {
        Row: {
          created_at: string
          disease: string | null
          id: string
          medicine: string | null
          patient_count: number | null
          population: string | null
          trial_type: string | null
          user_id: string
          working_mechanism: string | null
        }
        Insert: {
          created_at?: string
          disease?: string | null
          id?: string
          medicine?: string | null
          patient_count?: number | null
          population?: string | null
          trial_type?: string | null
          user_id: string
          working_mechanism?: string | null
        }
        Update: {
          created_at?: string
          disease?: string | null
          id?: string
          medicine?: string | null
          patient_count?: number | null
          population?: string | null
          trial_type?: string | null
          user_id?: string
          working_mechanism?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_types: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
