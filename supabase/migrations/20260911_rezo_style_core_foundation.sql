-- REZO STYLE — Core commerce foundation
-- Drafted for feature/rezo-style-core. Review before applying to Supabase.
-- Principle: public users may only read the active catalog. All writes and all sensitive
-- commerce/customer data remain server-side via service role / trusted backend functions.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.rezo_style_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Existing catalog hardening / enrichment
-- -----------------------------------------------------------------------------
alter table public.categories
  add column if not exists sort_order integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

alter table public.products
  add column if not exists sku text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists low_stock_threshold integer not null default 2,
  add column if not exists track_inventory boolean not null default true,
  add column if not exists allow_backorder boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

alter table public.product_images
  add column if not exists alt_text text,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists products_sku_unique
  on public.products (sku)
  where sku is not null;

create index if not exists categories_active_sort_idx
  on public.categories (is_active, sort_order, created_at);

create index if not exists products_catalog_idx
  on public.products (is_active, is_featured, category_id, created_at desc);

create index if not exists product_images_product_sort_idx
  on public.product_images (product_id, is_primary desc, sort_order);

-- -----------------------------------------------------------------------------
-- Product variants / stock ledger
-- -----------------------------------------------------------------------------
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  size text,
  color text,
  option_label text,
  price_override numeric(10,2),
  compare_at_price numeric(10,2),
  cost_price numeric(10,2),
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 2 check (low_stock_threshold >= 0),
  weight_grams integer check (weight_grams is null or weight_grams >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_variants_product_idx
  on public.product_variants (product_id, is_active);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  movement_type text not null check (movement_type in ('opening','sale','restock','return','adjustment','reservation','release')),
  quantity_delta integer not null,
  quantity_after integer,
  reference_type text,
  reference_id uuid,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists inventory_movements_variant_created_idx
  on public.inventory_movements (variant_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Customers / addresses
-- -----------------------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  customer_number text unique,
  full_name text not null,
  phone text not null,
  email text,
  marketing_opt_in boolean not null default false,
  notes text,
  first_order_at timestamptz,
  last_order_at timestamptz,
  lifetime_paid numeric(12,2) not null default 0,
  total_orders integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customers_phone_normalized_unique
  on public.customers ((regexp_replace(phone, '[^0-9]', '', 'g')));

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text,
  recipient_name text not null,
  phone text not null,
  city text not null,
  district text,
  street text,
  building_no text,
  postal_code text,
  additional_no text,
  national_address_short_code text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_addresses_customer_idx
  on public.customer_addresses (customer_id, is_default desc);

-- -----------------------------------------------------------------------------
-- Carts
-- -----------------------------------------------------------------------------
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  session_token text unique,
  status text not null default 'active' check (status in ('active','converted','abandoned','expired')),
  currency text not null default 'SAR',
  subtotal numeric(10,2) not null default 0,
  discount_total numeric(10,2) not null default 0,
  shipping_total numeric(10,2) not null default 0,
  grand_total numeric(10,2) not null default 0,
  coupon_code text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  line_total numeric(10,2) not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id, variant_id)
);

create index if not exists carts_customer_status_idx
  on public.carts (customer_id, status, updated_at desc);

create index if not exists cart_items_cart_idx
  on public.cart_items (cart_id);

-- -----------------------------------------------------------------------------
-- Orders / finance
-- -----------------------------------------------------------------------------
create sequence if not exists public.rezo_style_order_number_seq start 1;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default (
    'RS-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.rezo_style_order_number_seq')::text, 6, '0')
  ),
  customer_id uuid references public.customers(id) on delete set null,
  cart_id uuid references public.carts(id) on delete set null,
  status text not null default 'pending_payment' check (status in (
    'pending_payment','paid','processing','ready_to_ship','shipped','completed','cancelled','returned','partially_returned'
  )),
  payment_status text not null default 'unpaid' check (payment_status in (
    'unpaid','pending','paid','partially_refunded','refunded','failed','cancelled'
  )),
  fulfillment_status text not null default 'unfulfilled' check (fulfillment_status in (
    'unfulfilled','processing','ready','shipped','delivered','returned','cancelled'
  )),
  currency text not null default 'SAR',
  subtotal numeric(10,2) not null default 0,
  discount_total numeric(10,2) not null default 0,
  shipping_total numeric(10,2) not null default 0,
  tax_total numeric(10,2) not null default 0,
  grand_total numeric(10,2) not null default 0,
  paid_total numeric(10,2) not null default 0,
  refunded_total numeric(10,2) not null default 0,
  coupon_code text,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  shipping_address jsonb not null default '{}'::jsonb,
  customer_note text,
  admin_note text,
  placed_at timestamptz not null default now(),
  paid_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_customer_created_idx
  on public.orders (customer_id, created_at desc);
create index if not exists orders_status_created_idx
  on public.orders (status, created_at desc);
