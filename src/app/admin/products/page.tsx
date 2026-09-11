import Link from 'next/link'
import { AdminShell } from '@/components/admin/admin-shell'
import { SetupNotice } from '@/components/admin/setup-notice'
import { getAdminProducts } from '@/lib/catalog'
import type { DbProduct } from '@/types'

function productImage(product: DbProduct) {
  const primary = [...(product.product_images ?? [])]
    .sort((a, b) => Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)) || (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]
  return primary?.image_url ?? product.image_url
}

function inventoryState(product: DbProduct) {
  if (product.track_inventory === false) return { label: 'غير متتبع', className: 'bg-stone-100 text-stone-600' }
  if (product.allow_backorder) return { label: `${product.stock} · طلب مسبق`, className: 'bg-blue-50 text-blue-700' }
  if (Number(product.stock) <= 0) return { label: 'نفد', className: 'bg-red-50 text-red-700' }
  if (Number(product.stock) <= Number(product.low_stock_threshold ?? 2)) return { label: `${product.stock} · منخفض`, className: 'bg-amber-50 text-amber-800' }
  return { label: String(product.stock), className: 'bg-emerald-50 text-emerald-700' }
}

export default async function AdminProductsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { q = '', status = 'all' } = await searchParams
  const products = await getAdminProducts()
  const normalizedQuery = q.trim().toLowerCase()

  const filtered = products.filter((product) => {
    const variants = product.product_variants ?? []
    const searchable = [
      product.name,
      product.sku ?? '',
      product.slug,
      product.categories?.name ?? '',
      ...variants.map((variant) => variant.sku)
    ].join(' ').toLowerCase()
    if (normalizedQuery && !searchable.includes(normalizedQuery)) return false

    const lowStock = product.track_inventory !== false && Number(product.stock) > 0 && Number(product.stock) <= Number(product.low_stock_threshold ?? 2)
    const outOfStock = product.track_inventory !== false && Number(product.stock) <= 0 && !product.allow_backorder
    if (status === 'active') return product.is_active
    if (status === 'hidden') return !product.is_active
    if (status === 'low') return lowStock
    if (status === 'out') return outOfStock
    return true
  })

  const activeCount = products.filter((product) => product.is_active).length
  const lowStockCount = products.filter((product) => product.track_inventory !== false && Number(product.stock) > 0 && Number(product.stock) <= Number(product.low_stock_threshold ?? 2)).length
  const outOfStockCount = products.filter((product) => product.track_inventory !== false && Number(product.stock) <= 0 && !product.allow_backorder).length

  return (
    <AdminShell title="إدارة المنتجات" description="إدارة المنتجات والأسعار والصور والمقاسات والألوان والمخزون في REZO STYLE.">
      <SetupNotice />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow-soft"><div className="text-xs text-stone-500">إجمالي المنتجات</div><div className="mt-2 text-3xl font-bold text-brand-navy">{products.length}</div></div>
        <div className="rounded-3xl bg-white p-5 shadow-soft"><div className="text-xs text-stone-500">النشطة</div><div className="mt-2 text-3xl font-bold text-emerald-700">{activeCount}</div></div>
        <div className="rounded-3xl bg-white p-5 shadow-soft"><div className="text-xs text-stone-500">قرب النفاد</div><div className="mt-2 text-3xl font-bold text-amber-700">{lowStockCount}</div></div>
        <div className="rounded-3xl bg-white p-5 shadow-soft"><div className="text-xs text-stone-500">نفد المخزون</div><div className="mt-2 text-3xl font-bold text-red-700">{outOfStockCount}</div></div>
      </div>

      <div className="flex flex-col gap-4 rounded-[28px] bg-white p-5 shadow-soft lg:flex-row lg:items-end lg:justify-between">
        <form className="grid flex-1 gap-3 sm:grid-cols-[minmax(220px,1fr)_180px_auto]">
          <label className="grid gap-2 text-xs font-medium text-stone-600">
            بحث
            <input name="q" defaultValue={q} placeholder="اسم، SKU، تصنيف أو رابط" className="rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-brand-gold" />
          </label>
          <label className="grid gap-2 text-xs font-medium text-stone-600">
            الحالة
            <select name="status" defaultValue={status} className="rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-brand-gold">
              <option value="all">الكل</option>
              <option value="active">نشط</option>
              <option value="hidden">مخفي</option>
              <option value="low">قرب النفاد</option>
              <option value="out">نفد المخزون</option>
            </select>
          </label>
          <button className="rounded-full border border-brand-navy px-5 py-3 text-sm font-bold text-brand-navy">تطبيق</button>
        </form>
        <Link href="/admin/products/new" className="rounded-full bg-brand-navy px-6 py-3 text-center text-sm font-bold text-white transition hover:opacity-90">
          إضافة منتج جديد
        </Link>
      </div>

      <div className="rounded-[28px] bg-white p-6 shadow-soft">
        <div className="mb-4 text-sm text-stone-500">عرض {filtered.length} من {products.length} منتج</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-right text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th className="px-3 py-3">المنتج</th>
                <th className="px-3 py-3">SKU</th>
                <th className="px-3 py-3">التصنيف</th>
                <th className="px-3 py-3">السعر</th>
                <th className="px-3 py-3">المخزون</th>
                <th className="px-3 py-3">الخيارات</th>
                <th className="px-3 py-3">الظهور</th>
                <th className="px-3 py-3">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const image = productImage(product)
                const inventory = inventoryState(product)
                const variants = product.product_variants ?? []
                return (
                  <tr key={product.id} className="border-b border-stone-100 align-middle">
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-12 overflow-hidden rounded-xl bg-stone-100">
                          {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[10px] text-stone-400">بدون صورة</div>}
                        </div>
                        <div>
                          <div className="font-bold text-brand-navy">{product.name}</div>
                          <div className="mt-1 text-xs text-stone-400">/{product.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 font-mono text-xs text-stone-600">{product.sku || '—'}</td>
                    <td className="px-3 py-4">{product.categories?.name ?? 'غير مصنف'}</td>
                    <td className="px-3 py-4">
                      <div className="font-semibold text-brand-navy">{Number(product.price).toFixed(2)} ر.س</div>
                      {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) ? <div className="mt-1 text-xs text-stone-400 line-through">{Number(product.compare_at_price).toFixed(2)} ر.س</div> : null}
                    </td>
                    <td className="px-3 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${inventory.className}`}>{inventory.label}</span></td>
                    <td className="px-3 py-4">{variants.length ? `${variants.filter((variant) => variant.is_active).length}/${variants.length}` : 'بدون خيارات'}</td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${product.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>{product.is_active ? 'نشط' : 'مخفي'}</span>
                        {product.is_featured ? <span className="rounded-full bg-brand-sand px-3 py-1 text-xs font-bold text-brand-navy">مميز</span> : null}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <Link href={`/admin/products/${product.id}/edit`} className="font-bold text-brand-gold">تعديل وإدارة</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!filtered.length ? <div className="py-10 text-center text-sm text-stone-500">لا توجد منتجات مطابقة للبحث أو الفلتر الحالي.</div> : null}
      </div>
    </AdminShell>
  )
}
