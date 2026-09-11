'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/admin'
import { getSupabaseAdmin } from '@/lib/supabase/server'

function optionalNumber(value: FormDataEntryValue | null) {
  const raw = String(value || '').trim()
  if (!raw) return null
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error('قيمة رقمية غير صحيحة في إعدادات الشحن.')
  return parsed
}

export async function updateShippingSettings(formData: FormData) {
  const admin = await requireAdmin()
  const supabase = getSupabaseAdmin()

  const enabled = formData.get('enabled') === 'on'
  const methodName = String(formData.get('method_name') || '').trim() || 'الشحن القياسي'
  const flatRate = optionalNumber(formData.get('flat_rate')) ?? 0
  const freeShippingThreshold = optionalNumber(formData.get('free_shipping_threshold'))
  const estimatedMinDays = optionalNumber(formData.get('estimated_min_days'))
  const estimatedMaxDays = optionalNumber(formData.get('estimated_max_days'))

  if (estimatedMinDays !== null && estimatedMaxDays !== null && estimatedMaxDays < estimatedMinDays) {
    throw new Error('الحد الأعلى لأيام التوصيل يجب ألا يقل عن الحد الأدنى.')
  }

  const { data: previous } = await supabase
    .from('store_settings')
    .select('value')
    .eq('key', 'shipping')
    .maybeSingle()

  const value = {
    enabled,
    method_name: methodName,
    flat_rate: flatRate,
    free_shipping_threshold: freeShippingThreshold,
    estimated_min_days: estimatedMinDays,
    estimated_max_days: estimatedMaxDays
  }

  const { error } = await supabase
    .from('store_settings')
    .upsert({ key: 'shipping', value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

  if (error) throw new Error(error.message)

  await supabase.from('admin_audit_logs').insert({
    actor_user_id: admin.userId,
    action: 'update_shipping_settings',
    entity_type: 'store_setting',
    entity_id: 'shipping',
    before_data: previous?.value ?? null,
    after_data: value,
    metadata: { source: 'admin_settings' }
  })

  revalidatePath('/admin/settings')
  revalidatePath('/cart')
  revalidatePath('/checkout')
  redirect('/admin/settings?saved=1')
}
