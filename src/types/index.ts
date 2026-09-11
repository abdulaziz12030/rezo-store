export type Category = {
  id: string
  name: string
  slug: string
  description: string
}

export type ProductImage = {
  id: string
  url: string
  altText?: string
  isPrimary?: boolean
  sortOrder?: number
}

export type ProductVariant = {
  id: string
  sku: string
  size?: string
  color?: string
  optionLabel?: string
  priceOverride?: number
  compareAtPrice?: number
  stock: number
  lowStockThreshold?: number
  weightGrams?: number
  isActive: boolean
}

export type Product = {
  id: string
  name: string
  slug: string
  category: string
  categorySlug: string
  shortDescription: string
  description: string
  price: number
  compareAtPrice?: number
  stock: number
  rating: number
  reviewCount: number
  featured?: boolean
  hero?: boolean
  image: string
  colors: string[]
  sku?: string
  trackInventory?: boolean
  allowBackorder?: boolean
  lowStockThreshold?: number
  images?: ProductImage[]
  variants?: ProductVariant[]
}

export type Review = {
  id: string
  customer: string
  body: string
}

export type DbCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  is_active?: boolean
  sort_order?: number
  created_at?: string
  updated_at?: string
}

export type DbProductImage = {
  id: string
  product_id: string
  image_url: string
  alt_text?: string | null
  is_primary?: boolean | null
  sort_order?: number | null
  created_at?: string
  updated_at?: string
}

export type DbProductVariant = {
  id: string
  product_id: string
  sku: string
  size?: string | null
  color?: string | null
  option_label?: string | null
  price_override?: number | string | null
  compare_at_price?: number | string | null
  cost_price?: number | string | null
  stock: number
  low_stock_threshold?: number
  weight_grams?: number | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type DbProduct = {
  id: string
  name: string
  slug: string
  category_id: string
  short_description: string | null
  description: string | null
  price: number | string
  compare_at_price: number | string | null
  stock: number
  is_active: boolean
  is_featured: boolean
  image_url: string | null
  sku?: string | null
  seo_title?: string | null
  seo_description?: string | null
  low_stock_threshold?: number
  track_inventory?: boolean
  allow_backorder?: boolean
  created_at?: string
  updated_at?: string
  categories?: DbCategory | null
  product_images?: DbProductImage[] | null
  product_variants?: DbProductVariant[] | null
}
