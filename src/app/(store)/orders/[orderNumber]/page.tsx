import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function OrderPage({
  params,
  searchParams
}: {
  params: Promise<{ orderNumber: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { orderNumber } = await params
  const { token } = await searchParams
  if (!token) notFound()

  const supabase = getSupabaseAdmin()
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, payment_status, fulfillment_status,
      subtotal, discount_total, shipping_total, grand_total,
      customer_name, customer_phone, customer_email, shipping_address,
      placed_at,
      order_items(id, product_name, variant_label, sku, quantity, unit_price, line_total)
    `)
    .eq('order_number', orderNumber)
    .eq('access_token', token)
    .maybeSingle()

  if (error || !order) notFound()

  const items = (order.order_items ?? []) as Array<{
    id: string
    product_name: string
    variant_label: string | null
    sku: string | null
    quantity: number
    unit_price: number | string
    line_total: number | string
  }>

  return (
    <main className="container-shell py-16">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-[32px] border border-stone-200 bg-white p-8 shadow-soft">
          <p className="text-xs font-semibold tracking-[0.3em] text-brand-gold">REZO STYLE</p>
          <h1 className="mt-3 text-3xl font-bold text-brand-navy">تم إنشاء الطلب</h1>
          <p className="mt-3 text-sm leading-7 text-stone-600">رقم الطلب: <span className="font-bold text-brand-navy">{order.order_number}</span></p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-stone-50 p-4 text-sm"><div className="text-stone-500">حالة الطلب</div><div className="mt-2 font-bold text-brand-navy">{order.status}</div></div>
            <div className="rounded-2xl bg-stone-50 p-4 text-sm"><div className="text-stone-500">حالة الدفع</div><div className="mt-2 font-bold text-brand-navy">{order.payment_status}</div></div>
            <div className="rounded-2xl bg-stone-50 p-4 text-sm"><div className="text-stone-500">الإجمالي</div><div className="mt-2 font-bold text-brand-navy">{Number(order.grand_total).toFixed(2)} ر.س</div></div>
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
            الطلب محجوز في النظام والمخزون محفوظ له. بوابة الدفع الإلكتروني لم تُربط بهذا الفرع بعد؛ ستكون الخطوة التالية قبل إطلاق المتجر.
          </div>
        </section>

        <section className="rounded-[32px] border border-stone-200 bg-white p-8 shadow-soft">
          <h2 className="text-xl font-bold text-brand-navy">تفاصيل الطلب</h2>
          <div className="mt-6 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col justify-between gap-3 border-b border-stone-100 pb-4 sm:flex-row">
                <div>
                  <div className="font-bold text-brand-navy">{item.product_name}</div>
                  {item.variant_label ? <div className="mt-1 text-sm text-stone-500">{item.variant_label}</div> : null}
                  {item.sku ? <div className="mt-1 text-xs text-stone-400">SKU: {item.sku}</div> : null}
                  <div className="mt-1 text-sm text-stone-500">الكمية: {item.quantity}</div>
                </div>
                <div className="font-bold text-brand-navy">{Number(item.line_total).toFixed(2)} ر.س</div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2 text-sm text-stone-700">
            <div className="flex justify-between"><span>الإجمالي الفرعي</span><span>{Number(order.subtotal).toFixed(2)} ر.س</span></div>
            <div className="flex justify-between"><span>الخصم</span><span>{Number(order.discount_total).toFixed(2)} ر.س</span></div>
            <div className="flex justify-between"><span>الشحن</span><span>{Number(order.shipping_total).toFixed(2)} ر.س</span></div>
            <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-bold text-brand-navy"><span>الإجمالي</span><span>{Number(order.grand_total).toFixed(2)} ر.س</span></div>
          </div>
        </section>

        <div className="text-center">
          <Link href="/products" className="inline-flex rounded-full border border-brand-navy px-6 py-3 text-sm font-bold text-brand-navy">العودة للتسوق</Link>
        </div>
      </div>
    </main>
  )
}
