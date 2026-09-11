-- REZO STYLE — Enforce shipping pricing inside atomic checkout.
-- Shipping remains disabled until explicitly configured in store_settings.

alter table public.orders
  add column if not exists shipping_method text,
  add column if not exists shipping_provider text not null default 'manual';

create or replace function public.rezo_style_create_order_from_cart(
  p_cart_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text default null,
  p_shipping_address jsonb default '{}'::jsonb,
  p_customer_note text default null
)
returns table(order_id uuid, order_number text, access_token uuid, grand_total numeric)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_cart public.carts%rowtype;
  v_item record;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_order public.orders%rowtype;
  v_unit_price numeric(10,2);
  v_subtotal numeric(10,2) := 0;
  v_line_total numeric(10,2);
  v_item_count integer := 0;
  v_shipping jsonb;
  v_shipping_enabled boolean := false;
  v_shipping_method text := 'الشحن القياسي';
  v_shipping_provider text := 'manual';
  v_shipping_flat_rate numeric(10,2) := 0;
  v_free_shipping_threshold numeric(10,2);
  v_shipping_total numeric(10,2) := 0;
begin
  if coalesce(trim(p_customer_name),'') = '' or coalesce(trim(p_customer_phone),'') = '' then
    raise exception 'customer_details_required';
  end if;

  select ss.value into v_shipping
  from public.store_settings ss
  where ss.key = 'shipping';

  if v_shipping is null then
    raise exception 'shipping_not_configured';
  end if;

  v_shipping_enabled := coalesce((v_shipping ->> 'enabled')::boolean, false);
  if not v_shipping_enabled then
    raise exception 'shipping_not_configured';
  end if;

  v_shipping_method := coalesce(nullif(trim(v_shipping ->> 'method_name'), ''), 'الشحن القياسي');
  v_shipping_provider := coalesce(nullif(trim(v_shipping ->> 'provider'), ''), 'manual');

  -- Until a live carrier quote flow is enabled, checkout only accepts the
  -- explicitly configured manual/fixed policy. This prevents accidental
  -- charging with an unverified carrier rate.
  if v_shipping_provider <> 'manual' then
    raise exception 'shipping_provider_not_ready';
  end if;

  v_shipping_flat_rate := greatest(0, coalesce(nullif(v_shipping ->> 'flat_rate', '')::numeric, 0));
  v_free_shipping_threshold := nullif(v_shipping ->> 'free_shipping_threshold', '')::numeric;

  select * into v_cart
  from public.carts
  where id = p_cart_id
  for update;

  if not found or v_cart.status <> 'active' then
    raise exception 'cart_not_active';
  end if;

  if exists(select 1 from public.orders o where o.cart_id = p_cart_id) then
    raise exception 'cart_already_converted';
  end if;

  for v_item in
    select ci.*
    from public.cart_items ci
    where ci.cart_id = p_cart_id
    order by ci.created_at, ci.id
    for update
  loop
    v_item_count := v_item_count + 1;

    select * into v_product
    from public.products
    where id = v_item.product_id
    for update;

    if not found or not v_product.is_active then
      raise exception 'product_unavailable';
    end if;

    if v_item.variant_id is not null then
      select * into v_variant
      from public.product_variants
      where id = v_item.variant_id and product_id = v_product.id
      for update;

      if not found or not v_variant.is_active then
        raise exception 'variant_unavailable';
      end if;

      if v_product.track_inventory and not v_product.allow_backorder and v_variant.stock < v_item.quantity then
        raise exception 'insufficient_stock';
      end if;

      v_unit_price := coalesce(v_variant.price_override, v_product.price);
    else
      if exists(select 1 from public.product_variants pv where pv.product_id = v_product.id and pv.is_active) then
        raise exception 'variant_required';
      end if;

      if v_product.track_inventory and not v_product.allow_backorder and v_product.stock < v_item.quantity then
        raise exception 'insufficient_stock';
      end if;

      v_unit_price := v_product.price;
    end if;

    v_line_total := round(v_unit_price * v_item.quantity, 2);
    v_subtotal := v_subtotal + v_line_total;

    update public.cart_items
      set unit_price = v_unit_price,
          line_total = v_line_total,
          updated_at = now()
    where id = v_item.id;
  end loop;

  if v_item_count = 0 then
    raise exception 'cart_empty';
  end if;

  if v_free_shipping_threshold is not null and v_subtotal >= v_free_shipping_threshold then
    v_shipping_total := 0;
  else
    v_shipping_total := v_shipping_flat_rate;
  end if;

  update public.carts
    set subtotal = v_subtotal,
        shipping_total = v_shipping_total,
        grand_total = greatest(0, v_subtotal - discount_total + v_shipping_total),
        updated_at = now()
  where id = p_cart_id
  returning * into v_cart;

  insert into public.orders(
    cart_id, status, payment_status, fulfillment_status, currency,
    subtotal, discount_total, shipping_total, grand_total,
    shipping_method, shipping_provider,
    customer_name, customer_phone, customer_email, shipping_address, customer_note
  ) values (
    p_cart_id, 'pending_payment', 'unpaid', 'unfulfilled', v_cart.currency,
    v_cart.subtotal, v_cart.discount_total, v_cart.shipping_total, v_cart.grand_total,
    v_shipping_method, v_shipping_provider,
    trim(p_customer_name), trim(p_customer_phone), nullif(trim(coalesce(p_customer_email,'')),''),
    coalesce(p_shipping_address,'{}'::jsonb), nullif(trim(coalesce(p_customer_note,'')),'')
  ) returning * into v_order;

  for v_item in
    select ci.*
    from public.cart_items ci
    where ci.cart_id = p_cart_id
    order by ci.created_at, ci.id
  loop
    select * into v_product from public.products where id = v_item.product_id;

    if v_item.variant_id is not null then
      select * into v_variant from public.product_variants where id = v_item.variant_id;

      insert into public.order_items(
        order_id, product_id, variant_id, sku, product_name, variant_label,
        quantity, unit_price, line_total, metadata
      ) values (
        v_order.id, v_product.id, v_variant.id, v_variant.sku, v_product.name,
        concat_ws(' · ', nullif(v_variant.size,''), nullif(v_variant.color,''), nullif(v_variant.option_label,'')),
        v_item.quantity, v_item.unit_price, v_item.line_total,
        jsonb_build_object('product_slug', v_product.slug)
      );

      if v_product.track_inventory then
        update public.product_variants
          set stock = greatest(0, stock - v_item.quantity)
        where id = v_variant.id;

        insert into public.inventory_movements(
          product_id, variant_id, movement_type, quantity_delta, quantity_after,
          reference_type, reference_id, note
        )
        select v_product.id, v_variant.id, 'reservation', -v_item.quantity, stock,
               'order', v_order.id, 'Reserved at checkout'
        from public.product_variants where id = v_variant.id;
      end if;
    else
      insert into public.order_items(
        order_id, product_id, sku, product_name, quantity, unit_price, line_total, metadata
      ) values (
        v_order.id, v_product.id, v_product.sku, v_product.name,
        v_item.quantity, v_item.unit_price, v_item.line_total,
        jsonb_build_object('product_slug', v_product.slug)
      );

      if v_product.track_inventory then
        update public.products
          set stock = greatest(0, stock - v_item.quantity)
        where id = v_product.id;

        insert into public.inventory_movements(
          product_id, movement_type, quantity_delta, quantity_after,
          reference_type, reference_id, note
        )
        select v_product.id, 'reservation', -v_item.quantity, stock,
               'order', v_order.id, 'Reserved at checkout'
        from public.products where id = v_product.id;
      end if;
    end if;
  end loop;

  update public.products p
  set stock = x.total_stock
  from (
    select pv.product_id, sum(pv.stock)::integer as total_stock
    from public.product_variants pv
    where pv.is_active
      and pv.product_id in (select distinct ci.product_id from public.cart_items ci where ci.cart_id = p_cart_id)
    group by pv.product_id
  ) x
  where p.id = x.product_id;

  update public.carts set status = 'converted', updated_at = now() where id = p_cart_id;

  return query select v_order.id, v_order.order_number, v_order.access_token, v_order.grand_total;
end;
$$;

revoke all on function public.rezo_style_create_order_from_cart(uuid,text,text,text,jsonb,text) from public, anon, authenticated;
grant execute on function public.rezo_style_create_order_from_cart(uuid,text,text,text,jsonb,text) to service_role;
