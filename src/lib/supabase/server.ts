import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export function isSupabaseConfigured() {
  return Boolean(url && anonKey && serviceRoleKey)
}

export function getSupabaseAdmin() {
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase environment variables are missing.')
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export function getSupabasePublic() {
  if (!url || !anonKey) {
    throw new Error('Supabase public environment variables are missing.')
  }

  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}
