import type { DbProductVariant } from '@/types'
import { createProductVariant, deleteProductVariant, updateProductVariant } from '@/lib/actions/admin'

export function VariantManager({ productId, variants }: { productId: string; variants: DbProductVariant[] }) {
  return (
    <section className="space-y-5 rounded-[28px] bg-white p-6 shadow-soft">
      <div>
        <h2 className="text-xl font-bold text-brand-navy">المقاسات والألوان والمخزون</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">كل خيار يملك SKU ومخزونًا مستقلًا. عند وجود خيارات، يصبح مخزون المنتج الإجمالي مجموع مخزون الخيارات النشطة.</p>
      </div>

      <form action={createProductVariant} className="grid gap-4 rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-5 md:grid-cols-2 xl:grid-cols-6">
        <input type="hidden" name="product_id" value={productId} />
        <input name="sku" required placeholder="SKU" className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" />
        <input name="size" placeholder="المقاس" className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" />
        <input name="color" placeholder="اللون" className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" />
        <input name="option_label" placeholder="وصف الخيار" className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" />
        <input name="stock" type="number" min="0" defaultValue="0" placeholder="المخزون" className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" />
        <input name="price_override" type="number" step="0.01" min="0" placeholder="سعر خاص اختياري" className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" />
        <input name="weight_grams" type="number" min="0" placeholder="الوزن بالجرام" className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" />
        <div className="md:col-span-2 xl:col-span-6">
          <button className="rounded-full bg-brand-navy px-6 py-3 text-sm font-bold text-white">إضافة خيار جديد</button>
        </div>
      </form>

      <div className="space-y-4">
        {variants.length ? variants.map((variant) => (
          <div key={variant.id} className="rounded-3xl border border-stone-200 p-5">
            <form action={updateProductVariant} className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <input type="hidden" name="id" value={variant.id} />
              <input type="hidden" name="product_id" value={productId} />
              <label className="grid gap-2 text-xs font-medium text-stone-600">SKU<input name="sku" required defaultValue={variant.sku} className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" /></label>
              <label className="grid gap-2 text-xs font-medium text-stone-600">المقاس<input name="size" defaultValue={variant.size ?? ''} className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" /></label>
              <label className="grid gap-2 text-xs font-medium text-stone-600">اللون<input name="color" defaultValue={variant.color ?? ''} className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" /></label>
              <label className="grid gap-2 text-xs font-medium text-stone-600">وصف الخيار<input name="option_label" defaultValue={variant.option_label ?? ''} className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" /></label>
              <label className="grid gap-2 text-xs font-medium text-stone-600">المخزون<input name="stock" type="number" min="0" defaultValue={variant.stock} className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" /></label>
              <label className="grid gap-2 text-xs font-medium text-stone-600">سعر خاص<input name="price_override" type="number" step="0.01" min="0" defaultValue={variant.price_override ?? ''} className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" /></label>
              <label className="grid gap-2 text-xs font-medium text-stone-600">الوزن بالجرام<input name="weight_grams" type="number" min="0" defaultValue={variant.weight_grams ?? ''} className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" /></label>
              <label className="flex items-center gap-2 text-sm text-stone-700"><input name="is_active" type="checkbox" defaultChecked={variant.is_active} /> الخيار نشط</label>
              <div className="flex items-end gap-3 md:col-span-2 xl:col-span-4">
                <button className="rounded-full bg-brand-navy px-5 py-2.5 text-sm font-bold text-white">حفظ الخيار</button>
              </div>
            </form>
            <form action={deleteProductVariant} className="mt-3">
              <input type="hidden" name="id" value={variant.id} />
              <input type="hidden" name="product_id" value={productId} />
              <button className="text-sm font-semibold text-red-600">حذف الخيار</button>
            </form>
          </div>
        )) : (
          <div className="rounded-2xl bg-stone-50 p-5 text-sm text-stone-600">لا توجد خيارات بعد. المنتج يعتمد حاليًا على المخزون الأساسي فقط.</div>
        )}
      </div>
    </section>
  )
}
