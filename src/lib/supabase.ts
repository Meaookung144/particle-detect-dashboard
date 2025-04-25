import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)

export type Tables = Database['public']['Tables']
export type TablesInsert = {
  [K in keyof Tables]: Tables[K]['Insert']
}
export type TablesUpdate = {
  [K in keyof Tables]: Tables[K]['Update']
}
export type TablesRow = {
  [K in keyof Tables]: Tables[K]['Row']
}