'use server'

import { redirect } from 'next/navigation'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server'

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

  const supabase = getSupabaseAdmin()
  const { count, error: countError } = await supabase
    .from('admin_users')
    .select('user_id', { count: 'exact', head: true })

  if (countError) redirect('/admin-setup?error=database')
  if ((count ?? 0) > 0) redirect('/admin-login?setup=closed')

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { app: 'rezo-style', role: 'owner' }
  })

  if (createError || !created.user) redirect('/admin-setup?error=create')

  const { error: insertError } = await supabase.from('admin_users').insert({
    user_id: created.user.id,
    email,
    role: 'owner',
    is_active: true
  })

  if (insertError) {
    await supabase.auth.admin.deleteUser(created.user.id).catch(() => undefined)
    redirect('/admin-setup?error=database')
  }

  redirect('/admin-login?setup=ready')
}
