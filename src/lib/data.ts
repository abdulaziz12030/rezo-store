import { Category, Product, Review } from '@/types'

export const storeMeta = {
  name: 'REZO STYLE',
  tagline: 'فخامة بلا تكلّف',
  description:
    'متجر متخصص في الجلابيات النسائية بتصاميم عصرية وفخامة هادئة، نهتم بجودة الخامات والتفاصيل لنقدّم إطلالة أنيقة تناسب المرأة العصرية.',
  whatsapp: '966500000000',
  instagram: 'https://www.instagram.com/',
  tiktok: 'https://www.tiktok.com/'
}

export const categories: Category[] = [
  {
    id: '1',
    name: 'جلابيات الريم',
    slug: 'alreem',
    description: 'تصاميم ناعمة بلمسة أنثوية فاخرة.'
  },
  {
    id: '2',
    name: 'جلابيات النور',
    slug: 'alnoor',
    description: 'فخامة لافتة بتفاصيل راقية وحضور لا يُنسى.'
  },
  {
    id: '3',
    name: 'جلابيات المدى',
    slug: 'almada',
    description: 'قطع ملكية بإحساس ناعم وانسيابية عصرية.'
  },
  {
    id: '4',
    name: 'جلابيات الأثير',
    slug: 'alatheer',
    description: 'تفاصيل لامعة وأناقة هادئة تلائم المناسبات.'
  },
  {
    id: '5',
    name: 'جلابيات العروب',
    slug: 'alaroob',
    description: 'طابع سعودي فاخر بلمسات جريئة ومتزنة.'
  }
]

export const products: Product[] = [
  {
    id: 'p1',
    name: 'جلابية النور أحمر ناري Pro White',
    slug: 'jlabiyat-alnoor-red-pro-white',
    category: 'جلابيات النور',
    categorySlug: 'alnoor',
    shortDescription: 'فخامة لافتة، بحضور لا يُنسى.',
    description:
      'تصميم أنيق بقماش ناعم وانسيابية راقية يمنحك حضورًا هادئًا ولمسة فخامة تبرز ذوقك في كل إطلالة، مع تطريز خلفي مميز وتفاصيل أكمام أنيقة تضيف لمسة فخامة.',
    price: 220,
    compareAtPrice: 320,
    stock: 8,
    rating: 4.9,
    reviewCount: 22,
    featured: true,
    hero: true,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
    colors: ['أحمر ناري', 'أبيض']
  },
  {
    id: 'p2',
    name: 'جلابية الريم جملي مطفي قصة مثلث',
    slug: 'jlabiyat-alreem-camel-matte',
    category: 'جلابيات الريم',
    categorySlug: 'alreem',
    shortDescription: 'فريدة بتصميمها بكميات محدودة.',
    description: 'قصة مثلث فاخرة وانسياب راقٍ يناسب الإطلالات اليومية والمناسبات الهادئة.',
    price: 260,
    compareAtPrice: 320,
    stock: 11,
    rating: 4.8,
    reviewCount: 16,
    featured: true,
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80',
    colors: ['جملي مطفي']
  },
  {
    id: 'p3',
    name: 'جلابية المدى الملكية',
    slug: 'jlabiyat-almada-royal',
    category: 'جلابيات المدى',
    categorySlug: 'almada',
    shortDescription: 'لمسات ساحرة وأناقة ملكية.',
    description: 'توليفة مميزة بين الفخامة والراحة مع تفاصيل مطرزة بعناية.',
    price: 290,
    compareAtPrice: 350,
    stock: 5,
    rating: 4.7,
    reviewCount: 13,
    featured: true,
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80',
    colors: ['كحلي', 'ذهبي']
  },
  {
    id: 'p4',
    name: 'جلابية الأثير Silver Blush',
    slug: 'jlabiyat-alatheer-silver-blush',
    category: 'جلابيات الأثير',
    categorySlug: 'alatheer',
    shortDescription: 'فخامة رقيقة بلمسة فضية أنثوية.',
    description: 'جلابية أنيقة بتفاصيل ناعمة ولمعة هادئة تمنح حضورًا راقيًا ومتوازنًا.',
    price: 280,
    compareAtPrice: 340,
    stock: 7,
    rating: 4.9,
    reviewCount: 19,
    featured: true,
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
    colors: ['Silver Blush']
  },
  {
    id: 'p5',
    name: 'جلابية العروب خمري ذهبي',
    slug: 'jlabiyat-alaroob-maroon-gold',
    category: 'جلابيات العروب',
    categorySlug: 'alaroob',
    shortDescription: 'حضور فاخر بلون عميق ولمسات ذهبية.',
    description: 'تصميم بلمسة تراثية عصرية يبرز الفخامة السعودية بخيوط ذهبية متزنة.',
    price: 310,
    compareAtPrice: 370,
    stock: 4,
    rating: 5,
    reviewCount: 12,
    featured: true,
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
    colors: ['خمري', 'ذهبي']
  },
  {
    id: 'p6',
    name: 'جلابية العروب أسود ياقوتي ذهبي',
    slug: 'jlabiyat-alaroob-black-ruby-gold',
    category: 'جلابيات العروب',
    categorySlug: 'alaroob',
    shortDescription: 'قوة وأناقة بلمسة ياقوتية.',
    description: 'خيار أنيق للمناسبات بطابع ملكي وتفاصيل فاخرة ملفتة.',
    price: 320,
    compareAtPrice: 390,
    stock: 3,
    rating: 4.9,
    reviewCount: 9,
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80',
    colors: ['أسود', 'ياقوتي', 'ذهبي']
  }
]

export const reviews: Review[] = [
  {
    id: 'r1',
    customer: 'مدى الفقيه',
    body: 'الجلابية جميلة جدًا، البكجنق والهدية داخل البوكس كانا رائعين وجودة القماش والخياطة واضحة جدًا.'
  },
  {
    id: 'r2',
    customer: 'نوره',
    body: 'يعطيكم العافية على الجلابية الجميلة، اللون والخامة والتطريز كلها كانت أجمل من المتوقع.'
  }
]

export function getFeaturedProducts() {
  return products.filter((product) => product.featured)
}

export function getHeroProduct() {
  return products.find((product) => product.hero) ?? products[0]
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug)
}
