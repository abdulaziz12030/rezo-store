export type Category = {
  id: string
  name: string
  slug: string
  description: string
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
  created_at?: string
}

export type DbProduct = {
  id: string
  name: string
  slug: string
  category_id: string
  short_description: string | null
  description: string | null
  price: number
  compare_at_price: number | null
  stock: number
  is_active: boolean
  is_featured: boolean
  image_url: string | null
  created_at?: string
  categories?: DbCategory | null
}
