'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin, getSupabaseAuthServer } from '@/lib/supabase/server'

export async function adminLogin(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')

  if (!email || !password) redirect('/admin-login?error=missing')

  const auth = await getSupabaseAuthServer()
  const { data, error } = await auth.auth.signInWithPassword({ email, password })

  if (error || !data.user) redirect('/admin-login?error=invalid')

  const adminDb = getSupabaseAdmin()
  const { data: admin, error: adminError } = await adminDb
    .from('admin_users')
    .select('user_id, is_active')
    .eq('user_id', data.user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (adminError || !admin) {
    await auth.auth.signOut()
    redirect('/admin-login?error=unauthorized')
  }

  revalidatePath('/admin', 'layout')
  redirect('/admin')
}

export async function adminLogout() {
  const auth = await getSupabaseAuthServer()
  await auth.auth.signOut()
  revalidatePath('/admin', 'layout')
  redirect('/admin-login')
}
