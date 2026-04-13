import Link from 'next/link'
import { AdminShell } from '@/components/admin/admin-shell'
import { SetupNotice } from '@/components/admin/setup-notice'
import { getAdminCategories, getAdminProducts } from '@/lib/catalog'

export default async function AdminPage() {
  const [categories, products] = await Promise.all([getAdminCategories(), getAdminProducts()])

  const metrics = [
    { label: 'التصنيفات', value: String(categories.length) },
    { label: 'المنتجات', value: String(products.length) },
    { label: 'المنتجات المميزة', value: String(products.filter((item) => item.is_featured).length) },
    { label: 'المنتجات النشطة', value: String(products.filter((item) => item.is_active).length) }
  ]

  return (
    <AdminShell
      title="لوحة تحكم ريزو"
      description="ابدأ من هنا لإدارة التصنيفات والمنتجات ورفع صور المنتجات وربطها بالمجموعات المناسبة."
    >
      <SetupNotice />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            <h2 className="text-xl font-bold text-brand-navy">أحدث التصنيفات</h2>
            <Link href="/admin/categories" className="text-sm font-bold text-brand-gold">عرض الكل</Link>
          </div>
          <div className="mt-5 space-y-3">
            {categories.slice(0, 5).map((category) => (
              <div key={category.id} className="rounded-2xl border border-stone-200 p-4">
                <div className="font-bold text-brand-navy">{category.name}</div>
                <div className="mt-1 text-sm text-stone-600">/{category.slug}</div>
              </div>
            ))}
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
                <div className="mt-1 text-sm text-stone-600">{product.categories?.name ?? 'غير مصنف'} · {product.price} ر.س</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  )
}
