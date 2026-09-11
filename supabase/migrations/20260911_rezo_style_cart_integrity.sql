-- REZO STYLE — cart integrity
-- PostgreSQL UNIQUE treats NULL values as distinct, so a product without a variant
-- could otherwise appear more than once in the same cart under concurrent requests.
create unique index if not exists cart_items_unique_product_variant
on public.cart_items (
  cart_id,
  product_id,
  coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid)
);
