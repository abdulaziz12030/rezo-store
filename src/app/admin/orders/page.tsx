import { AdminShell } from '@/components/admin/admin-shell'
import { advanceOrderStatus, cancelUnpaidOrder } from '@/lib/actions/orders'
import { getAdminOrders } from '@/lib/orders'

const statusLabels: Record<string, string> = {
  pending_payment: 'بانتظار الدفع',
  paid: 'مدفوع',
  processing: 'قيد التجهيز',
  ready_to_ship: 'جاهز للشحن',
  shipped: 'تم الشحن',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  returned: 'مرتجع',
  partially_returned: 'مرتجع جزئيًا'
}

const paymentLabels: Record<string, string> = {
  unpaid: 'غير مدفوع',
  pending: 'الدفع معلق',
  paid: 'مدفوع',
  partially_refunded: 'مسترد جزئيًا',
  refunded: 'مسترد',
  failed: 'فشل الدفع',
  cancelled: 'ملغي'
}

const nextActions: Record<string, { target: string; label: string }> = {
  paid: { target: 'processing', label: 'بدء التجهيز' },
  processing: { target: 'ready_to_ship', label: 'جاهز للشحن' },
  ready_to_ship: { target: 'shipped', label: 'تأكيد الشحن' },
  shipped: { target: 'completed', label: 'تأكيد التسليم' }
}

const errorMessages: Record<string, string> = {
  'missing-data': 'بيانات العملية غير مكتملة.',
  'payment-required': 'لا يمكن بدء التجهيز قبل تأكيد الدفع إلكترونيًا.',
  'invalid-transition': 'انتقال حالة الطلب غير مسموح بهذا التسلسل.',
  'order-cancelled': 'الطلب ملغي ولا يمكن تحديث حالته.',
  'paid-cannot-cancel': 'الطلب المدفوع لا يُلغى بهذه العملية؛ يحتاج مسار استرداد مالي.',
  'update-failed': 'تعذر تحديث حالة الطلب.',
  'cancel-failed': 'تعذر إلغاء الطلب.'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ar-SA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Riyadh'
  }).format(new Date(value))
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const orders = await getAdminOrders()
  const unpaid = orders.filter((order) => order.payment_status !== 'paid' && order.status !== 'cancelled').length
  const active = orders.filter((order) => ['paid', 'processing', 'ready_to_ship', 'shipped'].includes(order.status)).length
  const completed = orders.filter((order) => order.status === 'completed').length

  return (
    <AdminShell title="إدارة الطلبات" description="متابعة الطلب من إنشائه حتى الدفع والتجهيز والشحن والتسليم، مع حفظ سجل تدقيق لكل تغيير إداري.">
      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {errorMessages[error] ?? 'تعذر تنفيذ العملية.'}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] bg-white p-6 shadow-soft"><div className="text-sm text-stone-500">بانتظار الدفع</div><div className="mt-3 text-3xl font-bold text-brand-navy">{unpaid}</div></div>
        <div className="rounded-[28px] bg-white p-6 shadow-soft"><div className="text-sm text-stone-500">قيد التنفيذ</div><div className="mt-3 text-3xl font-bold text-brand-navy">{active}</div></div>
        <div className="rounded-[28px] bg-white p-6 shadow-soft"><div className="text-sm text-stone-500">مكتملة</div><div className="mt-3 text-3xl font-bold text-brand-navy">{completed}</div></div>
      </div>

      {!orders.length ? (
        <section className="rounded-[28px] bg-white p-10 text-center shadow-soft">
          <h2 className="text-xl font-bold text-brand-navy">لا توجد طلبات حتى الآن</h2>
          <p className="mt-3 text-sm text-stone-600">ستظهر الطلبات هنا فور إنشائها من Checkout.</p>
        </section>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const next = order.payment_status === 'paid' ? nextActions[order.status] : undefined
            const canCancel = order.payment_status !== 'paid' && order.status !== 'cancelled'

            return (
              <article key={order.id} className="rounded-[28px] bg-white p-6 shadow-soft">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold text-brand-navy">{order.order_number}</h2>
                      <span className="rounded-full bg-brand-sand px-3 py-1 text-xs font-bold text-brand-navy">{statusLabels[order.status] ?? order.status}</span>
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">{paymentLabels[order.payment_status] ?? order.payment_status}</span>
                    </div>
                    <div className="mt-3 text-sm text-stone-600">{order.customer_name} · {order.customer_phone}</div>
                    <div className="mt-1 text-xs text-stone-400">{formatDate(order.placed_at)} · {order.order_items?.length ?? 0} صنف</div>
                  </div>
                  <div className="text-2xl font-bold text-brand-navy">{Number(order.grand_total).toFixed(2)} ر.س</div>
                </div>

                {(next || canCancel) ? (
                  <div className="mt-6 flex flex-wrap gap-3 border-t border-stone-100 pt-5">
                    {next ? (
                      <form action={advanceOrderStatus} className="flex flex-wrap items-end gap-3">
                        <input type="hidden" name="order_id" value={order.id} />
                        <input type="hidden" name="target_status" value={next.target} />
                        <input name="note" placeholder="ملاحظة اختيارية" className="rounded-xl border border-stone-300 px-3 py-2 text-sm" />
                        <button className="rounded-full bg-brand-navy px-5 py-2.5 text-sm font-bold text-white">{next.label}</button>
                      </form>
                    ) : null}

                    {canCancel ? (
                      <form action={cancelUnpaidOrder} className="flex flex-wrap items-end gap-3">
                        <input type="hidden" name="order_id" value={order.id} />
                        <input name="reason" placeholder="سبب الإلغاء" className="rounded-xl border border-stone-300 px-3 py-2 text-sm" />
                        <button className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-bold text-red-700">إلغاء وإعادة المخزون</button>
                      </form>
                    ) : null}
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </AdminShell>
  )
}
