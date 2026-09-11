import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProductBySlug } from '@/lib/catalog'
import { addToCart } from '@/lib/actions/cart'

function variantLabel(variant: { optionLabel?: string; size?: string; color?: string }) {
  return [variant.optionLabel, variant.size, variant.color]
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)
    .join(' · ')
}

export default async function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) notFound()

  const images = product.images?.length ? product.images : [{ id: 'primary', url: product.image, altText: product.name }]
  const variants = product.variants ?? []
  const inventoryTracked = product.trackInventory !== false
  const canOrder = !inventoryTracked || product.allowBackorder || product.stock > 0

  return (
    <main className="bg-stone-50 py-16">
      <div className="container-shell grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-4">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[36px] bg-white shadow-soft">
            <Image
              src={images[0]?.url ?? product.image}
              alt={images[0]?.altText ?? product.name}
              fill
              priority
              sizes="(min-width: 1024px) 52vw, 100vw"
              className="object-cover"
            />
          </div>

          {images.length > 1 ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.slice(1, 5).map((image) => (
                <div key={image.id} className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-soft">
                  <Image src={image.url} alt={image.altText ?? product.name} fill sizes="180px" className="object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <div className="rounded-[36px] bg-white p-8 shadow-soft">
          <p className="text-xs font-semibold tracking-[0.3em] text-brand-gold">{product.category}</p>
          <h1 className="mt-3 text-3xl font-bold text-brand-navy sm:text-4xl">{product.name}</h1>
          {product.sku ? <p className="mt-2 text-xs text-stone-400">SKU: {product.sku}</p> : null}
          <p className="mt-4 text-base leading-8 text-stone-600">{product.description}</p>

          <div className="mt-6 flex items-end gap-4">
            <div className="text-3xl font-bold text-brand-navy">{product.price.toFixed(2)} ر.س</div>
            {product.compareAtPrice ? <div className="text-lg text-stone-400 line-through">{product.compareAtPrice.toFixed(2)} ر.س</div> : null}
          </div>

          <div className="mt-6 grid gap-4 rounded-3xl bg-brand-sand/70 p-5 text-sm text-stone-700 sm:grid-cols-2">
            <div>
              <span className="font-bold text-brand-navy">الوصف المختصر:</span> {product.shortDescription || '—'}
            </div>
            <div>
              <span className="font-bold text-brand-navy">المخزون:</span> {inventoryTracked ? `${product.stock} قطعة` : 'متاح بدون تتبع كمي'}
            </div>
            <div>
              <span className="font-bold text-brand-navy">الألوان:</span> {product.colors.join('، ') || 'بحسب الخيار'}
            </div>
            <div>
              <span className="font-bold text-brand-navy">الحالة:</span> {canOrder ? 'متاح للطلب' : 'نفد المخزون'}
            </div>
          </div>

          <form action={addToCart} className="mt-8 space-y-5">
            <input type="hidden" name="product_id" value={product.id} />

            {variants.length ? (
              <label className="grid gap-2 text-sm font-bold text-brand-navy">
                اختاري الخيار
                <select
                  name="variant_id"
                  required
                  defaultValue=""
                  className="rounded-2xl border border-stone-300 bg-white px-4 py-4 text-sm font-medium text-stone-700 outline-none focus:border-brand-gold"
                >
                  <option value="" disabled>اختيار المقاس / اللون</option>
                  {variants.map((variant) => {
                    const price = variant.priceOverride ?? product.price
                    const unavailable = inventoryTracked && !product.allowBackorder && variant.stock <= 0
                    const stockLabel = inventoryTracked ? (unavailable ? ' — نفد' : ` — ${variant.stock} متاح`) : ''
                    return (
                      <option key={variant.id} value={variant.id} disabled={unavailable}>
                        {variantLabel(variant) || variant.sku} — {price.toFixed(2)} ر.س{stockLabel}
                      </option>
                    )
                  })}
                </select>
              </label>
            ) : null}

            <label className="grid max-w-32 gap-2 text-sm font-bold text-brand-navy">
              الكمية
              <input
                type="number"
                name="quantity"
                defaultValue={1}
                min={1}
                max={20}
                className="rounded-2xl border border-stone-300 px-4 py-3 text-center outline-none focus:border-brand-gold"
              />
            </label>

            <div className="flex flex-wrap gap-4">
              <button
                disabled={!canOrder}
                className="rounded-full bg-brand-navy px-7 py-4 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {canOrder ? 'أضف إلى السلة' : 'نفد المخزون'}
              </button>
              <Link href={`/collections/${product.categorySlug}`} className="rounded-full border border-brand-navy px-7 py-4 text-sm font-bold text-brand-navy transition hover:bg-brand-navy hover:text-white">
                عرض المجموعة
              </Link>
            </div>
          </form>

          <p className="mt-5 text-xs leading-6 text-stone-500">
            يتم التحقق من السعر والمخزون مرة أخرى على السيرفر عند الإضافة للسلة، ولا يعتمد النظام على السعر الظاهر في المتصفح.
          </p>
        </div>
      </div>
    </main>
  )
}
