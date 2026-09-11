import Link from 'next/link'
import { getCurrentCart } from '@/lib/cart'
import { removeCartItem, updateCartItemQuantity } from '@/lib/actions/cart'

const errorMessages: Record<string, string> = {
  'store-not-configured': 'المتجر غير متصل بقاعدة البيانات بعد.',
  'invalid-product': 'تعذر تحديد المنتج المطلوب.',
  'product-unavailable': 'هذا المنتج غير متاح حاليًا.',
  'variant-unavailable': 'الخيار المحدد غير متاح حاليًا.',
  'insufficient-stock': 'الكمية المطلوبة أكبر من المخزون المتاح.'
}

export default async function CartPage({ searchParams }: { searchParams: Promise<{ error?: string; available?: string }> }) {
  const params = await searchParams
  const cart = await getCurrentCart()
  const items = cart?.items ?? []
  const error = params.error ? errorMessages[params.error] ?? 'تعذر تنفيذ العملية.' : null

  return (
    <main className="container-shell py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.3em] text-brand-gold">REZO STYLE</p>
          <h1 className="mt-2 text-3xl font-bold text-brand-navy">سلة المشتريات</h1>
        </div>
        <Link href="/products" className="text-sm font-bold text-brand-navy underline underline-offset-4">
          متابعة التسوق
        </Link>
      </div>

      {error ? (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {error}{params.available ? ` المتاح حاليًا: ${params.available} قطعة.` : ''}
        </div>
      ) : null}

      {!items.length ? (
        <section className="mt-10 rounded-[32px] border border-stone-200 bg-white p-10 text-center shadow-soft">
          <h2 className="text-2xl font-bold text-brand-navy">السلة فارغة</h2>
          <p className="mt-3 text-sm leading-7 text-stone-600">اختاري ما يناسبك من مجموعات REZO STYLE وسيظهر هنا تلقائيًا.</p>
          <Link href="/products" className="mt-7 inline-flex rounded-full bg-brand-navy px-7 py-4 text-sm font-bold text-white">
            تصفح المنتجات
          </Link>
        </section>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-4">
            {items.map((item) => (
              <article key={item.id} className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-soft">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    {item.slug ? (
                      <Link href={`/products/${item.slug}`} className="text-lg font-bold text-brand-navy hover:underline">
                        {item.name}
                      </Link>
                    ) : (
                      <h2 className="text-lg font-bold text-brand-navy">{item.name}</h2>
                    )}
                    {item.variantLabel ? <p className="mt-2 text-sm text-stone-500">{item.variantLabel}</p> : null}
                    {item.sku ? <p className="mt-1 text-xs text-stone-400">SKU: {item.sku}</p> : null}
                    <p className="mt-3 text-sm text-stone-600">سعر القطعة: {item.unitPrice.toFixed(2)} ر.س</p>
                  </div>
                  <div className="text-xl font-bold text-brand-navy">{item.lineTotal.toFixed(2)} ر.س</div>
                </div>

                <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-stone-100 pt-5">
                  <form action={updateCartItemQuantity} className="flex items-end gap-2">
                    <input type="hidden" name="item_id" value={item.id} />
                    <label className="grid gap-1 text-xs font-semibold text-stone-600">
                      الكمية
                      <input
                        name="quantity"
                        type="number"
                        min="0"
                        max="20"
                        defaultValue={item.quantity}
                        className="w-20 rounded-xl border border-stone-300 px-3 py-2 text-center outline-none focus:border-brand-gold"
                      />
                    </label>
                    <button className="rounded-xl border border-brand-navy px-4 py-2 text-sm font-bold text-brand-navy">تحديث</button>
                  </form>

                  <form action={removeCartItem}>
                    <input type="hidden" name="item_id" value={item.id} />
                    <button className="rounded-xl px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50">حذف</button>
                  </form>
                </div>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-[28px] border border-stone-200 bg-brand-sand p-6 shadow-soft">
            <h2 className="text-xl font-bold text-brand-navy">ملخص الطلب</h2>
            <div className="mt-6 space-y-3 text-sm text-stone-700">
              <div className="flex items-center justify-between"><span>الإجمالي الفرعي</span><span>{cart?.subtotal.toFixed(2)} ر.س</span></div>
              {cart?.discountTotal ? <div className="flex items-center justify-between"><span>الخصم</span><span>- {cart.discountTotal.toFixed(2)} ر.س</span></div> : null}
              <div className="flex items-center justify-between"><span>الشحن</span><span>{cart?.shippingTotal ? `${cart.shippingTotal.toFixed(2)} ر.س` : 'يُحدد عند العنوان'}</span></div>
              <div className="flex items-center justify-between border-t border-stone-300 pt-3 text-base font-bold text-brand-navy"><span>الإجمالي الحالي</span><span>{cart?.grandTotal.toFixed(2)} ر.س</span></div>
            </div>
            <Link href="/checkout" className="mt-6 block rounded-full bg-brand-navy px-6 py-4 text-center text-sm font-bold text-white transition hover:opacity-90">
              المتابعة لإتمام الطلب
            </Link>
            <p className="mt-3 text-center text-xs leading-5 text-stone-500">سيتم التحقق من السعر والمخزون مرة أخرى على السيرفر قبل إنشاء الطلب.</p>
          </aside>
        </div>
      )}
    </main>
  )
}
