import { AdminShell } from '@/components/admin/admin-shell'
import { ProductForm } from '@/components/admin/product-form'
import { SetupNotice } from '@/components/admin/setup-notice'
import { getAdminCategories } from '@/lib/catalog'

export default async function NewProductPage() {
  const categories = await getAdminCategories()

  return (
    <AdminShell title="إضافة منتج" description="أدخل بيانات المنتج وارفع الصورة الرئيسية وحدد التصنيف والسعر والمخزون.">
      <SetupNotice />
      <ProductForm categories={categories} />
    </AdminShell>
  )
}
