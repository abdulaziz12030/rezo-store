import { createCategory, updateCategory } from '@/lib/actions/admin'
import type { DbCategory } from '@/types'

export function CategoryForm({ category }: { category?: DbCategory | null }) {
  const action = category ? updateCategory : createCategory

  return (
    <form action={action} className="grid gap-5 rounded-[28px] bg-white p-6 shadow-soft">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          اسم التصنيف
          <input name="name" defaultValue={category?.name ?? ''} required className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          الرابط المختصر slug
          <input name="slug" defaultValue={category?.slug ?? ''} required className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium text-stone-700">
        وصف التصنيف
        <textarea name="description" defaultValue={category?.description ?? ''} rows={5} className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
      </label>
      <div>
        <button className="rounded-full bg-brand-navy px-6 py-3 text-sm font-bold text-white transition hover:opacity-90">
          {category ? 'حفظ التعديلات' : 'إضافة التصنيف'}
        </button>
      </div>
    </form>
  )
}
