-- REZO STYLE — security tightening and FK index coverage
-- Sensitive commerce/customer tables are server-only. Public/authenticated clients
-- may read only the active catalog through the policies from the foundation migration.

alter function public.rezo_style_set_updated_at() set search_path = pg_catalog, public;

-- Remove direct client access to all sensitive tables.
revoke all on public.inventory_movements from anon, authenticated;
revoke all on public.customers from anon, authenticated;
revoke all on public.customer_addresses from anon, authenticated;
revoke all on public.carts from anon, authenticated;
revoke all on public.cart_items from anon, authenticated;
revoke all on public.orders from anon, authenticated;
revoke all on public.order_items from anon, authenticated;
revoke all on public.payment_requests from anon, authenticated;
revoke all on public.financial_transactions from anon, authenticated;
revoke all on public.shipments from anon, authenticated;
revoke all on public.coupons from anon, authenticated;
revoke all on public.coupon_redemptions from anon, authenticated;
revoke all on public.loyalty_accounts from anon, authenticated;
revoke all on public.loyalty_transactions from anon, authenticated;
revoke all on public.visitor_sessions from anon, authenticated;
revoke all on public.visitor_events from anon, authenticated;
revoke all on public.admin_audit_logs from anon, authenticated;
revoke all on public.store_settings from anon, authenticated;

-- Catalog stays readable, but never directly writable from browser clients.
revoke insert, update, delete, truncate, references, trigger on public.categories from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public.products from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public.product_images from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public.product_variants from anon, authenticated;
grant select on public.categories, public.products, public.product_images, public.product_variants to anon, authenticated;

-- Direct indexes for foreign-key maintenance and common joins.
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists cart_items_product_id_idx on public.cart_items(product_id);
create index if not exists cart_items_variant_id_idx on public.cart_items(variant_id);
create index if not exists coupon_redemptions_order_id_idx on public.coupon_redemptions(order_id);
create index if not exists coupon_redemptions_customer_id_idx on public.coupon_redemptions(customer_id);
create index if not exists financial_transactions_customer_id_idx on public.financial_transactions(customer_id);
create index if not exists inventory_movements_product_id_idx on public.inventory_movements(product_id);
create index if not exists loyalty_transactions_order_id_idx on public.loyalty_transactions(order_id);
create index if not exists order_items_product_id_idx on public.order_items(product_id);
create index if not exists order_items_variant_id_idx on public.order_items(variant_id);
create index if not exists orders_cart_id_idx on public.orders(cart_id);
create index if not exists visitor_sessions_customer_id_idx on public.visitor_sessions(customer_id);
create index if not exists visitor_events_customer_id_idx on public.visitor_events(customer_id);
create index if not exists visitor_events_product_id_idx on public.visitor_events(product_id);
create index if not exists visitor_events_order_id_idx on public.visitor_events(order_id);
