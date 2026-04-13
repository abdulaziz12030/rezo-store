import { createProduct, updateProduct } from '@/lib/actions/admin'
import type { DbCategory, DbProduct } from '@/types'

export function ProductForm({ product, categories }: { product?: DbProduct | null; categories: DbCategory[] }) {
  const action = product ? updateProduct : createProduct

  return (
    <form action={action} className="grid gap-5 rounded-[28px] bg-white p-6 shadow-soft">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          اسم المنتج
          <input name="name" defaultValue={product?.name ?? ''} required className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          slug الرابط
          <input name="slug" defaultValue={product?.slug ?? ''} required className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
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
          الصورة الرئيسية
          <input name="image" type="file" accept="image/*" className="rounded-2xl border border-stone-300 px-4 py-3 outline-none file:ml-4 file:rounded-full file:border-0 file:bg-brand-navy file:px-4 file:py-2 file:text-sm file:font-bold file:text-white" />
        </label>
      </div>

      {product?.image_url ? (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
          الصورة الحالية: <a href={product.image_url} target="_blank" className="font-bold text-brand-navy underline" rel="noreferrer">فتح الصورة</a>
        </div>
      ) : null}

      <label className="grid gap-2 text-sm font-medium text-stone-700">
        وصف مختصر
        <textarea name="short_description" defaultValue={product?.short_description ?? ''} rows={3} className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
      </label>

      <label className="grid gap-2 text-sm font-medium text-stone-700">
        الوصف الكامل
        <textarea name="description" defaultValue={product?.description ?? ''} rows={6} className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
      </label>

      <div className="grid gap-5 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          السعر
          <input name="price" type="number" step="0.01" min="0" defaultValue={product?.price ?? ''} required className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          السعر قبل الخصم
          <input name="compare_at_price" type="number" step="0.01" min="0" defaultValue={product?.compare_at_price ?? ''} className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          المخزون
          <input name="stock" type="number" min="0" defaultValue={product?.stock ?? 0} required className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
        </label>
      </div>

      <div className="flex flex-wrap gap-6 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
        <label className="flex items-center gap-2">
          <input name="is_active" type="checkbox" defaultChecked={product ? product.is_active : true} />
          المنتج نشط
        </label>
        <label className="flex items-center gap-2">
          <input name="is_featured" type="checkbox" defaultChecked={product ? product.is_featured : false} />
          منتج مميز
        </label>
      </div>

      <div>
        <button className="rounded-full bg-brand-navy px-6 py-3 text-sm font-bold text-white transition hover:opacity-90">
          {product ? 'حفظ التعديلات' : 'إضافة المنتج'}
        </button>
      </div>
    </form>
  )
}
