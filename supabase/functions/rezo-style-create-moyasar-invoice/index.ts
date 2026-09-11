import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  findInvoicesForOrder,
  moyasarRequest,
  paidPayment,
  paymentMethod,
  toMinorUnits,
  type MoyasarInvoice
} from '../_shared/moyasar.ts'

function json(body: unknown, status: number, origin: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'content-type, apikey, authorization, x-client-info',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Vary': 'Origin'
    }
  })
}

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const moyasarSecretKey = Deno.env.get('MOYASAR_SECRET_KEY') ?? ''
  const publicUrl = Deno.env.get('REZO_STYLE_PUBLIC_URL') ?? ''

  if (!supabaseUrl || !serviceRoleKey || !moyasarSecretKey || !publicUrl) {
    return json({ error: 'server_config_missing' }, 503, '*')
  }

  const allowedOrigin = new URL(publicUrl).origin
  const requestOrigin = req.headers.get('origin')
  if (requestOrigin && requestOrigin !== allowedOrigin) {
    return json({ error: 'origin_not_allowed' }, 403, allowedOrigin)
  }

  if (req.method === 'OPTIONS') return json({}, 200, allowedOrigin)
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, allowedOrigin)

  const body = await req.json().catch(() => ({}))
  const orderNumber = String(body?.order_number ?? '').trim()
  const accessToken = String(body?.access_token ?? '').trim()
  if (!orderNumber || !accessToken) return json({ error: 'missing_order_access' }, 400, allowedOrigin)

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  const { data: order, error: orderError } = await db
    .from('orders')
    .select('id, order_number, access_token, status, payment_status, grand_total, currency, reservation_expires_at')
    .eq('order_number', orderNumber)
    .eq('access_token', accessToken)
    .maybeSingle()

  if (orderError || !order) return json({ error: 'order_not_found' }, 404, allowedOrigin)
  if (order.payment_status === 'paid') return json({ status: 'paid', order_number: order.order_number }, 200, allowedOrigin)
  if (order.status === 'cancelled') return json({ error: 'order_cancelled' }, 409, allowedOrigin)

  const expiresAt = new Date(order.reservation_expires_at).getTime()
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    await db.rpc('rezo_style_cancel_unpaid_order', {
      p_order_id: order.id,
      p_reason: 'انتهاء مهلة الدفع قبل إنشاء فاتورة ميسر'
    })
    return json({ error: 'reservation_expired' }, 410, allowedOrigin)
  }

  const amount = Number(order.grand_total)
  const amountMinor = toMinorUnits(amount)
  if (!Number.isFinite(amount) || amount <= 0 || amountMinor < 100) {
    return json({ error: 'invalid_order_amount' }, 409, allowedOrigin)
  }

  const { data: pending } = await db
    .from('payment_requests')
    .select('*')
    .eq('order_id', order.id)
    .eq('provider', 'moyasar')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (pending?.provider_reference && pending?.payment_url) {
    const pendingExpiry = pending.expires_at ? new Date(pending.expires_at).getTime() : expiresAt
    if (pendingExpiry > Date.now()) {
      return json({
        status: 'pending',
        payment_url: pending.payment_url,
        invoice_id: pending.provider_reference,
        expires_at: pending.expires_at
      }, 200, allowedOrigin)
    }
  }

  // If a previous network response was lost, recover the provider invoice by metadata
  // before creating another one.
  try {
    const existingInvoices = await findInvoicesForOrder(moyasarSecretKey, order.id)
    const existing = existingInvoices.find((invoice) =>
      invoice.amount === amountMinor &&
      invoice.currency === order.currency &&
      ['initiated', 'on_hold', 'paid'].includes(invoice.status)
    )

    if (existing) {
      const providerExpiry = existing.expired_at || order.reservation_expires_at
      const requestPayload = {
        order_id: order.id,
        provider: 'moyasar',
        provider_reference: existing.id,
        payment_url: existing.url ?? null,
        amount,
        currency: order.currency,
        status: existing.status === 'paid' ? 'paid' : 'pending',
        expires_at: providerExpiry,
        sent_at: new Date().toISOString(),
        paid_at: existing.status === 'paid' ? new Date().toISOString() : null,
        metadata: { recovered_from_moyasar: true }
      }

      if (pending?.id) {
        await db.from('payment_requests').update(requestPayload).eq('id', pending.id)
      } else {
        await db.from('payment_requests').insert({ ...requestPayload, idempotency_key: crypto.randomUUID() })
      }

      if (existing.status === 'paid') {
        const payment = paidPayment(existing)
        await db.rpc('rezo_style_mark_order_paid', {
          p_order_id: order.id,
          p_external_reference: payment?.id ?? existing.id,
          p_payment_method: paymentMethod(payment),
          p_amount: amount
        })
        return json({ status: 'paid', order_number: order.order_number }, 200, allowedOrigin)
      }

      if (existing.url) {
        return json({
          status: 'pending',
          payment_url: existing.url,
          invoice_id: existing.id,
          expires_at: providerExpiry
        }, 200, allowedOrigin)
      }
    }
  } catch (error) {
    console.warn('Moyasar invoice recovery lookup failed', error instanceof Error ? error.message : String(error))
  }

  if (pending?.id) {
    await db.from('payment_requests').update({ status: 'retry_required' }).eq('id', pending.id)
  }

  const idempotencyKey = crypto.randomUUID()
  const { data: requestRow, error: requestInsertError } = await db
    .from('payment_requests')
    .insert({
      order_id: order.id,
      provider: 'moyasar',
      amount,
      currency: order.currency,
      status: 'pending',
      idempotency_key: idempotencyKey,
      expires_at: order.reservation_expires_at,
      metadata: { order_number: order.order_number }
    })
    .select('id')
    .single()

  if (requestInsertError || !requestRow) {
    const { data: concurrent } = await db
      .from('payment_requests')
      .select('provider_reference, payment_url, expires_at')
      .eq('order_id', order.id)
      .eq('provider', 'moyasar')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (concurrent?.payment_url) {
      return json({
        status: 'pending',
        payment_url: concurrent.payment_url,
        invoice_id: concurrent.provider_reference,
        expires_at: concurrent.expires_at
      }, 200, allowedOrigin)
    }

    return json({ error: 'payment_request_conflict' }, 409, allowedOrigin)
  }

  const orderPageUrl = new URL(`/orders/${encodeURIComponent(order.order_number)}`, publicUrl)
  orderPageUrl.searchParams.set('token', accessToken)
  const successUrl = new URL(orderPageUrl)
  successUrl.searchParams.set('payment', 'success')
  const callbackUrl = `${supabaseUrl}/functions/v1/rezo-style-moyasar-callback`

  try {
    const invoice = await moyasarRequest<MoyasarInvoice>(moyasarSecretKey, '/invoices', {
      method: 'POST',
      body: JSON.stringify({
        amount: amountMinor,
        currency: order.currency,
        description: `REZO STYLE | ${order.order_number}`,
        callback_url: callbackUrl,
        success_url: successUrl.toString(),
        back_url: orderPageUrl.toString(),
        expired_at: order.reservation_expires_at,
        metadata: {
          order_id: order.id,
          order_number: order.order_number
        }
      })
    })

    if (!invoice.id || !invoice.url) throw new Error('Moyasar invoice response is incomplete')

    const { error: updateError } = await db
      .from('payment_requests')
      .update({
        provider_reference: invoice.id,
        payment_url: invoice.url,
        sent_at: new Date().toISOString(),
        expires_at: invoice.expired_at || order.reservation_expires_at,
        metadata: { order_number: order.order_number, invoice_status: invoice.status }
      })
      .eq('id', requestRow.id)

    if (updateError) throw updateError

    await db.from('orders').update({ payment_status: 'pending' }).eq('id', order.id).eq('payment_status', 'unpaid')

    return json({
      status: 'pending',
      payment_url: invoice.url,
      invoice_id: invoice.id,
      expires_at: invoice.expired_at || order.reservation_expires_at
    }, 201, allowedOrigin)
  } catch (error) {
    await db.from('payment_requests').update({
      status: 'retry_required',
      metadata: {
        order_number: order.order_number,
        last_error: error instanceof Error ? error.message.slice(0, 300) : 'unknown_error'
      }
    }).eq('id', requestRow.id)

    return json({ error: 'moyasar_invoice_create_failed' }, 502, allowedOrigin)
  }
})
