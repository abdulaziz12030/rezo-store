import type { DbProductVariant } from '@/types'
import { createProductVariant, deleteProductVariant, updateProductVariant } from '@/lib/actions/admin'

export function VariantManager({ productId, variants }: { productId: string; variants: DbProductVariant[] }) {
  const activeVariants = variants.filter((variant) => variant.is_active)
  const totalStock = activeVariants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
  const lowStockCount = activeVariants.filter((variant) => Number(variant.stock || 0) <= Number(variant.low_stock_threshold ?? 2)).length

  return (
    <section className="space-y-5 rounded-[28px] bg-white p-6 shadow-soft">
      <div>
        <h2 className="text-xl font-bold text-brand-navy">المقاسات والألوان والمخزون</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">كل خيار يملك SKU ومخزونًا مستقلًا. عند وجود خيارات يصبح مخزون المنتج الإجمالي مجموع مخزون الخيارات النشطة.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-stone-50 p-4">
          <div className="text-xs text-stone-500">الخيارات النشطة</div>
          <div className="mt-1 text-2xl font-bold text-brand-navy">{activeVariants.length}</div>
        </div>
        <div className="rounded-2xl bg-stone-50 p-4">
          <div className="text-xs text-stone-500">إجمالي المخزون</div>
          <div className="mt-1 text-2xl font-bold text-brand-navy">{totalStock}</div>
        </div>
        <div className={`rounded-2xl p-4 ${lowStockCount ? 'bg-amber-50' : 'bg-stone-50'}`}>
          <div className="text-xs text-stone-500">خيارات قرب النفاد</div>
          <div className={`mt-1 text-2xl font-bold ${lowStockCount ? 'text-amber-700' : 'text-brand-navy'}`}>{lowStockCount}</div>
        </div>
      </div>

      <form action={createProductVariant} className="grid gap-4 rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-5 md:grid-cols-2 xl:grid-cols-4">
        <input type="hidden" name="product_id" value={productId} />
        <label className="grid gap-2 text-xs font-medium text-stone-600">SKU<input name="sku" required placeholder="RS-001-BLK-M" className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm" /></label>
        <label className="grid gap-2 text-xs font-medium text-stone-600">المقاس<input name="size" placeholder="M" className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm" /></label>
        <label className="grid gap-2 text-xs font-medium text-stone-600">اللون<input name="color" placeholder="أسود" className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm" /></label>
        <label className="grid gap-2 text-xs font-medium text-stone-600">وصف الخيار<input name="option_label" placeholder="اختياري" className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm" /></label>
        <label className="grid gap-2 text-xs font-medium text-stone-600">المخزون<input name="stock" type="number" min="0" step="1" defaultValue="0" className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm" /></label>
        <label className="grid gap-2 text-xs font-medium text-stone-600">تنبيه قرب النفاد<input name="low_stock_threshold" type="number" min="0" step="1" defaultValue="2" className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm" /></label>
        <label className="grid gap-2 text-xs font-medium text-stone-600">سعر خاص<input name="price_override" type="number" step="0.01" min="0" placeholder="اختياري" className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm" /></label>
        <label className="grid gap-2 text-xs font-medium text-stone-600">السعر قبل الخصم<input name="compare_at_price" type="number" step="0.01" min="0" placeholder="اختياري" className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm" /></label>
        <label className="grid gap-2 text-xs font-medium text-stone-600">سعر التكلفة<input name="cost_price" type="number" step="0.01" min="0" placeholder="للإدارة فقط" className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm" /></label>
        <label className="grid gap-2 text-xs font-medium text-stone-600">الوزن بالجرام<input name="weight_grams" type="number" min="0" step="1" placeholder="اختياري" className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm" /></label>
        <div className="md:col-span-2 xl:col-span-4">
          <button className="rounded-full bg-brand-navy px-6 py-3 text-sm font-bold text-white">إضافة خيار جديد</button>
        </div>
      </form>

      <div className="space-y-4">
        {variants.length ? variants.map((variant) => {
          const isLow = variant.is_active && Number(variant.stock || 0) <= Number(variant.low_stock_threshold ?? 2)
          return (
            <div key={variant.id} className={`rounded-3xl border p-5 ${isLow ? 'border-amber-200 bg-amber-50/40' : 'border-stone-200'}`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-bold text-brand-navy">{variant.sku}</div>
                <div className="flex gap-2 text-xs">
                  {!variant.is_active ? <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-600">غير نشط</span> : null}
                  {isLow ? <span className="rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-800">قرب النفاد</span> : null}
                </div>
              </div>

              <form action={updateProductVariant} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <input type="hidden" name="id" value={variant.id} />
                <input type="hidden" name="product_id" value={productId} />
                <label className="grid gap-2 text-xs font-medium text-stone-600">SKU<input name="sku" required defaultValue={variant.sku} className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" /></label>
                <label className="grid gap-2 text-xs font-medium text-stone-600">المقاس<input name="size" defaultValue={variant.size ?? ''} className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" /></label>
                <label className="grid gap-2 text-xs font-medium text-stone-600">اللون<input name="color" defaultValue={variant.color ?? ''} className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" /></label>
                <label className="grid gap-2 text-xs font-medium text-stone-600">وصف الخيار<input name="option_label" defaultValue={variant.option_label ?? ''} className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" /></label>
                <label className="grid gap-2 text-xs font-medium text-stone-600">المخزون<input name="stock" type="number" min="0" step="1" defaultValue={variant.stock} className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" /></label>
                <label className="grid gap-2 text-xs font-medium text-stone-600">تنبيه قرب النفاد<input name="low_stock_threshold" type="number" min="0" step="1" defaultValue={variant.low_stock_threshold ?? 2} className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" /></label>
                <label className="grid gap-2 text-xs font-medium text-stone-600">سعر خاص<input name="price_override" type="number" step="0.01" min="0" defaultValue={variant.price_override ?? ''} className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" /></label>
                <label className="grid gap-2 text-xs font-medium text-stone-600">السعر قبل الخصم<input name="compare_at_price" type="number" step="0.01" min="0" defaultValue={variant.compare_at_price ?? ''} className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" /></label>
                <label className="grid gap-2 text-xs font-medium text-stone-600">سعر التكلفة<input name="cost_price" type="number" step="0.01" min="0" defaultValue={variant.cost_price ?? ''} className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" /></label>
                <label className="grid gap-2 text-xs font-medium text-stone-600">الوزن بالجرام<input name="weight_grams" type="number" min="0" step="1" defaultValue={variant.weight_grams ?? ''} className="rounded-2xl border border-stone-300 px-4 py-3 text-sm" /></label>
                <label className="flex items-center gap-2 text-sm text-stone-700"><input name="is_active" type="checkbox" defaultChecked={variant.is_active} /> الخيار نشط</label>
                <div className="flex items-end gap-3 md:col-span-2 xl:col-span-3">
                  <button className="rounded-full bg-brand-navy px-5 py-2.5 text-sm font-bold text-white">حفظ الخيار</button>
                </div>
              </form>
              <form action={deleteProductVariant} className="mt-3">
                <input type="hidden" name="id" value={variant.id} />
                <input type="hidden" name="product_id" value={productId} />
                <button className="text-sm font-semibold text-red-600">حذف الخيار</button>
              </form>
            </div>
          )
        }) : (
          <div className="rounded-2xl bg-stone-50 p-5 text-sm leading-7 text-stone-600">لا توجد خيارات بعد. المنتج يعتمد حاليًا على المخزون الأساسي. أضف خيارات فقط إذا كان للمنتج مقاسات أو ألوان أو نسخ تحتاج مخزونًا مستقلًا.</div>
        )}
      </div>
    </section>
  )
}
