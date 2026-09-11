import Link from 'next/link'
import { AdminShell } from '@/components/admin/admin-shell'
import { SetupNotice } from '@/components/admin/setup-notice'
import { getAdminCategories, getAdminProducts } from '@/lib/catalog'
import { getAdminOrders } from '@/lib/orders'

export default async function AdminPage() {
  const [categories, products, orders] = await Promise.all([
    getAdminCategories(),
    getAdminProducts(),
    getAdminOrders(20)
  ])

  const paidRevenue = orders
    .filter((order) => order.payment_status === 'paid')
    .reduce((sum, order) => sum + Number(order.grand_total || 0), 0)

  const metrics = [
    { label: 'الطلبات', value: String(orders.length) },
    { label: 'بانتظار الدفع', value: String(orders.filter((order) => order.status === 'pending_payment').length) },
    { label: 'مبيعات مدفوعة', value: `${paidRevenue.toFixed(2)} ر.س` },
    { label: 'المنتجات', value: String(products.length) },
    { label: 'التصنيفات', value: String(categories.length) },
    { label: 'مخزون منخفض', value: String(products.filter((item) => Number(item.stock) <= Number(item.low_stock_threshold ?? 2)).length) }
  ]

  return (
    <AdminShell
      title="لوحة تحكم REZO STYLE"
      description="ملخص تشغيلي للطلبات والمبيعات والمنتجات والمخزون. الدفع والشحن يُداران بمسارات مستقلة وآمنة."
    >
      <SetupNotice />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-[28px] bg-white p-6 shadow-soft">
            <div className="text-sm text-stone-500">{metric.label}</div>
            <div className="mt-3 text-3xl font-bold text-brand-navy">{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[28px] bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-brand-navy">أحدث الطلبات</h2>
            <Link href="/admin/orders" className="text-sm font-bold text-brand-gold">عرض الكل</Link>
          </div>
          <div className="mt-5 space-y-3">
            {orders.length ? orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 p-4">
                <div>
                  <div className="font-bold text-brand-navy">{order.order_number}</div>
                  <div className="mt-1 text-sm text-stone-600">{order.customer_name} · {order.status}</div>
                </div>
                <div className="font-bold text-brand-navy">{Number(order.grand_total).toFixed(2)} ر.س</div>
              </div>
            )) : <div className="rounded-2xl bg-stone-50 p-5 text-sm text-stone-600">لا توجد طلبات بعد.</div>}
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-brand-navy">أحدث المنتجات</h2>
            <Link href="/admin/products" className="text-sm font-bold text-brand-gold">عرض الكل</Link>
          </div>
          <div className="mt-5 space-y-3">
            {products.slice(0, 5).map((product) => (
              <div key={product.id} className="rounded-2xl border border-stone-200 p-4">
                <div className="font-bold text-brand-navy">{product.name}</div>
                <div className="mt-1 text-sm text-stone-600">{product.categories?.name ?? 'غير مصنف'} · {product.price} ر.س · المخزون {product.stock}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  )
}
