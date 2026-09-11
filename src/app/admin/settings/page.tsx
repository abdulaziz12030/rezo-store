import { AdminShell } from '@/components/admin/admin-shell'
import { getShippingSettings, shippingSummary } from '@/lib/store-settings'
import { updateShippingSettings } from '@/lib/actions/store-settings'

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams
  const shipping = await getShippingSettings()

  return (
    <AdminShell
      title="إعدادات المتجر"
      description="إعدادات تشغيلية مستقلة لـ REZO STYLE. لن يتم استخدام إعدادات أي مشروع آخر تلقائيًا."
    >
      {saved === '1' ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          تم حفظ إعدادات الشحن.
        </div>
      ) : null}

      <section className="rounded-[28px] bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-brand-navy">الشحن</h2>
            <p className="mt-2 text-sm leading-7 text-stone-600">
              لا يمكن إنشاء طلب جديد قابل للدفع ما لم يكن الشحن مهيأ ومفعّلًا. يتم احتساب التكلفة على السيرفر قبل إنشاء الطلب.
            </p>
          </div>
          <div className={`rounded-full px-4 py-2 text-xs font-bold ${shipping.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
            {shipping.enabled ? 'مفعّل' : 'غير مفعّل'}
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-brand-sand/70 p-4 text-sm leading-7 text-stone-700">
          {shippingSummary(shipping)}
        </div>

        <form action={updateShippingSettings} className="mt-7 grid gap-5 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl border border-stone-200 p-4 text-sm font-semibold text-stone-700 md:col-span-2">
            <input name="enabled" type="checkbox" defaultChecked={shipping.enabled} className="h-5 w-5" />
            تفعيل الشحن والسماح بإنشاء الطلبات الجديدة
          </label>

          <label className="grid gap-2 text-sm font-medium text-stone-700 md:col-span-2">
            اسم طريقة الشحن
            <input name="method_name" defaultValue={shipping.methodName} className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
          </label>

          <label className="grid gap-2 text-sm font-medium text-stone-700">
            تكلفة الشحن الثابتة (ر.س)
            <input name="flat_rate" type="number" min="0" step="0.01" defaultValue={shipping.flatRate} className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
          </label>

          <label className="grid gap-2 text-sm font-medium text-stone-700">
            الشحن المجاني من (ر.س)
            <input name="free_shipping_threshold" type="number" min="0" step="0.01" defaultValue={shipping.freeShippingThreshold ?? ''} placeholder="اتركه فارغًا لتعطيله" className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
          </label>

          <label className="grid gap-2 text-sm font-medium text-stone-700">
            الحد الأدنى المتوقع للتوصيل (يوم)
            <input name="estimated_min_days" type="number" min="0" step="1" defaultValue={shipping.estimatedMinDays ?? ''} className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
          </label>

          <label className="grid gap-2 text-sm font-medium text-stone-700">
            الحد الأعلى المتوقع للتوصيل (يوم)
            <input name="estimated_max_days" type="number" min="0" step="1" defaultValue={shipping.estimatedMaxDays ?? ''} className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-brand-gold" />
          </label>

          <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
            لا تفعّل الشحن قبل تحديد السياسة الفعلية. لاحقًا يمكننا استبدال التسعير الثابت بتكامل شركة شحن دون تغيير دورة الطلب الأساسية.
          </div>

          <button className="rounded-full bg-brand-navy px-7 py-4 text-sm font-bold text-white md:col-span-2">
            حفظ إعدادات الشحن
          </button>
        </form>
      </section>
    </AdminShell>
  )
}
