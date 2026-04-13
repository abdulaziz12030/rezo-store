export default function CheckoutPage() {
  return (
    <main className="container-shell py-16">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-stone-200 bg-white p-8 shadow-soft">
        <h1 className="text-3xl font-bold text-brand-navy">إتمام الطلب</h1>
        <p className="mt-3 text-sm leading-7 text-stone-600">
          هذه صفحة Checkout أولية. تم تجهيزها لتطويرها لاحقًا وربطها ببوابة الدفع وشركة الشحن والعنوان الوطني.
        </p>

        <form className="mt-10 grid gap-5 sm:grid-cols-2">
          <input className="rounded-2xl border border-stone-300 px-4 py-4 outline-none" placeholder="الاسم الكامل" />
          <input className="rounded-2xl border border-stone-300 px-4 py-4 outline-none" placeholder="رقم الجوال" />
          <input className="rounded-2xl border border-stone-300 px-4 py-4 outline-none sm:col-span-2" placeholder="البريد الإلكتروني" />
          <input className="rounded-2xl border border-stone-300 px-4 py-4 outline-none" placeholder="المدينة" />
          <input className="rounded-2xl border border-stone-300 px-4 py-4 outline-none" placeholder="الحي" />
          <input className="rounded-2xl border border-stone-300 px-4 py-4 outline-none sm:col-span-2" placeholder="العنوان التفصيلي" />
          <select className="rounded-2xl border border-stone-300 px-4 py-4 outline-none sm:col-span-2">
            <option>اختيار وسيلة الدفع</option>
            <option>بطاقات مدى / فيزا / ماستركارد</option>
            <option>Apple Pay</option>
          </select>
          <button className="rounded-full bg-brand-navy px-7 py-4 text-sm font-bold text-white sm:col-span-2">
            تأكيد الطلب
          </button>
        </form>
      </div>
    </main>
  )
}
