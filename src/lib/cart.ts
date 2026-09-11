import { cookies } from 'next/headers'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server'

const CART_COOKIE = 'rezo_style_cart_token'

export type CartLine = {
  id: string
  productId: string
  variantId?: string
  name: string
  slug: string
  image?: string
  variantLabel?: string
  sku?: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type CurrentCart = {
  id: string
  subtotal: number
  discountTotal: number
  shippingTotal: number
  grandTotal: number
  couponCode?: string
  items: CartLine[]
}

function num(value: unknown) {
  return Number(value || 0)
}

export async function getCurrentCart(): Promise<CurrentCart | null> {
  if (!isSupabaseConfigured()) return null

  const store = await cookies()
  const token = store.get(CART_COOKIE)?.value
  if (!token) return null

  const supabase = getSupabaseAdmin()
  const { data: cart, error: cartError } = await supabase
    .from('carts')
    .select('id, subtotal, discount_total, shipping_total, grand_total, coupon_code')
    .eq('session_token', token)
    .eq('status', 'active')
    .maybeSingle()

  if (cartError || !cart) return null

  const { data: rows, error: itemsError } = await supabase
    .from('cart_items')
    .select(`
      id,
      product_id,
      variant_id,
      quantity,
      unit_price,
      line_total,
      products(id, name, slug, image_url),
      product_variants(id, sku, size, color, option_label)
    `)
    .eq('cart_id', cart.id)
    .order('created_at', { ascending: true })

  if (itemsError) throw new Error(itemsError.message)

  const items: CartLine[] = (rows ?? []).map((raw) => {
    const row = raw as unknown as {
      id: string
      product_id: string
      variant_id: string | null
      quantity: number
      unit_price: number | string
      line_total: number | string
      products?: { id: string; name: string; slug: string; image_url: string | null } | null
      product_variants?: { id: string; sku: string; size: string | null; color: string | null; option_label: string | null } | null
    }

    const variantParts = [row.product_variants?.option_label, row.product_variants?.size, row.product_variants?.color]
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index)

    return {
      id: row.id,
      productId: row.product_id,
      variantId: row.variant_id ?? undefined,
      name: row.products?.name ?? 'منتج REZO STYLE',
      slug: row.products?.slug ?? '',
      image: row.products?.image_url ?? undefined,
      variantLabel: variantParts.join(' · ') || undefined,
      sku: row.product_variants?.sku ?? undefined,
      quantity: Number(row.quantity),
      unitPrice: num(row.unit_price),
      lineTotal: num(row.line_total)
    }
  })

  return {
    id: cart.id,
    subtotal: num(cart.subtotal),
    discountTotal: num(cart.discount_total),
    shippingTotal: num(cart.shipping_total),
    grandTotal: num(cart.grand_total),
    couponCode: cart.coupon_code ?? undefined,
    items
  }
}
