import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types'

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-soft transition hover:-translate-y-1">
      <div className="relative h-80 overflow-hidden bg-stone-100">
        <Image src={product.image} alt={product.name} fill className="object-cover" />
      </div>
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.2em] text-brand-gold">{product.category}</p>
          <h3 className="line-clamp-2 text-lg font-bold text-brand-navy">{product.name}</h3>
          <p className="line-clamp-2 text-sm leading-6 text-stone-600">{product.shortDescription}</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-brand-navy">{product.price} ر.س</span>
            {product.compareAtPrice ? (
              <span className="mr-2 text-sm text-stone-400 line-through">{product.compareAtPrice} ر.س</span>
            ) : null}
          </div>
          <span className="text-xs text-stone-500">★ {product.rating}</span>
        </div>

        <Link
          href={`/products/${product.slug}`}
          className="block rounded-full bg-brand-navy px-5 py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
        >
          عرض المنتج
        </Link>
      </div>
    </article>
  )
}
