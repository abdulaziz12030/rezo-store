import Link from 'next/link'
import { LayoutGrid, Package, Shapes } from 'lucide-react'

const items = [
  { href: '/admin', label: 'الرئيسية', icon: LayoutGrid },
  { href: '/admin/categories', label: 'التصنيفات', icon: Shapes },
  { href: '/admin/products', label: 'المنتجات', icon: Package }
]

export function AdminShell({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <main className="bg-stone-50 py-10">
      <div className="container-shell grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-[28px] bg-white p-5 shadow-soft">
          <p className="text-xs font-semibold tracking-[0.35em] text-brand-gold">REZO ADMIN</p>
          <h2 className="mt-3 text-2xl font-bold text-brand-navy">لوحة التحكم</h2>
          <div className="mt-6 space-y-2">
            {items.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700 transition hover:border-brand-gold hover:text-brand-navy"
                >
                  <span>{item.label}</span>
                  <Icon className="h-4 w-4" />
                </Link>
              )
            })}
          </div>
          <div className="mt-6 rounded-2xl bg-brand-sand/70 p-4 text-sm leading-7 text-stone-700">
            النسخة الحالية تجهز لك إدارة المنتجات والتصنيفات وربط صور المنتجات عبر Supabase Storage.
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-[28px] bg-white p-6 shadow-soft">
            <h1 className="text-3xl font-bold text-brand-navy">{title}</h1>
            {description ? <p className="mt-3 text-sm leading-7 text-stone-600">{description}</p> : null}
          </div>
          {children}
        </section>
      </div>
    </main>
  )
}
