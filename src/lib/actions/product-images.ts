'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/admin'
import { getSupabaseAdmin } from '@/lib/supabase/server'

const BUCKET = 'product-images'
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

function storagePathFromUrl(url: string) {
  const index = url.indexOf(PUBLIC_MARKER)
  if (index < 0) return null
  return decodeURIComponent(url.slice(index + PUBLIC_MARKER.length))
}

async function uploadImage(file: File) {
  if (!file || file.size === 0) throw new Error('اختر صورة أولًا.')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('حجم الصورة يتجاوز 10MB.')
  if (file.type && !ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error('صيغة الصورة غير مدعومة.')

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `products/${Date.now()}-${crypto.randomUUID()}.${extension}`
  const supabase = getSupabaseAdmin()
  const bytes = await file.arrayBuffer()
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type || 'image/jpeg',
    upsert: false
  })
  if (error) throw new Error(`فشل رفع الصورة: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path }
}

async function audit(actorUserId: string, action: string, productId: string, metadata: Record<string, unknown>) {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('admin_audit_logs').insert({
    actor_user_id: actorUserId,
    action,
    entity_type: 'product_image',
    entity_id: productId,
    metadata
  })
  if (error) throw new Error(error.message)
}

function refreshProduct(productId: string) {
  revalidatePath('/')
  revalidatePath('/products')
  revalidatePath('/products/[slug]', 'page')
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}/edit`)
}

export async function addProductImage(formData: FormData) {
  const admin = await requireAdmin()
  const productId = String(formData.get('product_id') || '').trim()
  const altText = String(formData.get('alt_text') || '').trim() || null
  const sortOrder = Math.max(0, Number(formData.get('sort_order') || 0))
  const requestedPrimary = formData.get('is_primary') === 'on'
  const file = formData.get('image') as File | null

  if (!productId || !file) throw new Error('بيانات الصورة غير مكتملة.')

  const supabase = getSupabaseAdmin()
  const { count, error: countError } = await supabase
    .from('product_images')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)
  if (countError) throw new Error(countError.message)

  const makePrimary = requestedPrimary || Number(count || 0) === 0
  const uploaded = await uploadImage(file)

  try {
    if (makePrimary) {
      const { error } = await supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId)
      if (error) throw error
    }

    const { data: row, error } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        image_url: uploaded.url,
        alt_text: altText,
        sort_order: sortOrder,
        is_primary: makePrimary
      })
      .select('id')
      .single()
    if (error) throw error

    if (makePrimary) {
      const { error: productError } = await supabase.from('products').update({ image_url: uploaded.url }).eq('id', productId)
      if (productError) throw productError
    }

    await audit(admin.userId, 'product_image_add', productId, { image_id: row.id, is_primary: makePrimary })
  } catch (error) {
    await supabase.storage.from(BUCKET).remove([uploaded.path]).catch(() => null)
    throw error
  }

  refreshProduct(productId)
}

export async function updateProductImageMetadata(formData: FormData) {
  const admin = await requireAdmin()
  const imageId = String(formData.get('image_id') || '').trim()
  const productId = String(formData.get('product_id') || '').trim()
  const altText = String(formData.get('alt_text') || '').trim() || null
  const sortOrder = Math.max(0, Number(formData.get('sort_order') || 0))
  if (!imageId || !productId) throw new Error('بيانات الصورة غير مكتملة.')

  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('product_images')
    .update({ alt_text: altText, sort_order: sortOrder })
    .eq('id', imageId)
    .eq('product_id', productId)
  if (error) throw new Error(error.message)

  await audit(admin.userId, 'product_image_update', productId, { image_id: imageId, sort_order: sortOrder })
  refreshProduct(productId)
}

export async function setPrimaryProductImage(formData: FormData) {
  const admin = await requireAdmin()
  const imageId = String(formData.get('image_id') || '').trim()
  const productId = String(formData.get('product_id') || '').trim()
  if (!imageId || !productId) throw new Error('بيانات الصورة غير مكتملة.')

  const supabase = getSupabaseAdmin()
  const { data: image, error: findError } = await supabase
    .from('product_images')
    .select('id, image_url')
    .eq('id', imageId)
    .eq('product_id', productId)
    .maybeSingle()
  if (findError || !image) throw new Error(findError?.message || 'الصورة غير موجودة.')

  const { error: resetError } = await supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId)
  if (resetError) throw new Error(resetError.message)
  const { error: primaryError } = await supabase.from('product_images').update({ is_primary: true }).eq('id', imageId)
  if (primaryError) throw new Error(primaryError.message)
  const { error: productError } = await supabase.from('products').update({ image_url: image.image_url }).eq('id', productId)
  if (productError) throw new Error(productError.message)

  await audit(admin.userId, 'product_image_primary', productId, { image_id: imageId })
  refreshProduct(productId)
}

export async function deleteProductImage(formData: FormData) {
  const admin = await requireAdmin()
  const imageId = String(formData.get('image_id') || '').trim()
  const productId = String(formData.get('product_id') || '').trim()
  if (!imageId || !productId) throw new Error('بيانات الصورة غير مكتملة.')

  const supabase = getSupabaseAdmin()
  const { data: image, error: findError } = await supabase
    .from('product_images')
    .select('id, image_url, is_primary')
    .eq('id', imageId)
    .eq('product_id', productId)
    .maybeSingle()
  if (findError || !image) throw new Error(findError?.message || 'الصورة غير موجودة.')

  const { error: deleteError } = await supabase.from('product_images').delete().eq('id', imageId).eq('product_id', productId)
  if (deleteError) throw new Error(deleteError.message)

  if (image.is_primary) {
    const { data: nextImage, error: nextError } = await supabase
      .from('product_images')
      .select('id, image_url')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (nextError) throw new Error(nextError.message)

    if (nextImage) {
      const { error: nextPrimaryError } = await supabase.from('product_images').update({ is_primary: true }).eq('id', nextImage.id)
      if (nextPrimaryError) throw new Error(nextPrimaryError.message)
      const { error: productError } = await supabase.from('products').update({ image_url: nextImage.image_url }).eq('id', productId)
      if (productError) throw new Error(productError.message)
    } else {
      const { error: productError } = await supabase.from('products').update({ image_url: null }).eq('id', productId)
      if (productError) throw new Error(productError.message)
    }
  }

  const storagePath = storagePathFromUrl(image.image_url)
  if (storagePath) await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => null)

  await audit(admin.userId, 'product_image_delete', productId, { image_id: imageId })
  refreshProduct(productId)
}
