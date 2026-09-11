import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server'

export type AdminOrder = {
  id: string
  order_number: string
  status: string
  payment_status: string
  fulfillment_status: string
  grand_total: number | string
  customer_name: string
  customer_phone: string
  placed_at: string
  paid_at: string | null
  cancelled_at: string | null
  order_items?: Array<{ id: string }> | null
}

export async function getAdminOrders(limit = 100): Promise<AdminOrder[]> {
  if (!isSupabaseConfigured()) return []

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, status, payment_status, fulfillment_status, grand_total, customer_name, customer_phone, placed_at, paid_at, cancelled_at, order_items(id)')
    .order('placed_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as AdminOrder[]
}
