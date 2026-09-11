'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error('قم أولًا بربط Supabase من خلال ملف .env.local قبل استخدام لوحة التحكم الحقيقية.')
  }
}

function requiredPositiveNumber(value: FormDataEntryValue | null, label: string) {
  const parsed = Number(String(value ?? '').trim())
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${label} يجب أن يكون رقمًا أكبر من صفر.`)
  return parsed
}

function optionalNonNegativeNumber(value: FormDataEntryValue | null, label: string) {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${label} يجب أن يكون رقمًا صحيحًا غير سالب.`)
  return parsed
}

function nonNegativeInteger(value: FormDataEntryValue | null, label: string, fallback = 0) {
  const raw = String(value ?? '').trim()
  if (!raw) return fallback
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`${label} يجب أن يكون عددًا صحيحًا غير سالب.`)
  return parsed
}

function validateCompareAtPrice(price: number, compareAtPrice: number | null) {
  if (compareAtPrice !== null && compareAtPrice <= price) {
    throw new Error('السعر قبل الخصم يجب أن يكون أعلى من سعر البيع الحالي.')
  }
}

async function uploadProductImage(file: File | null) {
  if (!file || file.size === 0) return null

  const allowedTypes = new Map([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
    ['image/avif', 'avif']
  ])
  const extension = allowedTypes.get(file.type)
  if (!extension) throw new Error('صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WebP أو AVIF.')
  if (file.size > 8 * 1024 * 1024) throw new Error('حجم الصورة كبير. الحد الأقصى 8 ميجابايت.')

  const supabase = getSupabaseAdmin()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
  const path = `products/${filename}`
  const arrayBuffer = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false
    })

  if (error) throw new Error(`فشل رفع الصورة: ${error.message}`)

  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}

async function recalculateProductStock(productId: string, resetWhenEmpty = false) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('product_variants')
    .select('stock, is_active')
    .eq('product_id', productId)

  if (error) throw new Error(error.message)
  if (!data?.length) {
    if (resetWhenEmpty) {
      const { error: resetError } = await supabase.from('products').update({ stock: 0 }).eq('id', productId)
      if (resetError) throw new Error(resetError.message)
    }
    return
  }

  const stock = data
    .filter((row) => row.is_active)
    .reduce((sum, row) => sum + Number(row.stock || 0), 0)
  const { error: updateError } = await supabase.from('products').update({ stock }).eq('id', productId)
  if (updateError) throw new Error(updateError.message)
}

async function validateVariantPricing(productId: string, priceOverride: number | null, compareAtPrice: number | null) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from('products').select('price').eq('id', productId).maybeSingle()
  if (error || !data) throw new Error('تعذر العثور على المنتج المرتبط بهذا الخيار.')

  if (priceOverride !== null && priceOverride <= 0) throw new Error('السعر الخاص للخيار يجب أن يكون أكبر من صفر.')
  const effectivePrice = priceOverride ?? Number(data.price)
  validateCompareAtPrice(effectivePrice, compareAtPrice)
}

