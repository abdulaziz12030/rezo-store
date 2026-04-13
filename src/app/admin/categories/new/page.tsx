import { AdminShell } from '@/components/admin/admin-shell'
import { CategoryForm } from '@/components/admin/category-form'
import { SetupNotice } from '@/components/admin/setup-notice'

export default function NewCategoryPage() {
  return (
    <AdminShell title="إضافة تصنيف" description="أنشئ مجموعة جديدة مثل جلابيات العز أو أي مجموعة جديدة ترغب بإظهارها داخل المتجر.">
      <SetupNotice />
      <CategoryForm />
    </AdminShell>
  )
}
