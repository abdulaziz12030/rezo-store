import { notFound } from 'next/navigation'
import { AdminShell } from '@/components/admin/admin-shell'
import { CategoryForm } from '@/components/admin/category-form'
import { SetupNotice } from '@/components/admin/setup-notice'
import { getAdminCategoryById } from '@/lib/catalog'

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const category = await getAdminCategoryById(id)
  if (!category) notFound()

  return (
    <AdminShell title={`تعديل التصنيف: ${category.name}`} description="يمكنك تعديل الاسم والرابط والوصف ثم الحفظ مباشرة.">
      <SetupNotice />
      <CategoryForm category={category} />
    </AdminShell>
  )
}
