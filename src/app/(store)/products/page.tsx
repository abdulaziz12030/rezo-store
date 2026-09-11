import Link from 'next/link'
import { getCategories, getProducts } from '@/lib/catalog'
import { ProductCard } from '@/components/product-card'
import { SectionTitle } from '@/components/section-title'
import type { Product } from '@/types'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

function effectivePrices(product: Product) {
  const variants = product.variants ?? []
  const prices = variants.length
    ? variants.map((variant) => variant.priceOverride ?? product.price)
    : [product.price]
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

function isOnSale(product: Product) {
  if (product.compareAtPrice && product.compareAtPrice > product.price) return true
  return (product.variants ?? []).some((variant) => {
    const price = variant.priceOverride ?? product.price
    const compare = variant.compareAtPrice ?? product.compareAtPrice
    return Boolean(compare && compare > price)
  })
}

function isAvailable(product: Product) {
  return product.trackInventory === false || product.allowBackorder === true || product.stock > 0
}

function isLowStock(product: Product) {
  return product.trackInventory !== false && !product.allowBackorder && product.stock > 0 && product.stock <= (product.lowStockThreshold ?? 2)
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const [allProducts, categories] = await Promise.all([getProducts(), getCategories()])
  const params = await searchParams

  const q = first(params.q).trim()
  const category = first(params.category)
  const size = first(params.size)
  const color = first(params.color)
  const stock = first(params.stock) || 'all'
  const minPriceRaw = first(params.min_price)
  const maxPriceRaw = first(params.max_price)
  const sort = first(params.sort) || 'newest'
  const minPrice = minPriceRaw ? Number(minPriceRaw) : null
  const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : null

  const sizes = [...new Set(allProducts.flatMap((product) => (product.variants ?? []).map((variant) => variant.size).filter((value): value is string => Boolean(value))))].sort((a, b) => a.localeCompare(b, 'ar'))
  const colors = [...new Set(allProducts.flatMap((product) => (product.variants ?? []).map((variant) => variant.color).filter((value): value is string => Boolean(value))))].sort((a, b) => a.localeCompare(b, 'ar'))

  const normalizedQuery = q.toLocaleLowerCase('ar')
  const filtered = allProducts.filter((product) => {
    if (normalizedQuery) {
      const searchable = [
        product.name,
        product.shortDescription,
        product.description,
        product.category,
        product.sku ?? '',
        ...(product.variants ?? []).flatMap((variant) => [variant.sku, variant.size ?? '', variant.color ?? '', variant.optionLabel ?? ''])
      ].join(' ').toLocaleLowerCase('ar')
      if (!searchable.includes(normalizedQuery)) return false
    }

    if (category && product.categorySlug !== category) return false
    if (size && !(product.variants ?? []).some((variant) => variant.size === size)) return false
    if (color && !(product.variants ?? []).some((variant) => variant.color === color)) return false

    const prices = effectivePrices(product)
    if (minPrice != null && Number.isFinite(minPrice) && prices.max < minPrice) return false
    if (maxPrice != null && Number.isFinite(maxPrice) && prices.min > maxPrice) return false

    if (stock === 'available' && !isAvailable(product)) return false
    if (stock === 'low' && !isLowStock(product)) return false
    if (stock === 'sale' && !isOnSale(product)) return false

    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'price-asc') return effectivePrices(a).min - effectivePrices(b).min
    if (sort === 'price-desc') return effectivePrices(b).min - effectivePrices(a).min
    if (sort === 'name') return a.name.localeCompare(b.name, 'ar')
    return 0
  })

  const hasFilters = Boolean(q || category || size || color || minPriceRaw || maxPriceRaw || stock !== 'all' || sort !== 'newest')

  return (
    <main className="bg-stone-50 py-16">
      <div className="container-shell">
        <SectionTitle eyebrow="تسوقي الآن" title="كل المنتجات" text="اكتشفي منتجات REZO STYLE وابحثي حسب التصنيف والمقاس واللون والسعر وحالة التوفر." />

        <form className="mt-10 grid gap-4 rounded-[32px] border border-stone-200 bg-white p-5 shadow-soft lg:grid-cols-12">
          <label className="grid gap-2 text-xs font-semibold text-stone-600 lg:col-span-4">
            بحث
            <input name="q" defaultValue={q} placeholder="اسم المنتج، SKU أو اللون" className="rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-brand-gold" />
          </label>

          <label className="grid gap-2 text-xs font-semibold text-stone-600 lg:col-span-2">
            التصنيف
            <select name="category" defaultValue={category} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-gold">
              <option value="">كل التصنيفات</option>
              {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
            </select>
          </label>

          <label className="grid gap-2 text-xs font-semibold text-stone-600 lg:col-span-2">
            المقاس
            <select name="size" defaultValue={size} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-gold">
              <option value="">كل المقاسات</option>
              {sizes.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          <label className="grid gap-2 text-xs font-semibold text-stone-600 lg:col-span-2">
            اللون
            <select name="color" defaultValue={color} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-gold">
              <option value="">كل الألوان</option>
              {colors.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          <label className="grid gap-2 text-xs font-semibold text-stone-600 lg:col-span-2">
            الحالة
            <select name="stock" defaultValue={stock} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-gold">
              <option value="all">كل المنتجات</option>
              <option value="available">متوفر للطلب</option>
              <option value="low">قرب النفاد</option>
              <option value="sale">عليه خصم</option>
            </select>
          </label>

          <label className="grid gap-2 text-xs font-semibold text-stone-600 lg:col-span-2">
            السعر من
            <input name="min_price" type="number" min="0" step="1" defaultValue={minPriceRaw} placeholder="0" className="rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-brand-gold" />
          </label>

          <label className="grid gap-2 text-xs font-semibold text-stone-600 lg:col-span-2">
            السعر إلى
            <input name="max_price" type="number" min="0" step="1" defaultValue={maxPriceRaw} placeholder="500" className="rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-brand-gold" />
          </label>

          <label className="grid gap-2 text-xs font-semibold text-stone-600 lg:col-span-3">
            الترتيب
            <select name="sort" defaultValue={sort} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-gold">
              <option value="newest">الأحدث أولًا</option>
              <option value="price-asc">السعر: من الأقل للأعلى</option>
              <option value="price-desc">السعر: من الأعلى للأقل</option>
              <option value="name">الاسم</option>
            </select>
          </label>

          <div className="flex flex-wrap items-end gap-3 lg:col-span-5">
            <button className="rounded-full bg-brand-navy px-6 py-3 text-sm font-bold text-white transition hover:opacity-90">تطبيق الفلاتر</button>
            {hasFilters ? <Link href="/products" className="rounded-full border border-stone-300 px-6 py-3 text-sm font-bold text-stone-600 transition hover:border-brand-navy hover:text-brand-navy">مسح الفلاتر</Link> : null}
          </div>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-stone-600">تم العثور على <span className="font-bold text-brand-navy">{sorted.length}</span> من أصل {allProducts.length} منتج</p>
          {hasFilters ? <p className="text-xs text-stone-400">الفلاتر الحالية تطبق على المنتجات والخيارات النشطة المتاحة في المتجر.</p> : null}
        </div>

        {sorted.length ? (
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {sorted.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="mt-8 rounded-[32px] border border-stone-200 bg-white p-10 text-center shadow-soft">
            <h2 className="text-2xl font-bold text-brand-navy">لم نجد منتجات مطابقة</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone-600">جرّبي توسيع نطاق السعر أو إزالة بعض خيارات المقاس واللون أو البحث بعبارة أقصر.</p>
            <Link href="/products" className="mt-6 inline-block rounded-full bg-brand-navy px-6 py-3 text-sm font-bold text-white">عرض كل المنتجات</Link>
          </div>
        )}
      </div>
    </main>
  )
}
