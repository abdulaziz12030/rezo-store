'use server'

import { redirect } from 'next/navigation'
import { getCurrentCart } from '@/lib/cart'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server'

function normalizePhone(value: string) {
  return value.replace(/[^0-9+]/g, '')
}

function checkoutError(code: string): never {
  redirect(`/checkout?error=${encodeURIComponent(code)}`)
}

export async function createCheckoutOrder(formData: FormData) {
  if (!isSupabaseConfigured()) checkoutError('store-not-configured')

  const cart = await getCurrentCart()
  if (!cart || !cart.items.length) checkoutError('cart-empty')

  const fullName = String(formData.get('full_name') || '').trim()
  const phone = normalizePhone(String(formData.get('phone') || '').trim())
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const city = String(formData.get('city') || '').trim()
  const district = String(formData.get('district') || '').trim()
  const street = String(formData.get('street') || '').trim()
  const buildingNo = String(formData.get('building_no') || '').trim()
  const postalCode = String(formData.get('postal_code') || '').trim()
  const additionalNo = String(formData.get('additional_no') || '').trim()
  const shortCode = String(formData.get('national_address_short_code') || '').trim().toUpperCase()
  const note = String(formData.get('customer_note') || '').trim()

  if (!fullName || phone.length < 9 || !city || !district || !street) {
    checkoutError('missing-details')
  }

  if (email && !/^\S+@\S+\.\S+$/.test(email)) checkoutError('invalid-email')

  const shippingAddress = {
    recipient_name: fullName,
    phone,
    city,
    district,
    street,
    building_no: buildingNo || null,
    postal_code: postalCode || null,
    additional_no: additionalNo || null,
    national_address_short_code: shortCode || null
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.rpc('rezo_style_create_order_from_cart', {
    p_cart_id: cart.id,
    p_customer_name: fullName,
    p_customer_phone: phone,
    p_customer_email: email || null,
    p_shipping_address: shippingAddress,
    p_customer_note: note || null
  })

  if (error) {
    const message = error.message || ''
    if (message.includes('insufficient_stock')) checkoutError('insufficient-stock')
    if (message.includes('product_unavailable')) checkoutError('product-unavailable')
    if (message.includes('variant_unavailable')) checkoutError('variant-unavailable')
    if (message.includes('variant_required')) checkoutError('variant-required')
    if (message.includes('cart_already_converted')) checkoutError('cart-converted')
    checkoutError('checkout-failed')
  }

  const order = Array.isArray(data) ? data[0] : data
  if (!order?.order_number || !order?.access_token) checkoutError('checkout-failed')

  redirect(`/orders/${encodeURIComponent(order.order_number)}?token=${encodeURIComponent(order.access_token)}`)
}
