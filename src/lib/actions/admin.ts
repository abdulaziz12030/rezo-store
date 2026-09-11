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

async function uploadProductImage(file: File | null) {
  if (!file || file.size === 0) return null

  const supabase = getSupabaseAdmin()
  const extension = file.name.split('.').pop() || 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
  const path = `products/${filename}`
  const arrayBuffer = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, arrayBuffer, {
      contentType: file.type || 'image/jpeg',
      upsert: false
    })

  if (error) throw new Error(`فشل رفع الصورة: ${error.message}`)

  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}

async function recalculateProductStock(productId: string) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('product_variants')
    .select('stock')
    .eq('product_id', productId)
    .eq('is_active', true)

  if (error) throw new Error(error.message)
  if (!data?.length) return

  const stock = data.reduce((sum, row) => sum + Number(row.stock || 0), 0)
  const { error: updateError } = await supabase.from('products').update({ stock }).eq('id', productId)
  if (updateError) throw new Error(updateError.message)
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
  const shortDescription = String(formData.get('short_description') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const price = Number(formData.get('price') || 0)
  const compareAtPriceRaw = String(formData.get('compare_at_price') || '').trim()
  const compareAtPrice = compareAtPriceRaw ? Number(compareAtPriceRaw) : null
  const stock = Math.max(0, Number(formData.get('stock') || 0))
  const isActive = formData.get('is_active') === 'on'
  const isFeatured = formData.get('is_featured') === 'on'
  const imageFile = formData.get('image') as File | null

  if (!name || !slug || !categoryId || price <= 0) {
    throw new Error('الاسم والسعر والتصنيف مطلوبة.')
  }

  const imageUrl = await uploadProductImage(imageFile)
  const supabase = getSupabaseAdmin()

  const { error } = await supabase.from('products').insert({
    name,
    slug,
    category_id: categoryId,
    short_description: shortDescription,
    description,
    price,
    compare_at_price: compareAtPrice,
    stock,
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
  const shortDescription = String(formData.get('short_description') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const price = Number(formData.get('price') || 0)
  const compareAtPriceRaw = String(formData.get('compare_at_price') || '').trim()
  const compareAtPrice = compareAtPriceRaw ? Number(compareAtPriceRaw) : null
  const stock = Math.max(0, Number(formData.get('stock') || 0))
  const isActive = formData.get('is_active') === 'on'
  const isFeatured = formData.get('is_featured') === 'on'
  const imageFile = formData.get('image') as File | null

  if (!id || !name || !slug || !categoryId || price <= 0) {
    throw new Error('بيانات المنتج غير مكتملة.')
  }

  const payload: Record<string, unknown> = {
    name,
    slug,
    category_id: categoryId,
    short_description: shortDescription,
    description,
    price,
    compare_at_price: compareAtPrice,
    stock,
    is_active: isActive,
    is_featured: isFeatured
  }

  if (imageFile && imageFile.size > 0) {
    payload.image_url = await uploadProductImage(imageFile)
  }

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('products').update(payload).eq('id', id)
  if (error) throw new Error(error.message)

  await recalculateProductStock(id)

  revalidatePath('/')
  revalidatePath('/products')
  revalidatePath(`/products/${slug}`)
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${id}/edit`)
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
  const priceOverrideRaw = String(formData.get('price_override') || '').trim()
  const priceOverride = priceOverrideRaw ? Number(priceOverrideRaw) : null
  const stock = Math.max(0, Number(formData.get('stock') || 0))
  const weightRaw = String(formData.get('weight_grams') || '').trim()
  const weightGrams = weightRaw ? Math.max(0, Number(weightRaw)) : null

  if (!productId || !sku) throw new Error('رقم المنتج وSKU مطلوبان.')

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('product_variants').insert({
    product_id: productId,
    sku,
    size,
    color,
    option_label: optionLabel,
    price_override: priceOverride,
    stock,
    weight_grams: weightGrams,
    is_active: true
  })

  if (error) throw new Error(error.message)
  await recalculateProductStock(productId)

  revalidatePath('/products')
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}/edit`)
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
  const priceOverrideRaw = String(formData.get('price_override') || '').trim()
  const priceOverride = priceOverrideRaw ? Number(priceOverrideRaw) : null
  const stock = Math.max(0, Number(formData.get('stock') || 0))
  const weightRaw = String(formData.get('weight_grams') || '').trim()
  const weightGrams = weightRaw ? Math.max(0, Number(weightRaw)) : null
  const isActive = formData.get('is_active') === 'on'

  if (!id || !productId || !sku) throw new Error('بيانات الخيار غير مكتملة.')

  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('product_variants')
    .update({
      sku,
      size,
      color,
      option_label: optionLabel,
      price_override: priceOverride,
      stock,
      weight_grams: weightGrams,
      is_active: isActive
    })
    .eq('id', id)
    .eq('product_id', productId)

  if (error) throw new Error(error.message)
  await recalculateProductStock(productId)

  revalidatePath('/products')
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}/edit`)
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
  await recalculateProductStock(productId)

  revalidatePath('/products')
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}/edit`)
}
