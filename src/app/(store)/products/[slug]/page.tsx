import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProductGallery } from '@/components/store/product-gallery'
import { ProductPurchasePanel } from '@/components/store/product-purchase-panel'
import { getProductBySlug } from '@/lib/catalog'

export default async function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) notFound()

  const images = product.images?.length
    ? product.images
    : [{ id: 'primary', url: product.image, altText: product.name, isPrimary: true, sortOrder: 0 }]

  return (
    <main className="bg-stone-50 py-10 sm:py-16">
      <div className="container-shell grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <ProductGallery images={images} productName={product.name} />

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
            <ProductPurchasePanel product={product} />
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
