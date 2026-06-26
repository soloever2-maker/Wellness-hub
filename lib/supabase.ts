import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export type UserRole = 'client' | 'admin'
export type UserStatus = 'pending' | 'approved' | 'rejected'

export interface AppUser {
  id: string
  auth_id: string
  full_name: string
  phone: string
  email: string
  role: UserRole
  status: UserStatus
  created_at: string
  preferences?: {
    reminders_whatsapp?: boolean
    reminders_24h?: boolean
    reminders_2h?: boolean
  }
}
