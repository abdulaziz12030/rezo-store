'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { ProductImage } from '@/types'

export function ProductGallery({ images, productName }: { images: ProductImage[]; productName: string }) {
  const safeImages = images.filter((image) => Boolean(image.url))
  const [selectedId, setSelectedId] = useState(safeImages[0]?.id ?? '')
  const selected = safeImages.find((image) => image.id === selectedId) ?? safeImages[0]

  if (!selected) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-[36px] bg-stone-100 text-sm text-stone-400 shadow-soft">
        لا توجد صورة للمنتج
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[36px] bg-white shadow-soft">
        <Image
          src={selected.url}
          alt={selected.altText || productName}
          fill
          priority
          sizes="(min-width: 1024px) 52vw, 100vw"
          className="object-cover transition duration-300"
        />
      </div>

      {safeImages.length > 1 ? (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {safeImages.map((image) => {
            const active = image.id === selected.id
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedId(image.id)}
                aria-label={`عرض ${image.altText || productName}`}
                className={`relative aspect-square overflow-hidden rounded-2xl border-2 bg-white transition ${active ? 'border-brand-gold shadow-soft' : 'border-transparent opacity-75 hover:opacity-100'}`}
              >
                <Image src={image.url} alt={image.altText || productName} fill sizes="140px" className="object-cover" />
              </button>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
