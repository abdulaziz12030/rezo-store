import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProductCard } from '@/components/product-card'
import { SectionTitle } from '@/components/section-title'
import { categories, getCategoryBySlug, getProductsByCategorySlug } from '@/lib/data'

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }))
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = getCategoryBySlug(slug)

  if (!category) return notFound()

  const categoryProducts = getProductsByCategorySlug(slug)

  return (
    <main className="container-shell py-16">
      <div className="mb-8 flex flex-wrap items-center gap-3 text-sm text-stone-500">
        <Link href="/" className="transition hover:text-brand-navy">الرئيسية</Link>
        <span>/</span>
        <span className="text-brand-navy">{category.name}</span>
      </div>

      <SectionTitle
        eyebrow="المجموعة"
        title={category.name}
        text={category.description}
      />

      {categoryProducts.length > 0 ? (
        <>
          <div className="mb-8 flex items-center justify-between rounded-[24px] bg-stone-50 px-6 py-4 text-sm text-stone-600">
            <span>عدد المنتجات في المجموعة</span>
            <span className="font-bold text-brand-navy">{categoryProducts.length}</span>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {categoryProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-[32px] border border-dashed border-stone-300 bg-stone-50 p-10 text-center shadow-soft">
          <h3 className="text-2xl font-bold text-brand-navy">{category.name} قريبًا</h3>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-stone-600">
            تم إنشاء صفحة خاصة لهذه المجموعة بنجاح، ويمكنك لاحقًا إضافة منتجاتها من ملف البيانات أو من لوحة التحكم عندما نربط قاعدة البيانات.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/products" className="rounded-full bg-brand-navy px-6 py-3 text-sm font-bold text-white transition hover:opacity-90">
              عرض جميع المنتجات
            </Link>
            <Link href="/" className="rounded-full border border-brand-navy px-6 py-3 text-sm font-bold text-brand-navy transition hover:bg-brand-navy hover:text-white">
              العودة للرئيسية
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
