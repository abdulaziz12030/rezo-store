import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getProductBySlug } from '@/lib/data'

export default async function ProductDetails({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = getProductBySlug(slug)

  if (!product) return notFound()

  return (
    <main className="container-shell py-16">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="relative h-[620px] overflow-hidden rounded-[36px] bg-stone-100 shadow-soft">
          <Image src={product.image} alt={product.name} fill className="object-cover" />
        </div>

        <div className="space-y-6">
          <p className="text-xs font-semibold tracking-[0.35em] text-brand-gold">{product.category}</p>
          <h1 className="text-4xl font-bold text-brand-navy">{product.name}</h1>
          <p className="text-lg leading-8 text-stone-600">{product.description}</p>

          <div className="flex items-center gap-4 border-y border-stone-200 py-6">
            <span className="text-3xl font-bold text-brand-navy">{product.price} ر.س</span>
            {product.compareAtPrice ? (
              <span className="text-lg text-stone-400 line-through">{product.compareAtPrice} ر.س</span>
            ) : null}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-bold text-brand-navy">الألوان المتاحة</h2>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((color) => (
                <span key={color} className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700">
                  {color}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-stone-50 p-6">
            <div className="flex items-center justify-between text-sm text-stone-600">
              <span>المخزون المتاح</span>
              <span>{product.stock} قطع</span>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-stone-600">
              <span>التقييم</span>
              <span>★ {product.rating} ({product.reviewCount})</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button className="rounded-full bg-brand-navy px-7 py-4 text-sm font-bold text-white transition hover:opacity-90">
              إضافة إلى السلة
            </button>
            <button className="rounded-full border border-brand-navy px-7 py-4 text-sm font-bold text-brand-navy transition hover:bg-brand-navy hover:text-white">
              شراء سريع
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
