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
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          created_at?: string
          updated_at?: string
        }
      }
      machines: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          upload_interval_seconds: number
          status: 'active' | 'inactive' | 'maintenance'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          upload_interval_seconds?: number
          status: 'active' | 'inactive' | 'maintenance'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          upload_interval_seconds?: number
          status?: 'active' | 'inactive' | 'maintenance'
          created_at?: string
          updated_at?: string
        }
      }
      images: {
        Row: {
          id: string
          machine_id: string
          filename: string
          thumbnail_filename: string | null
          status: 'pending' | 'detected' | 'failed'
          detection_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          machine_id: string
          filename: string
          thumbnail_filename?: string | null
          status: 'pending' | 'detected' | 'failed'
          detection_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          machine_id?: string
          filename?: string
          thumbnail_filename?: string | null
          status?: 'pending' | 'detected' | 'failed'
          detection_data?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      detection_settings: {
        Row: {
          id: string
          machine_id: string
          sensitivity: number
          min_particle_size: number
          max_particle_size: number
          algorithm_parameters: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          machine_id: string
          sensitivity?: number
          min_particle_size?: number
          max_particle_size?: number
          algorithm_parameters?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          machine_id?: string
          sensitivity?: number
          min_particle_size?: number
          max_particle_size?: number
          algorithm_parameters?: Json | null
          created_at?: string
          updated_at?: string
        }
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
  }
}