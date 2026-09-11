'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/admin'
import { getSupabaseAdmin } from '@/lib/supabase/server'

function orderError(code: string): never {
  redirect(`/admin/orders?error=${encodeURIComponent(code)}`)
}

export async function advanceOrderStatus(formData: FormData) {
  const admin = await requireAdmin()
  const orderId = String(formData.get('order_id') || '').trim()
  const targetStatus = String(formData.get('target_status') || '').trim()
  const note = String(formData.get('note') || '').trim()

  if (!orderId || !targetStatus) orderError('missing-data')

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.rpc('rezo_style_admin_advance_order', {
    p_order_id: orderId,
    p_target_status: targetStatus,
    p_actor_user_id: admin.userId,
    p_note: note || null
  })

  if (error) {
    const message = error.message || ''
    if (message.includes('verified_payment_required')) orderError('payment-required')
    if (message.includes('invalid_order_transition')) orderError('invalid-transition')
    if (message.includes('order_cancelled')) orderError('order-cancelled')
    orderError('update-failed')
  }

  revalidatePath('/admin')
  revalidatePath('/admin/orders')
}

export async function cancelUnpaidOrder(formData: FormData) {
  const admin = await requireAdmin()
  const orderId = String(formData.get('order_id') || '').trim()
  const reason = String(formData.get('reason') || '').trim()

  if (!orderId) orderError('missing-data')

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.rpc('rezo_style_admin_cancel_unpaid_order', {
    p_order_id: orderId,
    p_actor_user_id: admin.userId,
    p_reason: reason || 'إلغاء من لوحة الإدارة'
  })

  if (error) {
    const message = error.message || ''
    if (message.includes('paid_order_requires_refund')) orderError('paid-cannot-cancel')
    orderError('cancel-failed')
  }

  revalidatePath('/admin')
  revalidatePath('/admin/orders')
}
