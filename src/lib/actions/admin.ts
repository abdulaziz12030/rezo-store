'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server'

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

export async function createCategory(formData: FormData) {
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
  const stock = Number(formData.get('stock') || 0)
  const isActive = formData.get('is_active') === 'on'
  const isFeatured = formData.get('is_featured') === 'on'
  const imageFile = formData.get('image') as File | null

  if (!name || !slug || !categoryId || !price) {
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
  const stock = Number(formData.get('stock') || 0)
  const isActive = formData.get('is_active') === 'on'
  const isFeatured = formData.get('is_featured') === 'on'
  const imageFile = formData.get('image') as File | null

  if (!id || !name || !slug || !categoryId || !price) {
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

  revalidatePath('/')
  revalidatePath('/products')
  revalidatePath('/admin/products')
  redirect('/admin/products')
}
