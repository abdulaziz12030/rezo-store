import Link from 'next/link'
import { AdminShell } from '@/components/admin/admin-shell'
import { SetupNotice } from '@/components/admin/setup-notice'
import { getAdminProducts } from '@/lib/catalog'

export default async function AdminProductsPage() {
  const products = await getAdminProducts()

  return (
    <AdminShell title="إدارة المنتجات" description="أضف منتجات جديدة واربطها بتصنيفاتها، وارفع الصورة الرئيسية وحدد الأسعار والمخزون.">
      <SetupNotice />
      <div className="flex justify-end">
        <Link href="/admin/products/new" className="rounded-full bg-brand-navy px-6 py-3 text-sm font-bold text-white transition hover:opacity-90">
          إضافة منتج جديد
        </Link>
      </div>
      <div className="rounded-[28px] bg-white p-6 shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-right text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th className="px-3 py-3">المنتج</th>
                <th className="px-3 py-3">التصنيف</th>
                <th className="px-3 py-3">السعر</th>
                <th className="px-3 py-3">المخزون</th>
                <th className="px-3 py-3">الحالة</th>
                <th className="px-3 py-3">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-stone-100">
                  <td className="px-3 py-4 font-medium text-brand-navy">{product.name}</td>
                  <td className="px-3 py-4">{product.categories?.name ?? 'غير مصنف'}</td>
                  <td className="px-3 py-4">{product.price} ر.س</td>
                  <td className="px-3 py-4">{product.stock}</td>
                  <td className="px-3 py-4">{product.is_active ? 'نشط' : 'مخفي'}</td>
                  <td className="px-3 py-4">
                    <Link href={`/admin/products/${product.id}/edit`} className="font-bold text-brand-gold">تعديل</Link>
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
