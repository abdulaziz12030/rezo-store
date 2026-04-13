create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  price numeric(10,2) not null default 0,
  compare_at_price numeric(10,2),
  stock integer not null default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_categories_slug on public.categories(slug);

alter table public.categories enable row level security;
alter table public.products enable row level security;

-- للتجربة الأولية يمكن فتح القراءة العامة، أما الكتابة فهي تتم عبر service role من السيرفر.
do $$ begin
  create policy "Public can read categories"
  on public.categories for select
  using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public can read products"
  on public.products for select
  using (true);
exception when duplicate_object then null; end $$;
