import { createProduct, updateProduct } from '@/lib/actions/admin'
import type { DbCategory, DbProduct } from '@/types'

export function ProductForm({ product, categories }: { product?: DbProduct | null; categories: DbCategory[] }) {
  const action = product ? updateProduct : createProduct
  const hasVariants = Boolean(product?.product_variants?.length)

  return (
    <form action={action} className="grid gap-6 rounded-[28px] bg-white p-6 shadow-soft">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      <section className="grid gap-5">
        <div>
          <h2 className="text-lg font-bold text-brand-navy">البيانات الأساسية</h2>
          <p className="mt-1 text-sm leading-6 text-stone-500">الاسم والتصنيف والرابط الداخلي للمنتج داخل REZO STYLE.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-stone-700">
            اسم المنتج
            <input name="name" defaultValue={product?.name ?? ''} required className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-stone-700">
            slug الرابط
            <input name="slug" defaultValue={product?.slug ?? ''} placeholder="يُنشأ من اسم المنتج إذا تُرك فارغًا" className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-stone-700">
            التصنيف
            <select name="category_id" defaultValue={product?.category_id ?? ''} required className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold">
              <option value="">اختر التصنيف</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-stone-700">
            SKU الأساسي
            <input name="sku" defaultValue={product?.sku ?? ''} placeholder="مثال: RS-ABAYA-001" className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
            <span className="text-xs text-stone-500">اختياري إذا كان المنتج سيعتمد على SKU مستقل لكل مقاس أو لون.</span>
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium text-stone-700">
          وصف مختصر
          <textarea name="short_description" defaultValue={product?.short_description ?? ''} rows={3} className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
        </label>

        <label className="grid gap-2 text-sm font-medium text-stone-700">
          الوصف الكامل
          <textarea name="description" defaultValue={product?.description ?? ''} rows={6} className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
        </label>
      </section>

      <section className="grid gap-5 border-t border-stone-100 pt-6">
        <div>
          <h2 className="text-lg font-bold text-brand-navy">السعر والمخزون</h2>
          <p className="mt-1 text-sm leading-6 text-stone-500">السعر الحالي هو سعر البيع، والسعر قبل الخصم يظهر فقط عند وجود خصم فعلي.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-2 text-sm font-medium text-stone-700">
            السعر الحالي
            <input name="price" type="number" step="0.01" min="0.01" defaultValue={product?.price ?? ''} required className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-stone-700">
            السعر قبل الخصم
            <input name="compare_at_price" type="number" step="0.01" min="0" defaultValue={product?.compare_at_price ?? ''} className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-stone-700">
            المخزون الأساسي
            <input name="stock" type="number" min="0" step="1" defaultValue={product?.stock ?? 0} readOnly={hasVariants} required className={`rounded-2xl border px-4 py-3 outline-none ${hasVariants ? 'border-stone-200 bg-stone-100 text-stone-500' : 'border-stone-300 focus:border-brand-gold'}`} />
            {hasVariants ? <span className="text-xs text-stone-500">يُحسب تلقائيًا من مجموع الخيارات النشطة.</span> : null}
          </label>
          <label className="grid gap-2 text-sm font-medium text-stone-700">
            تنبيه قرب النفاد عند
            <input name="low_stock_threshold" type="number" min="0" step="1" defaultValue={product?.low_stock_threshold ?? 2} className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
          </label>
        </div>

        <div className="flex flex-wrap gap-6 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
          <label className="flex items-center gap-2">
            <input name="track_inventory" type="checkbox" defaultChecked={product ? product.track_inventory !== false : true} />
            تتبع المخزون
          </label>
          <label className="flex items-center gap-2">
            <input name="allow_backorder" type="checkbox" defaultChecked={product?.allow_backorder === true} />
            السماح بالطلب عند نفاد المخزون
          </label>
        </div>
      </section>

      <section className="grid gap-5 border-t border-stone-100 pt-6">
        <div>
          <h2 className="text-lg font-bold text-brand-navy">الصورة الرئيسية</h2>
          <p className="mt-1 text-sm leading-6 text-stone-500">بعد إنشاء المنتج يمكنك إضافة معرض صور كامل وترتيب الصور من صفحة التعديل.</p>
        </div>
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          رفع صورة رئيسية
          <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="rounded-2xl border border-stone-300 px-4 py-3 outline-none file:ml-4 file:rounded-full file:border-0 file:bg-brand-navy file:px-4 file:py-2 file:text-sm file:font-bold file:text-white" />
        </label>
        {product?.image_url ? (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
            الصورة الحالية: <a href={product.image_url} target="_blank" className="font-bold text-brand-navy underline" rel="noreferrer">فتح الصورة</a>
          </div>
        ) : null}
      </section>

      <section className="grid gap-5 border-t border-stone-100 pt-6">
        <div>
          <h2 className="text-lg font-bold text-brand-navy">SEO</h2>
          <p className="mt-1 text-sm leading-6 text-stone-500">حقول اختيارية نستخدمها لاحقًا لعنوان ووصف المنتج في محركات البحث والمشاركة.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-stone-700">
            عنوان SEO
            <input name="seo_title" maxLength={70} defaultValue={product?.seo_title ?? ''} className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-stone-700">
            وصف SEO
            <textarea name="seo_description" maxLength={180} defaultValue={product?.seo_description ?? ''} rows={3} className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
          </label>
        </div>
      </section>

      <section className="flex flex-wrap gap-6 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
        <label className="flex items-center gap-2">
          <input name="is_active" type="checkbox" defaultChecked={product ? product.is_active : true} />
          المنتج نشط ويظهر للعميلات
        </label>
        <label className="flex items-center gap-2">
          <input name="is_featured" type="checkbox" defaultChecked={product ? product.is_featured : false} />
          منتج مميز
        </label>
      </section>

      <div>
        <button className="rounded-full bg-brand-navy px-6 py-3 text-sm font-bold text-white transition hover:opacity-90">
          {product ? 'حفظ التعديلات' : 'إضافة المنتج'}
        </button>
      </div>
    </form>
  )
}
