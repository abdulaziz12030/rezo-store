export default function CartPage() {
  const cartItems = [
    { id: 1, name: 'جلابية النور أحمر ناري Pro White', qty: 1, price: 220 },
    { id: 2, name: 'جلابية الريم جملي مطفي قصة مثلث', qty: 1, price: 260 }
  ]

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0)
  const shipping = 27.6
  const total = subtotal + shipping

  return (
    <main className="container-shell py-16">
      <h1 className="text-3xl font-bold text-brand-navy">سلة المشتريات</h1>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-brand-navy">{item.name}</h2>
                  <p className="mt-2 text-sm text-stone-500">الكمية: {item.qty}</p>
                </div>
                <div className="text-lg font-bold text-brand-navy">{item.price} ر.س</div>
              </div>
            </div>
          ))}
        </div>

        <aside className="rounded-[28px] border border-stone-200 bg-brand-sand p-6 shadow-soft">
          <h2 className="text-xl font-bold text-brand-navy">ملخص الطلب</h2>
          <div className="mt-6 space-y-3 text-sm text-stone-700">
            <div className="flex items-center justify-between"><span>الإجمالي الفرعي</span><span>{subtotal.toFixed(2)} ر.س</span></div>
            <div className="flex items-center justify-between"><span>الشحن</span><span>{shipping.toFixed(2)} ر.س</span></div>
            <div className="flex items-center justify-between border-t border-stone-300 pt-3 text-base font-bold text-brand-navy"><span>الإجمالي</span><span>{total.toFixed(2)} ر.س</span></div>
          </div>
          <a href="/checkout" className="mt-6 block rounded-full bg-brand-navy px-6 py-4 text-center text-sm font-bold text-white transition hover:opacity-90">
            المتابعة لإتمام الطلب
          </a>
        </aside>
      </div>
    </main>
  )
}
