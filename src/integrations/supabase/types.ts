export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      auth_config: {
        Row: {
          id: string
          enable_signup: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          enable_signup?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          enable_signup?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      github_repos: {
        Row: {
          branch: string
          created_at: string
          id: string
          is_scraper: boolean
          last_sync_at: string
          repo_url: string
          user_id: string
        }
        Insert: {
          branch?: string
          created_at?: string
          id?: string
          is_scraper?: boolean
          last_sync_at?: string
          repo_url: string
          user_id: string
        }
        Update: {
          branch?: string
          created_at?: string
          id?: string
          is_scraper?: boolean
          last_sync_at?: string
          repo_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_repos_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
            referencedRelation: "search_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_schedules_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_papers_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]