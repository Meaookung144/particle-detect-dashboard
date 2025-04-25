import { createClient } from '@supabase/supabase-js';

// Get the Supabase URL and ANON key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database
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
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          full_name?: string | null
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
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          upload_interval_seconds?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          upload_interval_seconds?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      images: {
        Row: {
          id: string
          machine_id: string
          original_filename: string
          status: string
          uploaded_at: string
          processed_at: string | null
          detection_count: number
        }
        Insert: {
          id?: string
          machine_id: string
          original_filename: string
          status?: string
          uploaded_at?: string
          processed_at?: string | null
          detection_count?: number
        }
        Update: {
          id?: string
          machine_id?: string
          original_filename?: string
          status?: string
          uploaded_at?: string
          processed_at?: string | null
          detection_count?: number
        }
      }
      particles: {
        Row: {
          id: string
          image_id: string
          particle_filename: string
          class: string
          confidence: number | null
          x_position: number | null
          y_position: number | null
          width: number | null
          height: number | null
          created_at: string
        }
        Insert: {
          id?: string
          image_id: string
          particle_filename: string
          class: string
          confidence?: number | null
          x_position?: number | null
          y_position?: number | null
          width?: number | null
          height?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          image_id?: string
          particle_filename?: string
          class?: string
          confidence?: number | null
          x_position?: number | null
          y_position?: number | null
          width?: number | null
          height?: number | null
          created_at?: string
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
      dashboard_summary: {
        Row: {
          machine_id: string
          machine_name: string
          machine_status: string
          total_images: number | null
          total_particles: number | null
          pending_images: number | null
          detected_images: number | null
          failed_images: number | null
          last_upload: string | null
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updateables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']

// Helper functions for type-safe database access
export const getUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data as Tables<'users'>;
};

export const getMachine = async (machineId: string) => {
  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .eq('id', machineId)
    .single();
  
  if (error) throw error;
  return data as Tables<'machines'>;
};

export const getMachines = async (userId: string) => {
  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Tables<'machines'>[];
};

export const getImages = async (machineId: string, limit = 10) => {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('machine_id', machineId)
    .order('uploaded_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data as Tables<'images'>[];
};

export const getImage = async (imageId: string) => {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('id', imageId)
    .single();
  
  if (error) throw error;
  return data as Tables<'images'>;
};

export const getParticles = async (imageId: string) => {
  const { data, error } = await supabase
    .from('particles')
    .select('*')
    .eq('image_id', imageId);
  
  if (error) throw error;
  return data as Tables<'particles'>[];
};

export const getDetectionSettings = async (machineId: string) => {
  const { data, error } = await supabase
    .from('detection_settings')
    .select('*')
    .eq('machine_id', machineId)
    .single();
  
  if (error) {
    // If no settings exist, create default settings
    if (error.code === 'PGRST116') {
      const defaultSettings = {
        machine_id: machineId,
        sensitivity: 0.5,
        min_particle_size: 10,
        max_particle_size: 100,
        algorithm_parameters: {}
      };
      
      const { data: newData, error: insertError } = await supabase
        .from('detection_settings')
        .insert(defaultSettings)
        .select()
        .single();
      
      if (insertError) throw insertError;
      return newData as Tables<'detection_settings'>;
    }
    
    throw error;
  }
  
  return data as Tables<'detection_settings'>;
};