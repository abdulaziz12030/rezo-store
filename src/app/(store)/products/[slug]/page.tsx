import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProductGallery } from '@/components/store/product-gallery'
import { ProductPurchasePanel } from '@/components/store/product-purchase-panel'
import { addToCart } from '@/lib/actions/cart'
import { getProductBySlug } from '@/lib/catalog'
import type { Product } from '@/types'

function salePercent(price: number, compareAt?: number) {
  if (!compareAt || compareAt <= price) return null
  return Math.round(((compareAt - price) / compareAt) * 100)
}

function SimpleProductPurchase({ product }: { product: Product }) {
  const inventoryTracked = product.trackInventory !== false
  const canBackorder = product.allowBackorder === true
  const inStock = !inventoryTracked || canBackorder || product.stock > 0
  const lowStock = inventoryTracked && !canBackorder && product.stock > 0 && product.stock <= (product.lowStockThreshold ?? 2)
  const discount = salePercent(product.price, product.compareAtPrice)
  const maxQuantity = inventoryTracked && !canBackorder ? Math.max(1, Math.min(20, product.stock)) : 20

  return (
    <div className="space-y-7">
      <div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="text-3xl font-bold text-brand-navy">{product.price.toFixed(2)} ر.س</div>
          {product.compareAtPrice && product.compareAtPrice > product.price ? (
            <div className="pb-1 text-lg text-stone-400 line-through">{product.compareAtPrice.toFixed(2)} ر.س</div>
          ) : null}
          {discount ? <span className="mb-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">خصم {discount}%</span> : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
          {!inventoryTracked ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">متاح للطلب</span> : null}
          {canBackorder && product.stock <= 0 ? <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">متاح بالطلب المسبق</span> : null}
          {lowStock ? <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">بقي {product.stock} فقط</span> : null}
          {inventoryTracked && !canBackorder && product.stock <= 0 ? <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">نفد المخزون</span> : null}
          {product.sku ? <span className="rounded-full bg-stone-100 px-3 py-1 font-mono text-stone-600">SKU: {product.sku}</span> : null}
        </div>
      </div>

      <form action={addToCart} className="space-y-5">
        <input type="hidden" name="product_id" value={product.id} />
        <label className="grid max-w-36 gap-2 text-sm font-bold text-brand-navy">
          الكمية
          <input
            type="number"
            name="quantity"
            defaultValue={1}
            min={1}
            max={maxQuantity}
            disabled={!inStock}
            className="rounded-2xl border border-stone-300 px-4 py-3 text-center outline-none focus:border-brand-gold disabled:bg-stone-100"
          />
        </label>
        <button
          disabled={!inStock}
          className="w-full rounded-full bg-brand-navy px-7 py-4 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {inStock ? 'أضف إلى السلة' : 'نفد المخزون'}
        </button>
      </form>

      <div className="grid gap-3 rounded-3xl bg-brand-sand/60 p-5 text-sm leading-7 text-stone-700 sm:grid-cols-2">
        <div><span className="font-bold text-brand-navy">المخزون:</span> {!inventoryTracked ? 'متاح' : `${product.stock} قطعة`}</div>
        <div><span className="font-bold text-brand-navy">حالة الطلب:</span> {inStock ? 'متاح للطلب' : 'غير متاح حاليًا'}</div>
      </div>
    </div>
  )
}

export default async function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) notFound()

  const images = product.images?.length
    ? product.images
    : [{ id: 'primary', url: product.image, altText: product.name, isPrimary: true, sortOrder: 0 }]
  const hasVariants = Boolean(product.variants?.length)

  return (
    <main className="bg-stone-50 py-10 sm:py-16">
      <div className="container-shell grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        {images.length > 1 ? (
          <ProductGallery images={images} productName={product.name} />
        ) : (
          <section>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[36px] bg-white shadow-soft">
              <Image
                src={images[0]?.url ?? product.image}
                alt={images[0]?.altText || product.name}
                fill
                priority
                sizes="(min-width: 1024px) 52vw, 100vw"
                className="object-cover"
              />
            </div>
          </section>
        )}

        <section className="rounded-[36px] bg-white p-6 shadow-soft sm:p-8 lg:sticky lg:top-6">
          <div className="border-b border-stone-100 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold tracking-[0.28em] text-brand-gold">{product.category}</p>
              {product.featured ? <span className="rounded-full bg-brand-sand px-3 py-1 text-xs font-bold text-brand-navy">مختار من REZO STYLE</span> : null}
            </div>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-brand-navy sm:text-4xl">{product.name}</h1>
            {product.shortDescription ? <p className="mt-4 text-base leading-8 text-stone-600">{product.shortDescription}</p> : null}
          </div>

          <div className="py-7">
            {hasVariants ? <ProductPurchasePanel product={product} /> : <SimpleProductPurchase product={product} />}
          </div>

          <div className="border-t border-stone-100 pt-6">
            <h2 className="text-lg font-bold text-brand-navy">تفاصيل المنتج</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-8 text-stone-600">{product.description || 'سيتم إضافة تفاصيل هذا المنتج قريبًا.'}</p>
          </div>

          <div className="mt-7 flex flex-wrap gap-3 border-t border-stone-100 pt-6">
            <Link
              href={`/collections/${product.categorySlug}`}
              className="rounded-full border border-brand-navy px-6 py-3 text-sm font-bold text-brand-navy transition hover:bg-brand-navy hover:text-white"
            >
              عرض بقية المجموعة
            </Link>
            <Link href="/products" className="rounded-full px-4 py-3 text-sm font-bold text-stone-500 transition hover:text-brand-navy">
              جميع المنتجات
            </Link>
          </div>

          <p className="mt-5 text-xs leading-6 text-stone-400">
            يتم التحقق من السعر والمخزون مرة أخرى على السيرفر عند الإضافة إلى السلة، لذلك تبقى بيانات الطلب محمية حتى لو تغير المخزون أثناء التصفح.
          </p>
        </section>
      </div>
    </main>
  )
}
