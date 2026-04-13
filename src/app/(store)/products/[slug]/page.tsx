import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProductBySlug } from '@/lib/catalog'

export default async function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) notFound()

  return (
    <main className="bg-stone-50 py-16">
      <div className="container-shell grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="overflow-hidden rounded-[36px] bg-white shadow-soft">
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        </div>

        <div className="rounded-[36px] bg-white p-8 shadow-soft">
          <p className="text-xs font-semibold tracking-[0.3em] text-brand-gold">{product.category}</p>
          <h1 className="mt-3 text-3xl font-bold text-brand-navy sm:text-4xl">{product.name}</h1>
          <p className="mt-4 text-base leading-8 text-stone-600">{product.description}</p>

          <div className="mt-6 flex items-end gap-4">
            <div className="text-3xl font-bold text-brand-navy">{product.price} ر.س</div>
            {product.compareAtPrice ? <div className="text-lg text-stone-400 line-through">{product.compareAtPrice} ر.س</div> : null}
          </div>

          <div className="mt-6 grid gap-4 rounded-3xl bg-brand-sand/70 p-5 text-sm text-stone-700 sm:grid-cols-2">
            <div>
              <span className="font-bold text-brand-navy">الوصف المختصر:</span> {product.shortDescription}
            </div>
            <div>
              <span className="font-bold text-brand-navy">المخزون:</span> {product.stock} قطعة
            </div>
            <div>
              <span className="font-bold text-brand-navy">الألوان:</span> {product.colors.join('، ') || 'يحدد لاحقًا'}
            </div>
            <div>
              <span className="font-bold text-brand-navy">التقييم:</span> {product.rating} / 5 ({product.reviewCount} مراجعة)
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/cart" className="rounded-full bg-brand-navy px-7 py-4 text-sm font-bold text-white transition hover:opacity-90">
              أضف إلى السلة
            </Link>
            <Link href={`/collections/${product.categorySlug}`} className="rounded-full border border-brand-navy px-7 py-4 text-sm font-bold text-brand-navy transition hover:bg-brand-navy hover:text-white">
              عرض المجموعة
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
