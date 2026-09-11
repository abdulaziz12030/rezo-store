import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { fetchInvoice, paidPayment, paymentMethod, toMinorUnits } from '../_shared/moyasar.ts'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const moyasarSecretKey = Deno.env.get('MOYASAR_SECRET_KEY') ?? ''
  if (!supabaseUrl || !serviceRoleKey || !moyasarSecretKey) return json({ error: 'server_config_missing' }, 503)

  // Never trust callback fields beyond the invoice id. Re-fetch the invoice directly
  // from Moyasar using the secret key before changing order or financial state.
  const callbackBody = await req.json().catch(() => ({}))
  const invoiceId = String(callbackBody?.id ?? '').trim()
  if (!invoiceId) return json({ error: 'invoice_id_missing' }, 400)

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  let invoice
  try {
    invoice = await fetchInvoice(moyasarSecretKey, invoiceId)
  } catch (error) {
    console.error('Unable to verify Moyasar invoice', error instanceof Error ? error.message : String(error))
    return json({ error: 'invoice_verification_failed' }, 502)
  }

  const { data: requestRow, error: requestError } = await db
    .from('payment_requests')
    .select('id, order_id, amount, currency, status')
    .eq('provider', 'moyasar')
    .eq('provider_reference', invoice.id)
    .maybeSingle()

  // It may be a valid Moyasar callback for another integration on the same merchant
  // account. Acknowledge it without touching REZO STYLE data.
  if (requestError || !requestRow) return json({ ok: true, ignored: 'unknown_invoice' })

  const expectedMinor = toMinorUnits(requestRow.amount)
  if (invoice.amount !== expectedMinor || invoice.currency !== requestRow.currency) {
    console.error('Moyasar invoice amount/currency mismatch', { invoiceId: invoice.id })
    return json({ error: 'invoice_amount_mismatch' }, 409)
  }

  if (invoice.metadata?.order_id && invoice.metadata.order_id !== requestRow.order_id) {
    console.error('Moyasar invoice metadata mismatch', { invoiceId: invoice.id })
    return json({ error: 'invoice_order_mismatch' }, 409)
  }

  if (invoice.status !== 'paid') {
    return json({ ok: true, ignored: `invoice_${invoice.status}` })
  }

  const payment = paidPayment(invoice)
  const externalReference = payment?.id ?? invoice.id
  const method = paymentMethod(payment)

  const { error: markPaidError } = await db.rpc('rezo_style_mark_order_paid', {
    p_order_id: requestRow.order_id,
    p_external_reference: externalReference,
    p_payment_method: method,
    p_amount: Number(requestRow.amount)
  })

  if (markPaidError) {
    console.error('Verified Moyasar payment could not be applied', {
      invoiceId: invoice.id,
      error: markPaidError.message
    })
    return json({ error: 'order_payment_update_failed' }, 409)
  }

  const { error: requestUpdateError } = await db
    .from('payment_requests')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      metadata: {
        invoice_status: invoice.status,
        payment_id: payment?.id ?? null,
        payment_method: method
      }
    })
    .eq('id', requestRow.id)

  if (requestUpdateError) {
    console.error('Payment request status update failed', requestUpdateError.message)
    return json({ error: 'payment_request_update_failed' }, 500)
  }

  return json({ ok: true, status: 'paid' })
})
