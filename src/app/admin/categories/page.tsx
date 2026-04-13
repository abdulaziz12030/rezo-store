import Link from 'next/link'
import { AdminShell } from '@/components/admin/admin-shell'
import { SetupNotice } from '@/components/admin/setup-notice'
import { getAdminCategories } from '@/lib/catalog'

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories()

  return (
    <AdminShell title="إدارة التصنيفات" description="أضف مجموعات ريزو وعدّل الاسم والرابط والوصف الخاص بكل مجموعة.">
      <SetupNotice />
      <div className="flex justify-end">
        <Link href="/admin/categories/new" className="rounded-full bg-brand-navy px-6 py-3 text-sm font-bold text-white transition hover:opacity-90">
          إضافة تصنيف جديد
        </Link>
      </div>
      <div className="rounded-[28px] bg-white p-6 shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-right text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th className="px-3 py-3">الاسم</th>
                <th className="px-3 py-3">slug</th>
                <th className="px-3 py-3">الوصف</th>
                <th className="px-3 py-3">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-stone-100">
                  <td className="px-3 py-4 font-medium text-brand-navy">{category.name}</td>
                  <td className="px-3 py-4">/{category.slug}</td>
                  <td className="px-3 py-4 text-stone-600">{category.description ?? '—'}</td>
                  <td className="px-3 py-4">
                    <Link href={`/admin/categories/${category.id}/edit`} className="font-bold text-brand-gold">تعديل</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  )
}
