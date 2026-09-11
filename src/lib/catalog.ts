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
import type {
  Category,
  DbCategory,
  DbProduct,
  DbProductImage,
  DbProductVariant,
  Product,
  ProductImage,
  ProductVariant
} from '@/types'
import { getSupabaseAdmin, getSupabasePublic, isSupabaseConfigured } from '@/lib/supabase/server'

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

function mapImage(image: DbProductImage): ProductImage {
  return {
    id: image.id,
    url: image.image_url,
    altText: image.alt_text ?? undefined,
    isPrimary: Boolean(image.is_primary),
    sortOrder: image.sort_order ?? 0
  }
}

function mapVariant(variant: DbProductVariant): ProductVariant {
  return {
    id: variant.id,
    sku: variant.sku,
    size: variant.size ?? undefined,
    color: variant.color ?? undefined,
    optionLabel: variant.option_label ?? undefined,
    priceOverride: variant.price_override == null ? undefined : normalizeNumber(variant.price_override),
    compareAtPrice: variant.compare_at_price == null ? undefined : normalizeNumber(variant.compare_at_price),
    stock: variant.stock ?? 0,
    lowStockThreshold: variant.low_stock_threshold ?? 2,
    weightGrams: variant.weight_grams ?? undefined,
    isActive: variant.is_active
  }
}

function mapDbProduct(product: DbProduct): Product {
  const images = [...(product.product_images ?? [])]
    .sort((a, b) => Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)) || (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(mapImage)

  const variants = (product.product_variants ?? [])
    .filter((variant) => variant.is_active)
    .map(mapVariant)

  const variantColors = variants.map((variant) => variant.color).filter((value): value is string => Boolean(value))
  const availableStock = variants.length ? variants.reduce((sum, variant) => sum + variant.stock, 0) : (product.stock ?? 0)
  const primaryImage = images[0]?.url ?? product.image_url ?? '/images/products/alreem-camel.svg'

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
    stock: availableStock,
    rating: 5,
    reviewCount: 0,
    featured: product.is_featured,
    image: primaryImage,
    colors: [...new Set(variantColors)],
    sku: product.sku ?? undefined,
    trackInventory: product.track_inventory ?? true,
    allowBackorder: product.allow_backorder ?? false,
    lowStockThreshold: product.low_stock_threshold ?? 2,
    images,
    variants
  }
}

const catalogSelect = `
  *,
  categories(id, name, slug, description, is_active, sort_order),
  product_images(id, product_id, image_url, alt_text, is_primary, sort_order),
  product_variants(id, product_id, sku, size, color, option_label, price_override, compare_at_price, cost_price, stock, low_stock_threshold, weight_grams, is_active)
`

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return fallbackCategories

  try {
    const supabase = getSupabasePublic()
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .order('name')

    if (error) return []
    return (data ?? []).map(mapDbCategory)
  } catch {
    return []
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  if (!isSupabaseConfigured()) return getFallbackCategoryBySlug(slug)

  try {
    const supabase = getSupabasePublic()
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()

    if (error || !data) return undefined
    return mapDbCategory(data)
  } catch {
    return undefined
  }
}

export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return fallbackProducts

  try {
    const supabase = getSupabasePublic()
    const { data, error } = await supabase
      .from('products')
      .select(catalogSelect)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) return []
    return ((data ?? []) as unknown as DbProduct[]).map(mapDbProduct)
  } catch {
    return []
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

  try {
    const supabase = getSupabasePublic()
    const { data, error } = await supabase
      .from('products')
      .select(catalogSelect)
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()

    if (error || !data) return undefined
    return mapDbProduct(data as unknown as DbProduct)
  } catch {
    return undefined
  }
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
    .select(catalogSelect)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as DbProduct[]
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
    .select(catalogSelect)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as unknown as DbProduct | null
}

export { reviews, storeMeta, heroBanner }
