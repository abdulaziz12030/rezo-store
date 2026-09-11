'use client'

import { useMemo, useState } from 'react'
import { addToCart } from '@/lib/actions/cart'
import type { Product, ProductVariant } from '@/types'

function unique(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

function salePercent(price: number, compareAt?: number) {
  if (!compareAt || compareAt <= price) return null
  return Math.round(((compareAt - price) / compareAt) * 100)
}

function choiceLabel(variant: ProductVariant) {
  return [variant.optionLabel, variant.size, variant.color]
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)
    .join(' · ')
}

export function ProductPurchasePanel({ product }: { product: Product }) {
  const variants = product.variants ?? []
  const sizes = useMemo(() => unique(variants.map((variant) => variant.size)), [variants])
  const colors = useMemo(() => unique(variants.map((variant) => variant.color)), [variants])
  const labels = useMemo(() => unique(variants.map((variant) => variant.optionLabel)), [variants])

  const [selectedSize, setSelectedSize] = useState<string | null>(sizes.length === 1 ? sizes[0] : null)
  const [selectedColor, setSelectedColor] = useState<string | null>(colors.length === 1 ? colors[0] : null)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(labels.length === 1 ? labels[0] : null)
  const [quantity, setQuantity] = useState(1)

  const matchesSelection = (variant: ProductVariant) => {
    if (selectedSize && variant.size !== selectedSize) return false
    if (selectedColor && variant.color !== selectedColor) return false
    if (selectedLabel && variant.optionLabel !== selectedLabel) return false
    return true
  }

  const dimensionsComplete = (!sizes.length || Boolean(selectedSize)) && (!colors.length || Boolean(selectedColor)) && (!labels.length || Boolean(selectedLabel))
  const candidates = variants.filter(matchesSelection)
  const selectedVariant = dimensionsComplete && candidates.length === 1 ? candidates[0] : null

  const currentPrice = selectedVariant?.priceOverride ?? product.price
  const currentCompareAt = selectedVariant?.compareAtPrice ?? product.compareAtPrice
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock
  const lowStockThreshold = selectedVariant?.lowStockThreshold ?? product.lowStockThreshold ?? 2
  const inventoryTracked = product.trackInventory !== false
  const canBackorder = product.allowBackorder === true
  const inStock = !inventoryTracked || canBackorder || currentStock > 0
  const variantRequired = variants.length > 0
  const readyToAdd = inStock && (!variantRequired || Boolean(selectedVariant))
  const discount = salePercent(currentPrice, currentCompareAt)
  const lowStock = inventoryTracked && !canBackorder && currentStock > 0 && currentStock <= lowStockThreshold
  const maxQuantity = inventoryTracked && !canBackorder ? Math.max(1, Math.min(20, currentStock)) : 20

  const optionAvailable = (kind: 'size' | 'color' | 'label', value: string) => {
    return variants.some((variant) => {
      if (kind !== 'size' && selectedSize && variant.size !== selectedSize) return false
      if (kind !== 'color' && selectedColor && variant.color !== selectedColor) return false
      if (kind !== 'label' && selectedLabel && variant.optionLabel !== selectedLabel) return false
      if (kind === 'size' && variant.size !== value) return false
      if (kind === 'color' && variant.color !== value) return false
      if (kind === 'label' && variant.optionLabel !== value) return false
      return !inventoryTracked || canBackorder || variant.stock > 0
    })
  }

  const choose = (kind: 'size' | 'color' | 'label', value: string) => {
    if (kind === 'size') setSelectedSize((current) => current === value ? null : value)
    if (kind === 'color') setSelectedColor((current) => current === value ? null : value)
    if (kind === 'label') setSelectedLabel((current) => current === value ? null : value)
    setQuantity(1)
  }

  const renderChoices = (title: string, kind: 'size' | 'color' | 'label', values: string[], selected: string | null) => {
    if (!values.length) return null
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-brand-navy">{title}</span>
          {selected ? <span className="text-xs text-stone-500">المحدد: {selected}</span> : <span className="text-xs text-amber-700">اختاري أحد الخيارات</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {values.map((value) => {
            const active = selected === value
            const available = optionAvailable(kind, value)
            return (
              <button
                key={value}
                type="button"
                disabled={!available && !active}
                onClick={() => choose(kind, value)}
                className={`rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${active ? 'border-brand-navy bg-brand-navy text-white' : available ? 'border-stone-300 bg-white text-stone-700 hover:border-brand-gold' : 'cursor-not-allowed border-stone-200 bg-stone-100 text-stone-300'}`}
              >
                {value}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-7">
      <div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="text-3xl font-bold text-brand-navy">{currentPrice.toFixed(2)} ر.س</div>
          {currentCompareAt && currentCompareAt > currentPrice ? (
            <div className="pb-1 text-lg text-stone-400 line-through">{currentCompareAt.toFixed(2)} ر.س</div>
          ) : null}
          {discount ? <span className="mb-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">خصم {discount}%</span> : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
          {!inventoryTracked ? <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-600">متاح للطلب</span> : null}
          {canBackorder && currentStock <= 0 ? <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">متاح بالطلب المسبق</span> : null}
          {lowStock ? <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">بقي {currentStock} فقط</span> : null}
          {inventoryTracked && !canBackorder && currentStock <= 0 ? <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">نفد المخزون</span> : null}
          {selectedVariant?.sku ? <span className="rounded-full bg-stone-100 px-3 py-1 font-mono text-stone-600">SKU: {selectedVariant.sku}</span> : product.sku ? <span className="rounded-full bg-stone-100 px-3 py-1 font-mono text-stone-600">SKU: {product.sku}</span> : null}
        </div>
      </div>

      {variants.length ? (
        <div className="space-y-6 rounded-3xl border border-stone-200 bg-stone-50/70 p-5">
          {renderChoices('المقاس', 'size', sizes, selectedSize)}
          {renderChoices('اللون', 'color', colors, selectedColor)}
          {renderChoices('الخيار', 'label', labels, selectedLabel)}

          {dimensionsComplete && candidates.length > 1 ? (
            <div className="rounded-2xl bg-amber-50 p-4 text-xs leading-6 text-amber-800">
              يوجد أكثر من خيار مطابق. راجعي المقاس واللون أو الوصف حتى يتم تحديد الخيار المطلوب بدقة.
            </div>
          ) : null}

          {selectedVariant ? (
            <div className="rounded-2xl bg-white p-4 text-sm text-stone-600">
              <span className="font-bold text-brand-navy">الخيار المحدد:</span> {choiceLabel(selectedVariant) || selectedVariant.sku}
            </div>
          ) : null}
        </div>
      ) : null}

      <form action={addToCart} className="space-y-5">
        <input type="hidden" name="product_id" value={product.id} />
        {selectedVariant ? <input type="hidden" name="variant_id" value={selectedVariant.id} /> : null}

        <label className="grid max-w-36 gap-2 text-sm font-bold text-brand-navy">
          الكمية
          <input
            type="number"
            name="quantity"
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Math.min(maxQuantity, Number(event.target.value) || 1)))}
            min={1}
            max={maxQuantity}
            className="rounded-2xl border border-stone-300 px-4 py-3 text-center outline-none focus:border-brand-gold"
          />
        </label>

        <button
          disabled={!readyToAdd}
          className="w-full rounded-full bg-brand-navy px-7 py-4 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {!inStock ? 'نفد المخزون' : variantRequired && !selectedVariant ? 'اختاري المقاس / اللون' : 'أضف إلى السلة'}
        </button>
      </form>

      <div className="grid gap-3 rounded-3xl bg-brand-sand/60 p-5 text-sm leading-7 text-stone-700 sm:grid-cols-2">
        <div><span className="font-bold text-brand-navy">المخزون:</span> {!inventoryTracked ? 'متاح' : `${currentStock} قطعة`}</div>
        <div><span className="font-bold text-brand-navy">حالة الطلب:</span> {inStock ? 'متاح للطلب' : 'غير متاح حاليًا'}</div>
      </div>
    </div>
  )
}
