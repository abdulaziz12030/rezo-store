const metrics = [
  { label: 'إجمالي الطلبات', value: '128' },
  { label: 'إجمالي العملاء', value: '54' },
  { label: 'الطلبات الجديدة', value: '9' },
  { label: 'المنتجات النشطة', value: '6' }
]

const orders = [
  { id: 'RZ-1008', customer: 'سارة', total: '220 ر.س', status: 'مدفوع' },
  { id: 'RZ-1009', customer: 'نجلاء', total: '310 ر.س', status: 'قيد التجهيز' },
  { id: 'RZ-1010', customer: 'ريم', total: '580 ر.س', status: 'بانتظار الدفع' }
]

export default function AdminPage() {
  return (
    <main className="bg-stone-50 py-12">
      <div className="container-shell space-y-8">
        <div>
          <p className="text-xs font-semibold tracking-[0.35em] text-brand-gold">ADMIN</p>
          <h1 className="mt-2 text-3xl font-bold text-brand-navy">لوحة تحكم ريزو</h1>
          <p className="mt-3 text-sm leading-7 text-stone-600">
            لوحة أولية تعرض شكل الإدارة المطلوب: الطلبات، العملاء، المنتجات، والإحصائيات. يتم تحويلها لاحقًا إلى لوحة ديناميكية مرتبطة بقاعدة البيانات.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-[28px] bg-white p-6 shadow-soft">
              <div className="text-sm text-stone-500">{metric.label}</div>
              <div className="mt-3 text-3xl font-bold text-brand-navy">{metric.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] bg-white p-6 shadow-soft">
            <h2 className="text-xl font-bold text-brand-navy">آخر الطلبات</h2>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[520px] text-right text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="px-3 py-3">رقم الطلب</th>
                    <th className="px-3 py-3">العميل</th>
                    <th className="px-3 py-3">الإجمالي</th>
                    <th className="px-3 py-3">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-stone-100">
                      <td className="px-3 py-4 font-medium text-brand-navy">{order.id}</td>
                      <td className="px-3 py-4">{order.customer}</td>
                      <td className="px-3 py-4">{order.total}</td>
                      <td className="px-3 py-4">{order.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-6 shadow-soft">
            <h2 className="text-xl font-bold text-brand-navy">أقسام الإدارة</h2>
            <div className="mt-5 grid gap-4">
              {['إدارة المنتجات', 'إدارة الطلبات', 'إدارة العملاء', 'إدارة التقييمات', 'إعدادات المتجر', 'ربط الدفع والشحن'].map((item) => (
                <div key={item} className="rounded-2xl border border-stone-200 p-4 text-sm font-medium text-stone-700">
                  {item}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
