import { ProductCard } from '@/components/product-card'
import { SectionTitle } from '@/components/section-title'
import { products } from '@/lib/data'

export default function ProductsPage() {
  return (
    <main className="container-shell py-16">
      <SectionTitle eyebrow="كل المنتجات" title="تسوقي منتجاتنا كاملة" text="صفحة منتجات أولية جاهزة للتوسعة لاحقًا بالفلاتر والبحث والسلة الديناميكية." />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  )
}
