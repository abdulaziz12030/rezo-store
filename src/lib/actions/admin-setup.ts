'use server'

import { redirect } from 'next/navigation'
import { getSupabaseAdmin, getSupabasePublic, isSupabaseConfigured } from '@/lib/supabase/server'

export async function bootstrapFirstAdmin(formData: FormData) {
  if (!isSupabaseConfigured()) redirect('/admin-setup?error=environment')

  const expectedToken = process.env.REZO_STYLE_ADMIN_SETUP_TOKEN
  if (!expectedToken) redirect('/admin-setup?error=disabled')

  const setupToken = String(formData.get('setup_token') || '')
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')

  if (!email || !password || !setupToken) redirect('/admin-setup?error=missing')
  if (password.length < 12) redirect('/admin-setup?error=password')
  if (setupToken !== expectedToken) redirect('/admin-setup?error=token')

  const admin = getSupabaseAdmin()
  const { count, error: countError } = await admin
    .from('admin_users')
    .select('user_id', { count: 'exact', head: true })

  if (countError) redirect('/admin-setup?error=database')
  if ((count ?? 0) > 0) redirect('/admin-login?setup=closed')

  const auth = getSupabasePublic()
  const { data: signup, error: signupError } = await auth.auth.signUp({
    email,
    password,
    options: {
      data: { app: 'rezo-style', role: 'owner' }
    }
  })

  if (signupError || !signup.user) redirect('/admin-setup?error=create')

  // Hosted Supabase projects normally require email confirmation by default.
  // If a session is returned immediately, confirmations are disabled; refuse to
  // bootstrap the Owner so REZO STYLE never creates an unverified admin account.
  if (signup.session) {
    await admin.auth.admin.deleteUser(signup.user.id).catch(() => undefined)
    redirect('/admin-setup?error=confirmation-disabled')
  }

  const { error: insertError } = await admin.from('admin_users').insert({
    user_id: signup.user.id,
    email,
    role: 'owner',
    is_active: true
  })

  if (insertError) {
    await admin.auth.admin.deleteUser(signup.user.id).catch(() => undefined)
    redirect('/admin-setup?error=database')
  }

  redirect('/admin-login?setup=confirmation-sent')
}
