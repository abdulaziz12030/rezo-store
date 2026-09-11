import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCategoryBySlug, getProductsByCategorySlug } from '@/lib/catalog'
import { ProductCard } from '@/components/product-card'
import { SectionTitle } from '@/components/section-title'
import type { Product } from '@/types'

function effectivePrice(product: Product) {
  const variants = product.variants ?? []
  const prices = variants.length ? variants.map((variant) => variant.priceOverride ?? product.price) : [product.price]
  return Math.min(...prices)
}

export default async function CollectionPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: string }>
}) {
  const { slug } = await params
  const { sort = 'newest' } = await searchParams
  const [category, categoryProducts] = await Promise.all([
    getCategoryBySlug(slug),
    getProductsByCategorySlug(slug)
  ])

  if (!category) notFound()

  const sorted = [...categoryProducts].sort((a, b) => {
    if (sort === 'price-asc') return effectivePrice(a) - effectivePrice(b)
    if (sort === 'price-desc') return effectivePrice(b) - effectivePrice(a)
    if (sort === 'name') return a.name.localeCompare(b.name, 'ar')
    return 0
  })

  return (
    <main className="bg-stone-50 py-16">
      <div className="container-shell">
        <SectionTitle eyebrow="المجموعة" title={category.name} text={category.description} />

        {sorted.length ? (
          <>
            <div className="mt-8 flex flex-col gap-4 rounded-[28px] border border-stone-200 bg-white p-4 shadow-soft sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-sm font-bold text-brand-navy">{sorted.length} منتج</div>
                <div className="mt-1 text-xs text-stone-500">استعرضي المجموعة ثم افتحي المنتج لاختيار المقاس واللون والمخزون المتاح.</div>
              </div>
              <form className="flex flex-wrap items-end gap-3">
                <label className="grid gap-2 text-xs font-semibold text-stone-600">
                  الترتيب
                  <select name="sort" defaultValue={sort} className="min-w-52 rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-gold">
                    <option value="newest">الأحدث أولًا</option>
                    <option value="price-asc">السعر: من الأقل للأعلى</option>
                    <option value="price-desc">السعر: من الأعلى للأقل</option>
                    <option value="name">الاسم</option>
                  </select>
                </label>
                <button className="rounded-full border border-brand-navy px-5 py-3 text-sm font-bold text-brand-navy">ترتيب</button>
                <Link href="/products" className="rounded-full bg-brand-navy px-5 py-3 text-sm font-bold text-white">كل المنتجات</Link>
              </form>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {sorted.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </>
        ) : (
          <div className="mt-10 rounded-[32px] bg-white p-10 text-center shadow-soft">
            <h2 className="text-2xl font-bold text-brand-navy">سيتم إضافة منتجات هذه المجموعة قريبًا</h2>
            <p className="mt-4 text-sm leading-7 text-stone-600">لا توجد منتجات نشطة في هذه المجموعة حاليًا. يمكنك العودة إلى جميع المنتجات واستكشاف المجموعات الأخرى.</p>
            <Link href="/products" className="mt-6 inline-block rounded-full bg-brand-navy px-6 py-3 text-sm font-bold text-white">عرض كل المنتجات</Link>
          </div>
        )}
      </div>
    </main>
  )
}
