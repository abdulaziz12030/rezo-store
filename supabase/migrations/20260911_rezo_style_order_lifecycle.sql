-- REZO STYLE — Safe order lifecycle primitives

alter table public.orders
  add column if not exists reservation_released_at timestamptz;

create unique index if not exists financial_transactions_external_reference_unique
  on public.financial_transactions(external_reference)
  where external_reference is not null;

create or replace function public.rezo_style_cancel_unpaid_order(
  p_order_id uuid,
  p_reason text default null
)
returns public.orders
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_product public.products%rowtype;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then raise exception 'order_not_found'; end if;
  if v_order.payment_status in ('paid','partially_refunded','refunded') then
    raise exception 'paid_order_requires_refund';
  end if;

  if v_order.reservation_released_at is null then
    for v_item in select * from public.order_items where order_id = p_order_id loop
      select * into v_product from public.products where id = v_item.product_id;

      if v_item.variant_id is not null then
        update public.product_variants
          set stock = stock + v_item.quantity
        where id = v_item.variant_id;

        insert into public.inventory_movements(
          product_id, variant_id, movement_type, quantity_delta, quantity_after,
          reference_type, reference_id, note
        )
        select v_item.product_id, v_item.variant_id, 'release', v_item.quantity, stock,
               'order', p_order_id, coalesce(p_reason,'Order cancelled')
        from public.product_variants where id = v_item.variant_id;
      else
        update public.products
          set stock = stock + v_item.quantity
        where id = v_item.product_id;

        insert into public.inventory_movements(
          product_id, movement_type, quantity_delta, quantity_after,
          reference_type, reference_id, note
        )
        select v_item.product_id, 'release', v_item.quantity, stock,
               'order', p_order_id, coalesce(p_reason,'Order cancelled')
        from public.products where id = v_item.product_id;
      end if;
    end loop;

    update public.products p
    set stock = x.total_stock
    from (
      select pv.product_id, sum(pv.stock)::integer as total_stock
      from public.product_variants pv
      where pv.is_active
        and pv.product_id in (select distinct oi.product_id from public.order_items oi where oi.order_id = p_order_id)
      group by pv.product_id
    ) x
    where p.id = x.product_id;
  end if;

  update public.orders
  set status = 'cancelled',
      payment_status = 'cancelled',
      fulfillment_status = 'cancelled',
      cancelled_at = coalesce(cancelled_at, now()),
      reservation_released_at = coalesce(reservation_released_at, now()),
      admin_note = concat_ws(E'\n', nullif(admin_note,''), nullif(trim(coalesce(p_reason,'')),''))
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

create or replace function public.rezo_style_mark_order_paid(
  p_order_id uuid,
  p_external_reference text,
  p_payment_method text,
  p_amount numeric
)
returns public.orders
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order public.orders%rowtype;
  v_existing uuid;
begin
  if coalesce(trim(p_external_reference),'') = '' then raise exception 'external_reference_required'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid_payment_amount'; end if;

  select id into v_existing
  from public.financial_transactions
  where external_reference = p_external_reference
  limit 1;

  if v_existing is not null then
    select * into v_order from public.orders where id = p_order_id;
    if not found then raise exception 'order_not_found'; end if;
    return v_order;
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then raise exception 'order_not_found'; end if;
  if v_order.status = 'cancelled' then raise exception 'order_cancelled'; end if;
  if abs(p_amount - v_order.grand_total) > 0.01 then raise exception 'payment_amount_mismatch'; end if;

  insert into public.financial_transactions(
    order_id, customer_id, transaction_type, payment_method, amount,
    external_reference, source, note
  ) values (
    v_order.id, v_order.customer_id, 'payment', nullif(trim(coalesce(p_payment_method,'')),''), p_amount,
    trim(p_external_reference), 'payment_provider', 'Verified payment'
  );

  update public.orders
  set payment_status = 'paid',
      status = case when status = 'pending_payment' then 'paid' else status end,
      paid_total = p_amount,
      paid_at = coalesce(paid_at, now())
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.rezo_style_cancel_unpaid_order(uuid,text) from public, anon, authenticated;
revoke all on function public.rezo_style_mark_order_paid(uuid,text,text,numeric) from public, anon, authenticated;
grant execute on function public.rezo_style_cancel_unpaid_order(uuid,text) to service_role;
grant execute on function public.rezo_style_mark_order_paid(uuid,text,text,numeric) to service_role;
