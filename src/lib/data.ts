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

export const heroBanner = {
  title: 'REZO STYLE',
  subtitle: 'فخامة بلا تكلّف',
  description:
    'نسخة مبدئية قابلة للتطوير لمتجر ريزو مع بنر فيديو متحرك قريب من تجربة المتجر الأساسي، وصور منتجات محلية محفوظة داخل مجلد public.',
  posterImage: '/images/hero/rezo-hero.svg',
  videoUrl: 'https://cdn.imgchest.com/files/acdc9eb6faaf.mp4',
  videoLabel: 'فيديو العرض الرئيسي'
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
    hero: true,
    image: '/images/products/alreem-camel.svg',
    colors: ['جملي مطفي']
  },
  {
    id: 'p2',
    name: 'جلابية النور برتقالي برو وايت',
    slug: 'jlabiyat-alnoor-orange-pro-white',
    category: 'جلابيات النور',
    categorySlug: 'alnoor',
    shortDescription: 'إطلالة مشرقة بتفاصيل فاخرة تناسب جميع الأوقات.',
    description: 'فخامة لافتة، بحضور لا يُنسى، وتفاصيل تمنح القطعة طابعًا مميزًا ومريحًا في اللبس.',
    price: 230,
    compareAtPrice: 290,
    stock: 8,
    rating: 4.7,
    reviewCount: 11,
    featured: true,
    image: '/images/products/alnoor-orange.svg',
    colors: ['برتقالي', 'أبيض']
  },
  {
    id: 'p3',
    name: 'جلابية الأثير Silver Blush',
    slug: 'jlabiyat-alatheer-silver-blush',
    category: 'جلابيات الأثير',
    categorySlug: 'alatheer',
    shortDescription: 'فخامة رقيقة بلمسة فضية أنثوية.',
    description: 'جلابية أنيقة بتفاصيل ناعمة ولمعة هادئة تمنح حضورًا راقيًا ومتوازنًا.',
    price: 250,
    compareAtPrice: 300,
    stock: 12,
    rating: 4.9,
    reviewCount: 20,
    featured: true,
    image: '/images/products/alatheer-silver-blush.svg',
    colors: ['Silver Blush']
  },
  {
    id: 'p4',
    name: 'جلابية المدى أزرق ملكي',
    slug: 'jlabiyat-almada-royal-blue',
    category: 'جلابيات المدى',
    categorySlug: 'almada',
    shortDescription: 'تصميم ملكي يبرز الفخامة والبساطة.',
    description: 'توليفة مميزة بين الفخامة والراحة مع تفاصيل مطرزة بعناية ولمسة لونية راقية.',
    price: 240,
    compareAtPrice: 300,
    stock: 7,
    rating: 4.6,
    reviewCount: 9,
    featured: false,
    image: '/images/products/almada-blue.svg',
    colors: ['أزرق ملكي']
  },
  {
    id: 'p5',
    name: 'جلابية العروب خمري ذهبي',
    slug: 'jlabiyat-alaroob-maroon-gold',
    category: 'جلابيات العروب',
    categorySlug: 'alaroob',
    shortDescription: 'مزيج فاخر بين اللون الخمري والتفاصيل الذهبية.',
    description: 'تصميم بلمسة تراثية عصرية يبرز الفخامة السعودية بخيوط ذهبية متزنة.',
    price: 270,
    compareAtPrice: 330,
    stock: 5,
    rating: 4.9,
    reviewCount: 14,
    featured: true,
    image: '/images/products/alaroob-maroon-gold.svg',
    colors: ['خمري', 'ذهبي']
  },
  {
    id: 'p6',
    name: 'جلابية العروب أسود ياقوتي ذهبي',
    slug: 'jlabiyat-alaroob-black-ruby-gold',
    category: 'جلابيات العروب',
    categorySlug: 'alaroob',
    shortDescription: 'فخامة اللون الأسود مع لمسة ياقوتية ذهبية.',
    description: 'خيار أنيق للمناسبات بطابع ملكي وتفاصيل فاخرة ملفتة.',
    price: 280,
    compareAtPrice: 340,
    stock: 6,
    rating: 5,
    reviewCount: 18,
    featured: true,
    image: '/images/products/alaroob-black-ruby.svg',
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
