import { getProducts } from '@/lib/catalog'
import { ProductCard } from '@/components/product-card'
import { SectionTitle } from '@/components/section-title'

export default async function ProductsPage() {
  const allProducts = await getProducts()

  return (
    <main className="bg-stone-50 py-16">
      <div className="container-shell">
        <SectionTitle eyebrow="تسوقي الآن" title="كل المنتجات" text="يمكنك لاحقًا تفعيل الفلاتر والتصنيفات الديناميكية وربط السلة بقاعدة بيانات الطلبات." />
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {allProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </main>
  )
}
