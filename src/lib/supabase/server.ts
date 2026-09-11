import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export function isSupabaseConfigured() {
  return Boolean(url && publicKey && serviceRoleKey)
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
  if (!url || !publicKey) {
    throw new Error('Supabase public environment variables are missing.')
  }

  return createClient(url, publicKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function getSupabaseAuthServer() {
  if (!url || !publicKey) {
    throw new Error('Supabase auth environment variables are missing.')
  }

  const cookieStore = await cookies()

  return createServerClient(url, publicKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Components cannot write cookies. Server Actions and route handlers can.
        }
      }
    }
  })
}
