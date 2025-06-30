import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
})

export type Database = {
  public: {
    Tables: {
      farmers: {
        Row: {
          id: string
          phone_number: string
          full_name: string | null
          location_name: string | null
          latitude: number | null
          longitude: number | null
          preferred_language: string | null
          crop: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone_number: string
          full_name?: string | null
          location_name?: string | null
          latitude?: number | null
          longitude?: number | null
          preferred_language?: string | null
          crop?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone_number?: string
          full_name?: string | null
          location_name?: string | null
          latitude?: number | null
          longitude?: number | null
          preferred_language?: string | null
          crop?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ivr_calls: {
        Row: {
          id: string
          farmer_id: string | null
          call_time: string
          crop_selected: string | null
          crop_condition: number | null
          rain_recent: boolean | null
          opted_in_carbon: boolean | null
          transcript: string | null
          call_duration: number | null
          call_status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          farmer_id?: string | null
          call_time?: string
          crop_selected?: string | null
          crop_condition?: number | null
          rain_recent?: boolean | null
          opted_in_carbon?: boolean | null
          transcript?: string | null
          call_duration?: number | null
          call_status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          farmer_id?: string | null
          call_time?: string
          crop_selected?: string | null
          crop_condition?: number | null
          rain_recent?: boolean | null
          opted_in_carbon?: boolean | null
          transcript?: string | null
          call_duration?: number | null
          call_status?: string | null
          created_at?: string
        }
      }
      satellite_insights: {
        Row: {
          id: string
          farmer_id: string | null
          image_date: string
          ndvi_score: number | null
          soil_moisture: number | null
          vegetation_index: number | null
          recommendation: string | null
          image_url: string | null
          sentinel_data: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          farmer_id?: string | null
          image_date: string
          ndvi_score?: number | null
          soil_moisture?: number | null
          vegetation_index?: number | null
          recommendation?: string | null
          image_url?: string | null
          sentinel_data?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          farmer_id?: string | null
          image_date?: string
          ndvi_score?: number | null
          soil_moisture?: number | null
          vegetation_index?: number | null
          recommendation?: string | null
          image_url?: string | null
          sentinel_data?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      carbon_credits: {
        Row: {
          id: string
          farmer_id: string | null
          opt_in_date: string
          practices_reported: string | null
          verification_status: string | null
          estimated_credits: number | null
          verified_credits: number | null
          credit_price: number | null
          total_value: number | null
          registry_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          farmer_id?: string | null
          opt_in_date: string
          practices_reported?: string | null
          verification_status?: string | null
          estimated_credits?: number | null
          verified_credits?: number | null
          credit_price?: number | null
          total_value?: number | null
          registry_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          farmer_id?: string | null
          opt_in_date?: string
          practices_reported?: string | null
          verification_status?: string | null
          estimated_credits?: number | null
          verified_credits?: number | null
          credit_price?: number | null
          total_value?: number | null
          registry_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      api_credentials: {
        Row: {
          id: string
          credentials: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          credentials?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          credentials?: any
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}