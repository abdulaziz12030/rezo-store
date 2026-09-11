import { notFound } from 'next/navigation'
import { AdminShell } from '@/components/admin/admin-shell'
import { ProductForm } from '@/components/admin/product-form'
import { ProductImageManager } from '@/components/admin/product-image-manager'
import { VariantManager } from '@/components/admin/variant-manager'
import { SetupNotice } from '@/components/admin/setup-notice'
import { getAdminCategories, getAdminProductById } from '@/lib/catalog'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [product, categories] = await Promise.all([getAdminProductById(id), getAdminCategories()])
  if (!product) notFound()

  return (
    <AdminShell title={`تعديل المنتج: ${product.name}`} description="عدّل بيانات المنتج وصوره وأسعاره، ثم أدر المقاسات والألوان والمخزون لكل خيار بصورة مستقلة.">
      <SetupNotice />
      <ProductForm product={product} categories={categories} />
      <ProductImageManager productId={product.id} currentMainUrl={product.image_url} images={product.product_images ?? []} />
      <VariantManager productId={product.id} variants={product.product_variants ?? []} />
    </AdminShell>
  )
}
