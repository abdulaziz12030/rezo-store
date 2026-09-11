import type { DbProductImage } from '@/types'
import {
  addProductImage,
  deleteProductImage,
  setPrimaryProductImage,
  updateProductImageMetadata
} from '@/lib/actions/product-images'

export function ProductImageManager({
  productId,
  currentMainUrl,
  images
}: {
  productId: string
  currentMainUrl?: string | null
  images: DbProductImage[]
}) {
  const sorted = [...images].sort(
    (a, b) => Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)) || (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )

  return (
    <section className="space-y-5 rounded-[28px] bg-white p-6 shadow-soft">
      <div>
        <h2 className="text-xl font-bold text-brand-navy">صور المنتج</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">أضف عدة صور وحدد الصورة الرئيسية وترتيب الظهور والوصف البديل لتحسين الوصول وSEO.</p>
      </div>

      {currentMainUrl && !images.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          توجد صورة رئيسية قديمة للمنتج. عند إضافة أول صورة للمعرض ستصبح تلقائيًا الصورة الرئيسية الجديدة.
        </div>
      ) : null}

      <form action={addProductImage} className="grid gap-4 rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-5 md:grid-cols-2 xl:grid-cols-4">
        <input type="hidden" name="product_id" value={productId} />
        <label className="grid gap-2 text-sm font-medium text-stone-700 xl:col-span-2">
          الصورة
          <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          الوصف البديل
          <input name="alt_text" placeholder="مثال: جلابية سوداء مطرزة" className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          الترتيب
          <input name="sort_order" type="number" min="0" defaultValue="0" className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm" />
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input name="is_primary" type="checkbox" /> اجعلها الصورة الرئيسية
        </label>
        <div className="md:col-span-2 xl:col-span-3">
          <button className="rounded-full bg-brand-navy px-6 py-3 text-sm font-bold text-white">رفع الصورة</button>
        </div>
      </form>

      {!sorted.length ? (
        <div className="rounded-2xl bg-stone-50 p-5 text-sm text-stone-600">لا توجد صور معرض مسجلة بعد.</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((image) => (
            <article key={image.id} className="overflow-hidden rounded-3xl border border-stone-200">
              <div className="relative aspect-[4/3] bg-stone-100">
                <img src={image.image_url} alt={image.alt_text || 'صورة منتج'} className="h-full w-full object-cover" />
                {image.is_primary ? (
                  <span className="absolute right-3 top-3 rounded-full bg-brand-navy px-3 py-1 text-xs font-bold text-white">الرئيسية</span>
                ) : null}
              </div>

              <div className="space-y-4 p-4">
                <form action={updateProductImageMetadata} className="grid gap-3">
                  <input type="hidden" name="image_id" value={image.id} />
                  <input type="hidden" name="product_id" value={productId} />
                  <label className="grid gap-1 text-xs font-medium text-stone-600">
                    الوصف البديل
                    <input name="alt_text" defaultValue={image.alt_text ?? ''} className="rounded-xl border border-stone-300 px-3 py-2 text-sm" />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-stone-600">
                    الترتيب
                    <input name="sort_order" type="number" min="0" defaultValue={image.sort_order ?? 0} className="rounded-xl border border-stone-300 px-3 py-2 text-sm" />
                  </label>
                  <button className="rounded-full border border-brand-navy px-4 py-2 text-sm font-bold text-brand-navy">حفظ البيانات</button>
                </form>

                {!image.is_primary ? (
                  <form action={setPrimaryProductImage}>
                    <input type="hidden" name="image_id" value={image.id} />
                    <input type="hidden" name="product_id" value={productId} />
                    <button className="w-full rounded-full bg-brand-sand px-4 py-2 text-sm font-bold text-brand-navy">تعيين كرئيسية</button>
                  </form>
                ) : null}

                <form action={deleteProductImage}>
                  <input type="hidden" name="image_id" value={image.id} />
                  <input type="hidden" name="product_id" value={productId} />
                  <button className="w-full rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-700">حذف الصورة</button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
