import { notFound } from 'next/navigation'
import { getCategoryBySlug, getProductsByCategorySlug } from '@/lib/catalog'
import { ProductCard } from '@/components/product-card'
import { SectionTitle } from '@/components/section-title'

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [category, categoryProducts] = await Promise.all([
    getCategoryBySlug(slug),
    getProductsByCategorySlug(slug)
  ])

  if (!category) notFound()

  return (
    <main className="bg-stone-50 py-16">
      <div className="container-shell">
        <SectionTitle eyebrow="المجموعة" title={category.name} text={category.description} />

        {categoryProducts.length ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {categoryProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-[32px] bg-white p-10 text-center shadow-soft">
            <h2 className="text-2xl font-bold text-brand-navy">سيتم إضافة منتجات هذه المجموعة قريبًا</h2>
            <p className="mt-4 text-sm leading-7 text-stone-600">
              الصفحة جاهزة، ويمكنك الآن الدخول إلى لوحة التحكم وإضافة منتجات هذه المجموعة مباشرة من قسم المنتجات.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