function revalidateProductPaths(productId: string) {
  revalidatePath('/')
  revalidatePath('/products')
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}/edit`)
}

export async function createCategory(formData: FormData) {
  await requireAdmin()
  requireSupabase()

  const name = String(formData.get('name') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const slugInput = String(formData.get('slug') || '').trim()
  const slug = slugify(slugInput || name)

  if (!name || !slug) throw new Error('اسم التصنيف والـ slug مطلوبان.')

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('categories').insert({
    name,
    slug,
    description,
    is_active: true
  })

  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/admin/categories')
  redirect('/admin/categories')
}

export async function updateCategory(formData: FormData) {
  await requireAdmin()
  requireSupabase()

  const id = String(formData.get('id') || '')
  const name = String(formData.get('name') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const slugInput = String(formData.get('slug') || '').trim()
  const slug = slugify(slugInput || name)

  if (!id || !name || !slug) throw new Error('بيانات التصنيف غير مكتملة.')

  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('categories')
    .update({ name, slug, description })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/admin/categories')
  redirect('/admin/categories')
}

export async function createProduct(formData: FormData) {
  await requireAdmin()
  requireSupabase()

  const name = String(formData.get('name') || '').trim()
  const slugInput = String(formData.get('slug') || '').trim()
  const slug = slugify(slugInput || name)
  const categoryId = String(formData.get('category_id') || '').trim()
  const sku = String(formData.get('sku') || '').trim() || null
  const shortDescription = String(formData.get('short_description') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const seoTitle = String(formData.get('seo_title') || '').trim() || null
  const seoDescription = String(formData.get('seo_description') || '').trim() || null
  const price = requiredPositiveNumber(formData.get('price'), 'السعر')
  const compareAtPrice = optionalNonNegativeNumber(formData.get('compare_at_price'), 'السعر قبل الخصم')
  const stock = nonNegativeInteger(formData.get('stock'), 'المخزون')
  const lowStockThreshold = nonNegativeInteger(formData.get('low_stock_threshold'), 'حد قرب النفاد', 2)
  const trackInventory = formData.get('track_inventory') === 'on'
  const allowBackorder = formData.get('allow_backorder') === 'on'
  const isActive = formData.get('is_active') === 'on'
  const isFeatured = formData.get('is_featured') === 'on'
  const imageFile = formData.get('image') as File | null

  if (!name || !slug || !categoryId) throw new Error('الاسم والتصنيف مطلوبان.')
  validateCompareAtPrice(price, compareAtPrice)

  const imageUrl = await uploadProductImage(imageFile)
  const supabase = getSupabaseAdmin()

  const { error } = await supabase.from('products').insert({
    name,
    slug,
    category_id: categoryId,
    sku,
    short_description: shortDescription,
    description,
    seo_title: seoTitle,
    seo_description: seoDescription,
    price,
    compare_at_price: compareAtPrice,
    stock,
    low_stock_threshold: lowStockThreshold,
    track_inventory: trackInventory,
    allow_backorder: allowBackorder,
    is_active: isActive,
    is_featured: isFeatured,
    image_url: imageUrl
  })

  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/products')
  revalidatePath('/admin/products')
  redirect('/admin/products')
}

export async function updateProduct(formData: FormData) {
  await requireAdmin()
  requireSupabase()

  const id = String(formData.get('id') || '').trim()
  const name = String(formData.get('name') || '').trim()
  const slugInput = String(formData.get('slug') || '').trim()
  const slug = slugify(slugInput || name)
  const categoryId = String(formData.get('category_id') || '').trim()
  const sku = String(formData.get('sku') || '').trim() || null
  const shortDescription = String(formData.get('short_description') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const seoTitle = String(formData.get('seo_title') || '').trim() || null
  const seoDescription = String(formData.get('seo_description') || '').trim() || null
  const price = requiredPositiveNumber(formData.get('price'), 'السعر')
  const compareAtPrice = optionalNonNegativeNumber(formData.get('compare_at_price'), 'السعر قبل الخصم')
  const stock = nonNegativeInteger(formData.get('stock'), 'المخزون')
  const lowStockThreshold = nonNegativeInteger(formData.get('low_stock_threshold'), 'حد قرب النفاد', 2)
  const trackInventory = formData.get('track_inventory') === 'on'
  const allowBackorder = formData.get('allow_backorder') === 'on'
  const isActive = formData.get('is_active') === 'on'
  const isFeatured = formData.get('is_featured') === 'on'
  const imageFile = formData.get('image') as File | null

  if (!id || !name || !slug || !categoryId) throw new Error('بيانات المنتج غير مكتملة.')
  validateCompareAtPrice(price, compareAtPrice)

  const payload: Record<string, unknown> = {
    name,
    slug,
    category_id: categoryId,
    sku,
    short_description: shortDescription,
    description,
    seo_title: seoTitle,
    seo_description: seoDescription,
    price,
    compare_at_price: compareAtPrice,
    stock,
    low_stock_threshold: lowStockThreshold,
    track_inventory: trackInventory,
    allow_backorder: allowBackorder,
    is_active: isActive,
    is_featured: isFeatured
  }

  if (imageFile && imageFile.size > 0) payload.image_url = await uploadProductImage(imageFile)

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('products').update(payload).eq('id', id)
  if (error) throw new Error(error.message)

  await recalculateProductStock(id)

  revalidateProductPaths(id)
  revalidatePath(`/products/${slug}`)
  redirect(`/admin/products/${id}/edit`)
}

export async function createProductVariant(formData: FormData) {
  await requireAdmin()
  requireSupabase()

  const productId = String(formData.get('product_id') || '').trim()
  const sku = String(formData.get('sku') || '').trim()
  const size = String(formData.get('size') || '').trim() || null
  const color = String(formData.get('color') || '').trim() || null
  const optionLabel = String(formData.get('option_label') || '').trim() || null
  const priceOverride = optionalNonNegativeNumber(formData.get('price_override'), 'السعر الخاص')
  const compareAtPrice = optionalNonNegativeNumber(formData.get('compare_at_price'), 'السعر قبل الخصم')
  const costPrice = optionalNonNegativeNumber(formData.get('cost_price'), 'سعر التكلفة')
  const stock = nonNegativeInteger(formData.get('stock'), 'مخزون الخيار')
  const lowStockThreshold = nonNegativeInteger(formData.get('low_stock_threshold'), 'حد قرب النفاد', 2)
  const weightGrams = optionalNonNegativeNumber(formData.get('weight_grams'), 'الوزن')

  if (!productId || !sku) throw new Error('رقم المنتج وSKU مطلوبان.')
  await validateVariantPricing(productId, priceOverride, compareAtPrice)

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('product_variants').insert({
    product_id: productId,
    sku,
    size,
    color,
    option_label: optionLabel,
    price_override: priceOverride,
    compare_at_price: compareAtPrice,
    cost_price: costPrice,
    stock,
    low_stock_threshold: lowStockThreshold,
    weight_grams: weightGrams === null ? null : Math.round(weightGrams),
    is_active: true
  })

  if (error) throw new Error(error.message)
  await recalculateProductStock(productId, true)
  revalidateProductPaths(productId)
}

export async function updateProductVariant(formData: FormData) {
  await requireAdmin()
  requireSupabase()

  const id = String(formData.get('id') || '').trim()
  const productId = String(formData.get('product_id') || '').trim()
  const sku = String(formData.get('sku') || '').trim()
  const size = String(formData.get('size') || '').trim() || null
  const color = String(formData.get('color') || '').trim() || null
  const optionLabel = String(formData.get('option_label') || '').trim() || null
  const priceOverride = optionalNonNegativeNumber(formData.get('price_override'), 'السعر الخاص')
  const compareAtPrice = optionalNonNegativeNumber(formData.get('compare_at_price'), 'السعر قبل الخصم')
  const costPrice = optionalNonNegativeNumber(formData.get('cost_price'), 'سعر التكلفة')
  const stock = nonNegativeInteger(formData.get('stock'), 'مخزون الخيار')
  const lowStockThreshold = nonNegativeInteger(formData.get('low_stock_threshold'), 'حد قرب النفاد', 2)
  const weightGrams = optionalNonNegativeNumber(formData.get('weight_grams'), 'الوزن')
  const isActive = formData.get('is_active') === 'on'

  if (!id || !productId || !sku) throw new Error('بيانات الخيار غير مكتملة.')
  await validateVariantPricing(productId, priceOverride, compareAtPrice)

  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('product_variants')
    .update({
      sku,
      size,
      color,
      option_label: optionLabel,
      price_override: priceOverride,
      compare_at_price: compareAtPrice,
      cost_price: costPrice,
      stock,
      low_stock_threshold: lowStockThreshold,
      weight_grams: weightGrams === null ? null : Math.round(weightGrams),
      is_active: isActive
    })
    .eq('id', id)
    .eq('product_id', productId)

  if (error) throw new Error(error.message)
  await recalculateProductStock(productId, true)
  revalidateProductPaths(productId)
}

export async function deleteProductVariant(formData: FormData) {
  await requireAdmin()
  requireSupabase()

  const id = String(formData.get('id') || '').trim()
  const productId = String(formData.get('product_id') || '').trim()
  if (!id || !productId) throw new Error('بيانات الحذف غير مكتملة.')

  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('product_variants')
    .delete()
    .eq('id', id)
    .eq('product_id', productId)

  if (error) throw new Error(error.message)
  await recalculateProductStock(productId, true)
  revalidateProductPaths(productId)
}
