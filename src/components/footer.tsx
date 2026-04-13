import Link from 'next/link'
import { storeMeta } from '@/lib/data'

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-brand-sand py-12">
      <div className="container-shell grid gap-8 md:grid-cols-3">
        <div>
          <h3 className="text-lg font-bold text-brand-navy">{storeMeta.name}</h3>
          <p className="mt-4 text-sm leading-7 text-stone-600">{storeMeta.description}</p>
        </div>

        <div>
          <h4 className="text-sm font-bold text-brand-navy">روابط مهمة</h4>
          <div className="mt-4 space-y-3 text-sm text-stone-600">
            <Link href="/products" className="block hover:text-brand-gold">المنتجات</Link>
            <Link href="/cart" className="block hover:text-brand-gold">السلة</Link>
            <Link href="/checkout" className="block hover:text-brand-gold">إتمام الطلب</Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-brand-navy">تواصل معنا</h4>
          <div className="mt-4 space-y-3 text-sm text-stone-600">
            <a href={`https://wa.me/${storeMeta.whatsapp}`} target="_blank" rel="noreferrer" className="block hover:text-brand-gold">
              واتساب
            </a>
            <a href={storeMeta.instagram} target="_blank" rel="noreferrer" className="block hover:text-brand-gold">
              إنستغرام
            </a>
            <a href={storeMeta.tiktok} target="_blank" rel="noreferrer" className="block hover:text-brand-gold">
              تيك توك
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
