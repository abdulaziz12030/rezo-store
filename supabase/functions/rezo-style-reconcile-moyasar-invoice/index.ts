import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { fetchInvoice, paidPayment, paymentMethod, toMinorUnits } from '../_shared/moyasar.ts'

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
  if (requestOrigin && requestOrigin !== allowedOrigin) return json({ error: 'origin_not_allowed' }, 403, allowedOrigin)
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
  if (order.payment_status === 'paid') return json({ status: 'paid', order_status: order.status }, 200, allowedOrigin)

  const { data: requestRow, error: requestError } = await db
    .from('payment_requests')
    .select('id, provider_reference, payment_url, amount, currency, status, expires_at')
    .eq('order_id', order.id)
    .eq('provider', 'moyasar')
    .not('provider_reference', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (requestError) return json({ error: 'payment_request_lookup_failed' }, 500, allowedOrigin)
  if (!requestRow?.provider_reference) {
    const expired = new Date(order.reservation_expires_at).getTime() <= Date.now()
    if (expired) {
      await db.rpc('rezo_style_cancel_unpaid_order', {
        p_order_id: order.id,
        p_reason: 'انتهاء مهلة الدفع بدون فاتورة ميسر'
      })
      return json({ status: 'expired' }, 200, allowedOrigin)
    }
    return json({ status: 'no_invoice' }, 200, allowedOrigin)
  }

  let invoice
  try {
    invoice = await fetchInvoice(moyasarSecretKey, requestRow.provider_reference)
  } catch (error) {
    console.error('Moyasar reconciliation fetch failed', error instanceof Error ? error.message : String(error))
    return json({ error: 'invoice_verification_failed' }, 502, allowedOrigin)
  }

  const expectedMinor = toMinorUnits(requestRow.amount)
  if (invoice.amount !== expectedMinor || invoice.currency !== requestRow.currency) {
    return json({ error: 'invoice_amount_mismatch' }, 409, allowedOrigin)
  }

  if (invoice.metadata?.order_id && invoice.metadata.order_id !== order.id) {
    return json({ error: 'invoice_order_mismatch' }, 409, allowedOrigin)
  }

  if (invoice.status === 'paid') {
    const payment = paidPayment(invoice)
    const method = paymentMethod(payment)
    const { error: paidError } = await db.rpc('rezo_style_mark_order_paid', {
      p_order_id: order.id,
      p_external_reference: payment?.id ?? invoice.id,
      p_payment_method: method,
      p_amount: Number(requestRow.amount)
    })

    if (paidError) return json({ error: 'order_payment_update_failed' }, 409, allowedOrigin)

    await db.from('payment_requests').update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      metadata: {
        invoice_status: invoice.status,
        payment_id: payment?.id ?? null,
        payment_method: method,
        reconciled: true
      }
    }).eq('id', requestRow.id)

    return json({ status: 'paid', order_status: 'paid' }, 200, allowedOrigin)
  }

  const statusMap: Record<string, string> = {
    initiated: 'pending',
    on_hold: 'pending',
    failed: 'failed',
    expired: 'expired',
    canceled: 'cancelled',
    voided: 'cancelled'
  }
  const localStatus = statusMap[invoice.status] ?? requestRow.status

  await db.from('payment_requests').update({
    status: localStatus,
    metadata: { invoice_status: invoice.status, reconciled: true }
  }).eq('id', requestRow.id)

  if (['expired', 'canceled', 'voided', 'failed'].includes(invoice.status)) {
    await db.rpc('rezo_style_cancel_unpaid_order', {
      p_order_id: order.id,
      p_reason: `Moyasar invoice ${invoice.status}`
    })
  }

  return json({
    status: localStatus,
    invoice_status: invoice.status,
    payment_url: requestRow.payment_url,
    expires_at: requestRow.expires_at
  }, 200, allowedOrigin)
})
