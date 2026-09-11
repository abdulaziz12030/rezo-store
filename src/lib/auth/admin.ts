import { redirect } from 'next/navigation'
import { getSupabaseAdmin, getSupabaseAuthServer } from '@/lib/supabase/server'

export type AdminIdentity = {
  userId: string
  email: string | null
  role: 'owner' | 'admin' | 'manager'
}

export async function getCurrentAdmin(): Promise<AdminIdentity | null> {
  const auth = await getSupabaseAuthServer()
  const { data, error } = await auth.auth.getUser()

  if (error || !data.user) return null

  const adminDb = getSupabaseAdmin()
  const { data: admin, error: adminError } = await adminDb
    .from('admin_users')
    .select('user_id, email, role, is_active')
    .eq('user_id', data.user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (adminError || !admin) return null

  return {
    userId: admin.user_id,
    email: admin.email || data.user.email || null,
    role: admin.role as AdminIdentity['role']
  }
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/admin-login')
  return admin
}
