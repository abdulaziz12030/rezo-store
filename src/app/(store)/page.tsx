import Image from 'next/image'
import Link from 'next/link'
import { categories, getFeaturedProducts, getHeroProduct, heroBanner, reviews, storeMeta } from '@/lib/data'
import { ProductCard } from '@/components/product-card'
import { SectionTitle } from '@/components/section-title'

export default function HomePage() {
  const hero = getHeroProduct()
  const featuredProducts = getFeaturedProducts()

  return (
    <main>
      <section className="hero-grid border-b border-stone-200 bg-brand-sand/60">
        <div className="container-shell grid min-h-[75vh] items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div className="space-y-7">
            <p className="text-xs font-semibold tracking-[0.35em] text-brand-gold">{heroBanner.title}</p>
            <h1 className="max-w-xl text-4xl font-bold leading-tight text-brand-navy sm:text-5xl lg:text-6xl">
              {heroBanner.subtitle}
            </h1>
            <p className="max-w-xl text-base leading-8 text-stone-600 sm:text-lg">{heroBanner.description}</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products" className="rounded-full bg-brand-navy px-7 py-4 text-sm font-bold text-white transition hover:opacity-90">
                تسوقي الآن
              </Link>
              <a
                href={`https://wa.me/${storeMeta.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-brand-navy px-7 py-4 text-sm font-bold text-brand-navy transition hover:bg-brand-navy hover:text-white"
              >
                تواصل واتساب
              </a>
            </div>
            <div className="grid max-w-xl grid-cols-3 gap-4 pt-4">
              <div className="rounded-3xl bg-white p-4 shadow-soft">
                <div className="text-2xl font-bold text-brand-navy">30%</div>
                <div className="mt-1 text-sm text-stone-600">خصومات حالية</div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-soft">
                <div className="text-2xl font-bold text-brand-navy">5</div>
                <div className="mt-1 text-sm text-stone-600">مجموعات أساسية</div>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-soft">
                <div className="text-2xl font-bold text-brand-navy">4.9</div>
                <div className="mt-1 text-sm text-stone-600">متوسط التقييم</div>
              </div>
            </div>
          </div>

          <div className="relative h-[520px] overflow-hidden rounded-[36px] bg-white shadow-soft">
            <Image src={heroBanner.image} alt="Rezo Hero" fill className="object-cover" priority />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent p-8 text-white">
              <p className="text-xs tracking-[0.3em] text-brand-gold">القطعة المميزة</p>
              <h2 className="mt-3 text-2xl font-bold">{hero.name}</h2>
              <p className="mt-2 max-w-md text-sm leading-7 text-white/85">{hero.shortDescription}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-20">
        <SectionTitle eyebrow="الأقسام" title="مجموعات ريزو الأساسية" text="الصور الحالية محلية داخل مجلد public ويمكنك استبدالها لاحقًا مباشرة بنفس الأسماء أو تغيير المسارات من ملف data.ts." />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {categories.map((category) => (
            <Link key={category.id} href="/products" className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-soft transition hover:-translate-y-1">
              <div className="gold-gradient h-2 rounded-full" />
              <h3 className="mt-6 text-xl font-bold text-brand-navy">{category.name}</h3>
              <p className="mt-3 text-sm leading-7 text-stone-600">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-stone-50 py-20">
        <div className="container-shell">
          <SectionTitle eyebrow="تفاصيل قد تعجبك" title="منتجات مختارة للعرض" text="هذه نسخة أولية تحتوي على صور محلية افتراضية منظمة داخل المشروع لتسهيل التبديل السريع بصور منتجاتك الأصلية." />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-20">
        <SectionTitle eyebrow="قالوا عنّا" title="آراء العملاء" text="يمكن تحويل هذا القسم لاحقًا إلى تقييمات حقيقية من قاعدة البيانات مع اعتماد المشرف قبل النشر." />
        <div className="grid gap-6 md:grid-cols-2">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-[28px] border border-stone-200 bg-white p-8 shadow-soft">
              <p className="text-lg leading-8 text-stone-700">“{review.body}”</p>
              <p className="mt-5 text-sm font-bold text-brand-navy">{review.customer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
