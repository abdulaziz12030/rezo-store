import {
  categories as fallbackCategories,
  getCategoryBySlug as getFallbackCategoryBySlug,
  getFeaturedProducts as getFallbackFeaturedProducts,
  getProductBySlug as getFallbackProductBySlug,
  getProductsByCategorySlug as getFallbackProductsByCategorySlug,
  products as fallbackProducts,
  reviews,
  storeMeta,
  heroBanner
} from '@/lib/data'
import type { Category, DbCategory, DbProduct, Product } from '@/types'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server'

function normalizeNumber(value: number | string | null | undefined) {
  if (typeof value === 'number') return value
  if (!value) return 0
  return Number(value)
}

function mapDbCategory(category: DbCategory): Category {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? ''
  }
}

function mapDbProduct(product: DbProduct): Product {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.categories?.name ?? 'غير مصنف',
    categorySlug: product.categories?.slug ?? 'general',
    shortDescription: product.short_description ?? '',
    description: product.description ?? '',
    price: normalizeNumber(product.price),
    compareAtPrice: product.compare_at_price ? normalizeNumber(product.compare_at_price) : undefined,
    stock: product.stock ?? 0,
    rating: 5,
    reviewCount: 0,
    featured: product.is_featured,
    image: product.image_url ?? '/images/products/alreem-camel.svg',
    colors: []
  }
}

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return fallbackCategories

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.from('categories').select('*').order('name')
    if (error || !data?.length) return fallbackCategories
    return data.map(mapDbCategory)
  } catch {
    return fallbackCategories
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  if (!isSupabaseConfigured()) return getFallbackCategoryBySlug(slug)

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.from('categories').select('*').eq('slug', slug).maybeSingle()
    if (error || !data) return getFallbackCategoryBySlug(slug)
    return mapDbCategory(data)
  } catch {
    return getFallbackCategoryBySlug(slug)
  }
}

export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return fallbackProducts

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(id, name, slug, description)')
      .order('created_at', { ascending: false })

    if (error || !data?.length) return fallbackProducts
    return data.map(mapDbProduct)
  } catch {
    return fallbackProducts
  }
}

export async function getFeaturedProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return getFallbackFeaturedProducts()

  const all = await getProducts()
  return all.filter((product) => product.featured)
}

export async function getProductsByCategorySlug(slug: string): Promise<Product[]> {
  if (!isSupabaseConfigured()) return getFallbackProductsByCategorySlug(slug)

  const all = await getProducts()
  return all.filter((product) => product.categorySlug === slug)
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  if (!isSupabaseConfigured()) return getFallbackProductBySlug(slug)

  const all = await getProducts()
  return all.find((product) => product.slug === slug)
}

export async function getAdminCategories(): Promise<DbCategory[]> {
  if (!isSupabaseConfigured()) {
    return fallbackCategories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      is_active: true
    }))
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getAdminProducts(): Promise<DbProduct[]> {
  if (!isSupabaseConfigured()) {
    return fallbackProducts.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      category_id: product.categorySlug,
      short_description: product.shortDescription,
      description: product.description,
      price: product.price,
      compare_at_price: product.compareAtPrice ?? null,
      stock: product.stock,
      is_active: true,
      is_featured: Boolean(product.featured),
      image_url: product.image,
      categories: {
        id: product.categorySlug,
        name: product.category,
        slug: product.categorySlug,
        description: ''
      }
    }))
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(id, name, slug, description)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getAdminCategoryById(id: string): Promise<DbCategory | null> {
  if (!isSupabaseConfigured()) {
    const category = fallbackCategories.find((item) => item.id === id)
    return category ? { ...category, is_active: true } : null
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from('categories').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function getAdminProductById(id: string): Promise<DbProduct | null> {
  if (!isSupabaseConfigured()) {
    const product = fallbackProducts.find((item) => item.id === id)
    if (!product) return null
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      category_id: product.categorySlug,
      short_description: product.shortDescription,
      description: product.description,
      price: product.price,
      compare_at_price: product.compareAtPrice ?? null,
      stock: product.stock,
      is_active: true,
      is_featured: Boolean(product.featured),
      image_url: product.image,
      categories: null
    }
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(id, name, slug, description)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export { reviews, storeMeta, heroBanner }
