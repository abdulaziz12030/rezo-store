import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server'

export type ShippingSettings = {
  enabled: boolean
  methodName: string
  flatRate: number
  freeShippingThreshold: number | null
  estimatedMinDays: number | null
  estimatedMaxDays: number | null
}

export const defaultShippingSettings: ShippingSettings = {
  enabled: false,
  methodName: 'الشحن القياسي',
  flatRate: 0,
  freeShippingThreshold: null,
  estimatedMinDays: null,
  estimatedMaxDays: null
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeShippingSettings(value: unknown): ShippingSettings {
  const raw = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  return {
    enabled: raw.enabled === true,
    methodName: String(raw.method_name || defaultShippingSettings.methodName),
    flatRate: Math.max(0, Number(raw.flat_rate || 0)),
    freeShippingThreshold: numberOrNull(raw.free_shipping_threshold),
    estimatedMinDays: numberOrNull(raw.estimated_min_days),
    estimatedMaxDays: numberOrNull(raw.estimated_max_days)
  }
}

export async function getShippingSettings(): Promise<ShippingSettings> {
  if (!isSupabaseConfigured()) return defaultShippingSettings

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('store_settings')
    .select('value')
    .eq('key', 'shipping')
    .maybeSingle()

  if (error || !data) return defaultShippingSettings
  return normalizeShippingSettings(data.value)
}

export function calculateShippingTotal(subtotal: number, settings: ShippingSettings) {
  if (!settings.enabled) throw new Error('shipping_not_configured')
  if (settings.freeShippingThreshold !== null && subtotal >= settings.freeShippingThreshold) return 0
  return Math.max(0, Number(settings.flatRate || 0))
}

export function shippingSummary(settings: ShippingSettings) {
  if (!settings.enabled) return 'الشحن غير مهيأ بعد.'

  const parts = [`${settings.methodName}: ${settings.flatRate.toFixed(2)} ر.س`]
  if (settings.freeShippingThreshold !== null) {
    parts.push(`مجاني للطلبات من ${settings.freeShippingThreshold.toFixed(2)} ر.س`)
  }
  if (settings.estimatedMinDays !== null || settings.estimatedMaxDays !== null) {
    const min = settings.estimatedMinDays ?? settings.estimatedMaxDays
    const max = settings.estimatedMaxDays ?? settings.estimatedMinDays
    parts.push(`المدة المتوقعة ${min}${min !== max ? `–${max}` : ''} أيام`)
  }
  return parts.join(' · ')
}
