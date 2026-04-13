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
