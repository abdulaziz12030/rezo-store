import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/types'

function salePercent(price: number, compareAt?: number) {
  if (!compareAt || compareAt <= price) return 0
  return Math.round(((compareAt - price) / compareAt) * 100)
}

function productPricing(product: Product) {
  const variants = product.variants ?? []
  const variantPrices = variants.map((variant) => variant.priceOverride ?? product.price)
  const prices = variantPrices.length ? variantPrices : [product.price]
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  const discounts = [salePercent(product.price, product.compareAtPrice), ...variants.map((variant) => {
    const price = variant.priceOverride ?? product.price
    return salePercent(price, variant.compareAtPrice ?? product.compareAtPrice)
  })]

  return {
    minPrice,
    hasRange: maxPrice > minPrice,
    discount: Math.max(...discounts)
  }
}

function inventoryBadge(product: Product) {
  if (product.trackInventory === false) return { label: 'متاح', className: 'bg-emerald-50 text-emerald-700' }
  if (product.allowBackorder && product.stock <= 0) return { label: 'طلب مسبق', className: 'bg-blue-50 text-blue-700' }
  if (product.stock <= 0) return { label: 'نفد المخزون', className: 'bg-red-50 text-red-700' }
  if (product.stock <= (product.lowStockThreshold ?? 2)) return { label: `بقي ${product.stock} فقط`, className: 'bg-amber-50 text-amber-800' }
  return { label: 'متوفر', className: 'bg-emerald-50 text-emerald-700' }
}

export function ProductCard({ product }: { product: Product }) {
  const pricing = productPricing(product)
  const inventory = inventoryBadge(product)
  const sizes = [...new Set((product.variants ?? []).map((variant) => variant.size).filter((value): value is string => Boolean(value)))]
  const colors = [...new Set((product.variants ?? []).map((variant) => variant.color).filter((value): value is string => Boolean(value)))]

  return (
    <article className="group overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="relative block h-80 overflow-hidden bg-stone-100">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <span className={`rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${inventory.className}`}>{inventory.label}</span>
          {pricing.discount > 0 ? <span className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm">خصم حتى {pricing.discount}%</span> : null}
        </div>
      </Link>

      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.18em] text-brand-gold">{product.category}</p>
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="line-clamp-2 text-lg font-bold text-brand-navy transition group-hover:text-brand-gold">{product.name}</h3>
          </Link>
          <p className="line-clamp-2 min-h-12 text-sm leading-6 text-stone-600">{product.shortDescription}</p>
        </div>

        {(sizes.length || colors.length) ? (
          <div className="space-y-2 text-xs text-stone-500">
            {sizes.length ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-stone-600">المقاسات:</span>
                {sizes.slice(0, 4).map((size) => <span key={size} className="rounded-full bg-stone-100 px-2.5 py-1">{size}</span>)}
                {sizes.length > 4 ? <span>+{sizes.length - 4}</span> : null}
              </div>
            ) : null}
            {colors.length ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-stone-600">الألوان:</span>
                {colors.slice(0, 3).map((color) => <span key={color} className="rounded-full border border-stone-200 px-2.5 py-1">{color}</span>)}
                {colors.length > 3 ? <span>+{colors.length - 3}</span> : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-end justify-between gap-3 border-t border-stone-100 pt-4">
          <div>
            {pricing.hasRange ? <div className="text-[11px] font-semibold text-stone-400">ابتداءً من</div> : null}
            <span className="text-xl font-bold text-brand-navy">{pricing.minPrice.toFixed(2)} ر.س</span>
            {!pricing.hasRange && product.compareAtPrice && product.compareAtPrice > product.price ? (
              <span className="mr-2 text-sm text-stone-400 line-through">{product.compareAtPrice.toFixed(2)} ر.س</span>
            ) : null}
          </div>
          {product.variants?.length ? <span className="text-xs text-stone-400">{product.variants.length} خيارات</span> : null}
        </div>

        <Link
          href={`/products/${product.slug}`}
          className="block rounded-full bg-brand-navy px-5 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
        >
          عرض التفاصيل والخيارات
        </Link>
      </div>
    </article>
  )
}
