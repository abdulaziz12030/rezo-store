import Link from 'next/link'
import { ShoppingBag, Menu } from 'lucide-react'
import { storeMeta } from '@/lib/data'

const navItems = [
  { label: 'الرئيسية', href: '/' },
  { label: 'المنتجات', href: '/products' },
  { label: 'السلة', href: '/cart' },
  { label: 'لوحة التحكم', href: '/admin' }
]

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="container-shell flex h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button className="rounded-full border border-stone-300 p-2 text-stone-600 lg:hidden" type="button">
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="text-lg font-bold tracking-[0.18em] text-brand-navy">
            {storeMeta.name}
          </Link>
        </div>

        <nav className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-stone-700 transition hover:text-brand-gold">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/cart" className="relative rounded-full bg-brand-navy p-3 text-white transition hover:opacity-90">
            <ShoppingBag className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  )
}