create index if not exists orders_payment_status_idx
  on public.orders (payment_status, created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  sku text,
  product_name text not null,
  variant_label text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  discount_total numeric(10,2) not null default 0,
  line_total numeric(10,2) not null check (line_total >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx
  on public.order_items (order_id);

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'moyasar',
  provider_reference text,
  payment_url text,
  amount numeric(10,2) not null check (amount > 0),
  currency text not null default 'SAR',
  status text not null default 'pending' check (status in ('pending','paid','failed','cancelled','expired','retry_required')),
  idempotency_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  paid_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payment_requests_one_pending_per_order
  on public.payment_requests (order_id, provider)
  where status = 'pending';

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  transaction_type text not null check (transaction_type in ('payment','refund','discount','shipping','tax','adjustment','loyalty_redemption')),
  payment_method text,
  amount numeric(12,2) not null,
  external_reference text,
  source text not null default 'system',
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists financial_transactions_order_created_idx
  on public.financial_transactions (order_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Shipping
-- -----------------------------------------------------------------------------
create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text,
  tracking_number text,
  tracking_url text,
  status text not null default 'pending' check (status in ('pending','ready','shipped','in_transit','delivered','returned','cancelled')),
  shipping_cost numeric(10,2) not null default 0,
  label_url text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shipments_order_idx
  on public.shipments (order_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Coupons
-- -----------------------------------------------------------------------------
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percent','fixed','free_shipping')),
  discount_value numeric(10,2) not null default 0,
  minimum_subtotal numeric(10,2),
  max_discount numeric(10,2),
  usage_limit integer,
  usage_count integer not null default 0,
  per_customer_limit integer,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  discount_amount numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (coupon_id, order_id)
);

-- -----------------------------------------------------------------------------
-- Loyalty
-- -----------------------------------------------------------------------------
create table if not exists public.loyalty_accounts (
  customer_id uuid primary key references public.customers(id) on delete cascade,
  points_balance integer not null default 0,
  lifetime_points_earned integer not null default 0,
  lifetime_points_redeemed integer not null default 0,
  tier text not null default 'member',
  updated_at timestamptz not null default now()
);

create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  transaction_type text not null check (transaction_type in ('earn','redeem','expire','adjustment','reversal')),
  points integer not null,
  monetary_basis numeric(10,2),
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists loyalty_transactions_customer_created_idx
  on public.loyalty_transactions (customer_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Analytics / audit
-- -----------------------------------------------------------------------------
create table if not exists public.visitor_sessions (
  id uuid primary key default gen_random_uuid(),
  session_key uuid not null unique,
  visitor_hash text not null,
  customer_id uuid references public.customers(id) on delete set null,
  landing_path text,
  referrer_host text,
  source text,
  device_type text,
  device_label text,
  browser_name text,
  os_name text,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists visitor_sessions_recent_idx
  on public.visitor_sessions (last_seen_at desc);

create table if not exists public.visitor_events (
  id bigserial primary key,
  session_id uuid not null references public.visitor_sessions(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  event_type text not null,
  event_name text,
  path text,
  product_id uuid references public.products(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists visitor_events_session_created_idx
  on public.visitor_events (session_id, created_at desc);
create index if not exists visitor_events_type_created_idx
  on public.visitor_events (event_type, created_at desc);

create table if not exists public.admin_audit_logs (
  id bigserial primary key,
  actor_user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_idx
  on public.admin_audit_logs (created_at desc);

create table if not exists public.store_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'categories','products','product_images','product_variants','customers','customer_addresses',
    'carts','cart_items','orders','payment_requests','shipments','coupons','loyalty_accounts','store_settings'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format(
      'create trigger trg_%I_updated_at before update on public.%I for each row execute function public.rezo_style_set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- RLS: public catalog only; commerce/customer/admin data is server-only.
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'categories','products','product_images','product_variants','inventory_movements','customers','customer_addresses',
    'carts','cart_items','orders','order_items','payment_requests','financial_transactions','shipments','coupons',
    'coupon_redemptions','loyalty_accounts','loyalty_transactions','visitor_sessions','visitor_events','admin_audit_logs','store_settings'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Remove broad client writes. Trusted backend/service role bypasses RLS.
revoke insert, update, delete on public.categories from anon, authenticated;
revoke insert, update, delete on public.products from anon, authenticated;
revoke insert, update, delete on public.product_images from anon, authenticated;
revoke insert, update, delete on public.product_variants from anon, authenticated;

-- Active catalog may be viewed publicly.
drop policy if exists "Public read active categories" on public.categories;
create policy "Public read active categories"
  on public.categories for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Public read active products" on public.products;
create policy "Public read active products"
  on public.products for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Public read active product images" on public.product_images;
create policy "Public read active product images"
  on public.product_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.is_active = true
    )
  );

drop policy if exists "Public read active variants" on public.product_variants;
create policy "Public read active variants"
  on public.product_variants for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.products p
      where p.id = product_variants.product_id and p.is_active = true
    )
  );

-- Sensitive tables intentionally have no anon/authenticated policies.
-- Client-facing operations must go through trusted Next.js server actions or Edge Functions.

-- Explicit catalog read grants.
grant select on public.categories, public.products, public.product_images, public.product_variants to anon, authenticated;

-- Keep sequences inaccessible to public clients.
revoke all on sequence public.rezo_style_order_number_seq from anon, authenticated;

-- End of foundation migration.
