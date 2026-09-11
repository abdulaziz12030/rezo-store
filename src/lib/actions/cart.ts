'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server'

const CART_COOKIE = 'rezo_style_cart_token'
const CART_MAX_AGE = 60 * 60 * 24 * 30

function money(value: unknown) {
  return Math.round(Number(value || 0) * 100) / 100
}

async function getOrCreateCartToken() {
  const store = await cookies()
  let token = store.get(CART_COOKIE)?.value

  if (!token) {
    token = crypto.randomUUID()
    store.set(CART_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: CART_MAX_AGE
    })
  }

  return token
}

async function recalculateCart(cartId: string) {
  const supabase = getSupabaseAdmin()
  const { data: items, error } = await supabase
    .from('cart_items')
    .select('quantity, unit_price')
    .eq('cart_id', cartId)

  if (error) throw new Error(error.message)

  const subtotal = money((items ?? []).reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0))
  const { data: cart, error: cartError } = await supabase
    .from('carts')
    .select('discount_total, shipping_total')
    .eq('id', cartId)
    .single()

  if (cartError) throw new Error(cartError.message)

  const discount = money(cart.discount_total)
  const shipping = money(cart.shipping_total)
  const grandTotal = money(Math.max(0, subtotal - discount + shipping))

  const { error: updateError } = await supabase
    .from('carts')
    .update({ subtotal, grand_total: grandTotal })
    .eq('id', cartId)

  if (updateError) throw new Error(updateError.message)
}

async function findOrCreateActiveCart(token: string) {
  const supabase = getSupabaseAdmin()
  const { data: existing, error } = await supabase
    .from('carts')
    .select('id, status')
    .eq('session_token', token)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (existing?.status === 'active') return existing.id as string

  if (existing) {
    const store = await cookies()
    const freshToken = crypto.randomUUID()
    store.set(CART_COOKIE, freshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: CART_MAX_AGE
    })

    const { data: created, error: createError } = await supabase
      .from('carts')
      .insert({ session_token: freshToken, status: 'active' })
      .select('id')
      .single()

    if (createError) throw new Error(createError.message)
    return created.id as string
  }

  const { data: created, error: createError } = await supabase
    .from('carts')
    .insert({ session_token: token, status: 'active' })
    .select('id')
    .single()

  if (createError) throw new Error(createError.message)
  return created.id as string
}

export async function addToCart(formData: FormData) {
  if (!isSupabaseConfigured()) redirect('/cart?error=store-not-configured')

  const productId = String(formData.get('product_id') || '').trim()
  const variantId = String(formData.get('variant_id') || '').trim() || null
  const requestedQuantity = Math.max(1, Math.min(20, Number(formData.get('quantity') || 1)))

  if (!productId) redirect('/cart?error=invalid-product')

  const supabase = getSupabaseAdmin()
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, price, stock, is_active, track_inventory, allow_backorder')
    .eq('id', productId)
    .single()

  if (productError || !product?.is_active) redirect('/cart?error=product-unavailable')

  let variant: {
    id: string
    product_id: string
    price_override: number | string | null
    stock: number
    is_active: boolean
  } | null = null

  if (variantId) {
    const { data, error } = await supabase
      .from('product_variants')
      .select('id, product_id, price_override, stock, is_active')
      .eq('id', variantId)
      .eq('product_id', productId)
      .single()

    if (error || !data?.is_active) redirect('/cart?error=variant-unavailable')
    variant = data
  }

  const token = await getOrCreateCartToken()
  const cartId = await findOrCreateActiveCart(token)

  let existingQuery = supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cartId)
    .eq('product_id', productId)

  existingQuery = variantId ? existingQuery.eq('variant_id', variantId) : existingQuery.is('variant_id', null)
  const { data: existing, error: existingError } = await existingQuery.maybeSingle()
  if (existingError) throw new Error(existingError.message)

  const newQuantity = Number(existing?.quantity || 0) + requestedQuantity
  const availableStock = variant ? Number(variant.stock) : Number(product.stock)
  const inventoryTracked = product.track_inventory !== false

  if (inventoryTracked && !product.allow_backorder && newQuantity > availableStock) {
    redirect(`/cart?error=insufficient-stock&available=${Math.max(0, availableStock)}`)
  }

  const unitPrice = money(variant?.price_override ?? product.price)
  const lineTotal = money(unitPrice * newQuantity)

  if (existing) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: newQuantity, unit_price: unitPrice, line_total: lineTotal })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('cart_items').insert({
      cart_id: cartId,
      product_id: productId,
      variant_id: variantId,
      quantity: newQuantity,
      unit_price: unitPrice,
      line_total: lineTotal
    })
    if (error) throw new Error(error.message)
  }

  await recalculateCart(cartId)
  revalidatePath('/cart')
  redirect('/cart')
}

export async function updateCartItemQuantity(formData: FormData) {
  const itemId = String(formData.get('item_id') || '').trim()
  const requestedQuantity = Math.max(0, Math.min(20, Number(formData.get('quantity') || 0)))
  if (!itemId) return

  const store = await cookies()
  const token = store.get(CART_COOKIE)?.value
  if (!token || !isSupabaseConfigured()) return

  const supabase = getSupabaseAdmin()
  const { data: cart } = await supabase.from('carts').select('id').eq('session_token', token).eq('status', 'active').maybeSingle()
  if (!cart) return

  const { data: item } = await supabase
    .from('cart_items')
    .select('id, product_id, variant_id, unit_price')
    .eq('id', itemId)
    .eq('cart_id', cart.id)
    .maybeSingle()

  if (!item) return

  if (requestedQuantity <= 0) {
    await supabase.from('cart_items').delete().eq('id', item.id).eq('cart_id', cart.id)
  } else {
    const { data: product } = await supabase
      .from('products')
      .select('stock, track_inventory, allow_backorder')
      .eq('id', item.product_id)
      .single()

    let availableStock = Number(product?.stock || 0)
    if (item.variant_id) {
      const { data: variant } = await supabase.from('product_variants').select('stock').eq('id', item.variant_id).single()
      availableStock = Number(variant?.stock || 0)
    }

    if (product?.track_inventory !== false && !product?.allow_backorder && requestedQuantity > availableStock) {
      redirect(`/cart?error=insufficient-stock&available=${Math.max(0, availableStock)}`)
    }

    await supabase
      .from('cart_items')
      .update({ quantity: requestedQuantity, line_total: money(Number(item.unit_price) * requestedQuantity) })
      .eq('id', item.id)
      .eq('cart_id', cart.id)
  }

  await recalculateCart(cart.id)
  revalidatePath('/cart')
}

export async function removeCartItem(formData: FormData) {
  const itemId = String(formData.get('item_id') || '').trim()
  if (!itemId) return

  const store = await cookies()
  const token = store.get(CART_COOKIE)?.value
  if (!token || !isSupabaseConfigured()) return

  const supabase = getSupabaseAdmin()
  const { data: cart } = await supabase.from('carts').select('id').eq('session_token', token).eq('status', 'active').maybeSingle()
  if (!cart) return

  await supabase.from('cart_items').delete().eq('id', itemId).eq('cart_id', cart.id)
  await recalculateCart(cart.id)
  revalidatePath('/cart')
}
