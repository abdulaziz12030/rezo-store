'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server'

function getPreviewOrigin(requestOrigin: string | null) {
  if (requestOrigin) return requestOrigin.replace(/\/$/, '')

  const configured = process.env.REZO_STYLE_PUBLIC_URL
  if (configured) return configured.replace(/\/$/, '')

  const vercelHost = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL
  if (vercelHost) return `https://${vercelHost.replace(/\/$/, '')}`

  return null
}

export async function bootstrapFirstAdmin(formData: FormData) {
  if (!isSupabaseConfigured()) redirect('/admin-setup?error=environment')

  const expectedToken = process.env.REZO_STYLE_ADMIN_SETUP_TOKEN
  if (!expectedToken) redirect('/admin-setup?error=disabled')

  const setupToken = String(formData.get('setup_token') || '')
  const email = String(formData.get('email') || '').trim().toLowerCase()

  if (!email || !setupToken) redirect('/admin-setup?error=missing')
  if (setupToken !== expectedToken) redirect('/admin-setup?error=token')

  const supabase = getSupabaseAdmin()
  const { count, error: countError } = await supabase
    .from('admin_users')
    .select('user_id', { count: 'exact', head: true })

  if (countError) redirect('/admin-setup?error=database')
  if ((count ?? 0) > 0) redirect('/admin-login?setup=closed')

  const requestHeaders = await headers()
  const origin = getPreviewOrigin(requestHeaders.get('origin'))
  if (!origin) redirect('/admin-setup?error=redirect')

  const redirectTo = `${origin}/admin-invite`
  const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { app: 'rezo-style', role: 'owner' }
  })

  if (inviteError || !invited.user) redirect('/admin-setup?error=invite')

  const { error: insertError } = await supabase.from('admin_users').insert({
    user_id: invited.user.id,
    email,
    role: 'owner',
    is_active: true
  })

  if (insertError) {
    await supabase.auth.admin.deleteUser(invited.user.id).catch(() => undefined)
    redirect('/admin-setup?error=database')
  }

  redirect('/admin-login?setup=invited')
}
