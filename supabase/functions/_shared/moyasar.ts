export type MoyasarPayment = {
  id: string
  status: string
  amount: number
  source?: {
    type?: string
    company?: string
  } | null
}

export type MoyasarInvoice = {
  id: string
  status: string
  amount: number
  currency: string
  url?: string | null
  expired_at?: string | null
  metadata?: Record<string, string> | null
  payments?: MoyasarPayment[] | null
}

const API_BASE = 'https://api.moyasar.com/v1'

function authHeader(secretKey: string) {
  return `Basic ${btoa(`${secretKey}:`)}`
}

export async function moyasarRequest<T>(secretKey: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Authorization': authHeader(secretKey),
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof body?.message === 'string' ? body.message : `Moyasar HTTP ${response.status}`
    throw new Error(message)
  }

  return body as T
}

export async function fetchInvoice(secretKey: string, invoiceId: string) {
  return moyasarRequest<MoyasarInvoice>(secretKey, `/invoices/${encodeURIComponent(invoiceId)}`)
}

export async function findInvoicesForOrder(secretKey: string, orderId: string) {
  const params = new URLSearchParams({ 'metadata[order_id]': orderId })
  const result = await moyasarRequest<{ invoices?: MoyasarInvoice[] }>(secretKey, `/invoices?${params.toString()}`)
  return result.invoices ?? []
}

export function paidPayment(invoice: MoyasarInvoice) {
  return (invoice.payments ?? []).find((payment) => ['paid', 'captured'].includes(payment.status)) ?? null
}

export function paymentMethod(payment: MoyasarPayment | null) {
  if (!payment?.source?.type) return 'moyasar'
  return [payment.source.type, payment.source.company].filter(Boolean).join(':')
}

export function toMinorUnits(amount: number | string) {
  return Math.round(Number(amount) * 100)
}
