'use server'

import { redirect } from 'next/navigation'
import { getSupabaseAdmin, getSupabasePublic, isSupabaseConfigured } from '@/lib/supabase/server'

const OWNER_EMAIL = 'style@rezo.sa'

export async function bootstrapFirstAdmin(formData: FormData) {
  if (!isSupabaseConfigured()) redirect('/admin-setup?error=environment')

  const password = String(formData.get('password') || '')
  if (!password) redirect('/admin-setup?error=missing')
  if (password.length < 12) redirect('/admin-setup?error=password')

  const admin = getSupabaseAdmin()
  const { count, error: countError } = await admin
    .from('admin_users')
    .select('user_id', { count: 'exact', head: true })

  if (countError) redirect('/admin-setup?error=database')
  if ((count ?? 0) > 0) redirect('/admin-login?setup=closed')

  // The simplified bootstrap is intentionally limited to an empty REZO STYLE
  // Auth project. If any Auth user already exists, stop instead of guessing.
  const { data: usersPage, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
  if (usersError) redirect('/admin-setup?error=database')
  if (usersPage.users.length > 0) redirect('/admin-setup?error=existing-auth')

  const auth = getSupabasePublic()
  const { data: signup, error: signupError } = await auth.auth.signUp({
    email: OWNER_EMAIL,
    password,
    options: {
      data: { app: 'rezo-style', role: 'owner' }
    }
  })

  if (signupError || !signup.user) redirect('/admin-setup?error=create')

  // Require real ownership of style@rezo.sa before allowing admin sign-in.
  if (signup.session) {
    await admin.auth.admin.deleteUser(signup.user.id).catch(() => undefined)
    redirect('/admin-setup?error=confirmation-disabled')
  }

  const { error: insertError } = await admin.from('admin_users').insert({
    user_id: signup.user.id,
    email: OWNER_EMAIL,
    role: 'owner',
    is_active: true
  })

  if (insertError) {
    await admin.auth.admin.deleteUser(signup.user.id).catch(() => undefined)
    redirect('/admin-setup?error=database')
  }

  redirect('/admin-login?setup=confirmation-sent')
}
