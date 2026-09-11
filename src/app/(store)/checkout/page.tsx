import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentCart } from '@/lib/cart'
import { createCheckoutOrder } from '@/lib/actions/checkout'
import { calculateShippingTotal, getShippingSettings, shippingSummary } from '@/lib/store-settings'

const errorMessages: Record<string, string> = {
  'store-not-configured': 'المتجر غير متصل بقاعدة البيانات.',
  'cart-empty': 'السلة فارغة ولا يمكن إنشاء طلب.',
  'missing-details': 'أكمل الاسم والجوال والمدينة والحي والشارع.',
  'invalid-email': 'صيغة البريد الإلكتروني غير صحيحة.',
  'shipping-not-configured': 'الشحن غير مهيأ بعد. لن يتم إنشاء طلب قبل تحديد تكلفة الشحن بصورة صحيحة.',
  'shipping-provider-not-ready': 'شركة الشحن المحددة غير جاهزة للتسعير المباشر بعد.',
  'insufficient-stock': 'تغير المخزون أثناء إتمام الطلب. راجع السلة والكمية المتاحة.',
  'product-unavailable': 'أحد المنتجات لم يعد متاحًا.',
  'variant-unavailable': 'أحد المقاسات أو الألوان لم يعد متاحًا.',
  'variant-required': 'يجب اختيار المقاس أو اللون قبل إتمام الطلب.',
  'cart-converted': 'تم إنشاء طلب من هذه السلة مسبقًا.',
  'checkout-failed': 'تعذر إنشاء الطلب حاليًا. لم يتم خصم أي مبلغ.'
}

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const [cart, shipping] = await Promise.all([getCurrentCart(), getShippingSettings()])

  if (!cart?.items.length) redirect('/cart')

  let shippingTotal: number | null = null
  if (shipping.enabled) {
    try {
      shippingTotal = calculateShippingTotal(cart.subtotal, shipping)
    } catch {
      shippingTotal = null
    }
  }

  const shippingReady = shipping.enabled && shippingTotal !== null
  const expectedGrandTotal = Math.max(0, cart.subtotal - cart.discountTotal + (shippingTotal ?? 0))

  return (
    <main className="container-shell py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.3em] text-brand-gold">REZO STYLE</p>
          <h1 className="mt-2 text-3xl font-bold text-brand-navy">إتمام الطلب</h1>
          <p className="mt-3 text-sm leading-7 text-stone-600">سنراجع السعر والمخزون والشحن مرة أخيرة على السيرفر قبل إنشاء الطلب وحجز القطع.</p>
        </div>
        <Link href="/cart" className="text-sm font-bold text-brand-navy underline underline-offset-4">العودة للسلة</Link>
      </div>

      {error ? (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {errorMessages[error] ?? errorMessages['checkout-failed']}
        </div>
      ) : null}

      {!shippingReady ? (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
          <div className="font-bold">إتمام الطلب متوقف مؤقتًا حتى تهيئة الشحن.</div>
          <div className="mt-1">لن نسمح بإنشاء طلب أو الانتقال للدفع بإجمالي ناقص أو غير مؤكد.</div>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-[32px] border border-stone-200 bg-white p-8 shadow-soft">
          <h2 className="text-xl font-bold text-brand-navy">بيانات الاستلام</h2>

          <form action={createCheckoutOrder} className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-stone-700">
              الاسم الكامل
              <input name="full_name" required className="rounded-2xl border border-stone-300 px-4 py-4 outline-none focus:border-brand-gold" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-700">
              رقم الجوال
              <input name="phone" inputMode="tel" required placeholder="05xxxxxxxx" className="rounded-2xl border border-stone-300 px-4 py-4 outline-none focus:border-brand-gold" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-700 sm:col-span-2">
              البريد الإلكتروني (اختياري)
              <input name="email" type="email" className="rounded-2xl border border-stone-300 px-4 py-4 outline-none focus:border-brand-gold" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-700">
              المدينة
              <input name="city" required className="rounded-2xl border border-stone-300 px-4 py-4 outline-none focus:border-brand-gold" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-700">
              الحي
              <input name="district" required className="rounded-2xl border border-stone-300 px-4 py-4 outline-none focus:border-brand-gold" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-700 sm:col-span-2">
              الشارع / وصف العنوان
              <input name="street" required className="rounded-2xl border border-stone-300 px-4 py-4 outline-none focus:border-brand-gold" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-700">
              رقم المبنى
              <input name="building_no" className="rounded-2xl border border-stone-300 px-4 py-4 outline-none focus:border-brand-gold" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-700">
              الرمز البريدي
              <input name="postal_code" inputMode="numeric" className="rounded-2xl border border-stone-300 px-4 py-4 outline-none focus:border-brand-gold" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-700">
              الرقم الإضافي
              <input name="additional_no" inputMode="numeric" className="rounded-2xl border border-stone-300 px-4 py-4 outline-none focus:border-brand-gold" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-700">
              العنوان المختصر
              <input name="national_address_short_code" placeholder="مثال: RRRD2929" className="rounded-2xl border border-stone-300 px-4 py-4 uppercase outline-none focus:border-brand-gold" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-700 sm:col-span-2">
              ملاحظات الطلب (اختياري)
              <textarea name="customer_note" rows={3} className="rounded-2xl border border-stone-300 px-4 py-4 outline-none focus:border-brand-gold" />
            </label>

            <div className="sm:col-span-2 rounded-2xl bg-brand-sand/60 p-4 text-sm leading-7 text-stone-700">
              عند إنشاء الطلب يعيد السيرفر التحقق من الأسعار والمخزون، ثم يحسب الشحن ويثبت الإجمالي ويحجز المخزون لمدة الدفع.
            </div>

            <button
              disabled={!shippingReady}
              className="rounded-full bg-brand-navy px-7 py-4 text-sm font-bold text-white sm:col-span-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {shippingReady ? 'إنشاء الطلب والمتابعة للدفع' : 'بانتظار تهيئة الشحن'}
            </button>
          </form>
        </section>

        <aside className="h-fit rounded-[32px] border border-stone-200 bg-brand-sand p-6 shadow-soft">
          <h2 className="text-xl font-bold text-brand-navy">ملخص السلة</h2>
          <div className="mt-5 space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="border-b border-stone-300 pb-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-brand-navy">{item.name}</div>
                    {item.variantLabel ? <div className="mt-1 text-xs text-stone-500">{item.variantLabel}</div> : null}
                    <div className="mt-1 text-xs text-stone-500">الكمية: {item.quantity}</div>
                  </div>
                  <div className="font-bold text-brand-navy">{item.lineTotal.toFixed(2)} ر.س</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl bg-white/70 p-4 text-xs leading-6 text-stone-600">
            {shippingSummary(shipping)}
          </div>

          <div className="mt-5 space-y-3 text-sm text-stone-700">
            <div className="flex justify-between"><span>الإجمالي الفرعي</span><span>{cart.subtotal.toFixed(2)} ر.س</span></div>
            {cart.discountTotal ? <div className="flex justify-between"><span>الخصم</span><span>- {cart.discountTotal.toFixed(2)} ر.س</span></div> : null}
            <div className="flex justify-between"><span>الشحن</span><span>{shippingTotal !== null ? `${shippingTotal.toFixed(2)} ر.س` : 'غير مهيأ'}</span></div>
            <div className="flex justify-between border-t border-stone-300 pt-3 text-base font-bold text-brand-navy"><span>الإجمالي المتوقع</span><span>{shippingReady ? `${expectedGrandTotal.toFixed(2)} ر.س` : '—'}</span></div>
          </div>
        </aside>
      </div>
    </main>
  )
}
