-- REZO STYLE — Enforce shipping pricing inside the same database transaction
-- used to create an order. Shipping remains disabled until explicitly configured.

alter table public.orders
  add column if not exists shipping_method text,
  add column if not exists shipping_provider text not null default 'manual';

create or replace function public.rezo_style_enforce_order_shipping()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_shipping jsonb;
  v_enabled boolean := false;
  v_method text := 'الشحن القياسي';
  v_provider text := 'manual';
  v_flat_rate numeric(10,2) := 0;
  v_free_threshold numeric(10,2);
  v_shipping_total numeric(10,2) := 0;
begin
  select ss.value into v_shipping
  from public.store_settings ss
  where ss.key = 'shipping';

  if v_shipping is null then
    raise exception 'shipping_not_configured';
  end if;

  v_enabled := coalesce((v_shipping ->> 'enabled')::boolean, false);
  if not v_enabled then
    raise exception 'shipping_not_configured';
  end if;

  v_method := coalesce(nullif(trim(v_shipping ->> 'method_name'), ''), 'الشحن القياسي');
  v_provider := coalesce(nullif(trim(v_shipping ->> 'provider'), ''), 'manual');

  -- Carrier integrations such as Aramex must provide a verified live quote
  -- before they are allowed to replace the manual policy.
  if v_provider <> 'manual' then
    raise exception 'shipping_provider_not_ready';
  end if;

  v_flat_rate := greatest(0, coalesce(nullif(v_shipping ->> 'flat_rate', '')::numeric, 0));
  v_free_threshold := nullif(v_shipping ->> 'free_shipping_threshold', '')::numeric;

  if v_free_threshold is not null and new.subtotal >= v_free_threshold then
    v_shipping_total := 0;
  else
    v_shipping_total := v_flat_rate;
  end if;

  new.shipping_total := v_shipping_total;
  new.shipping_method := v_method;
  new.shipping_provider := v_provider;
  new.grand_total := greatest(
    0,
    coalesce(new.subtotal, 0)
      - coalesce(new.discount_total, 0)
      + v_shipping_total
      + coalesce(new.tax_total, 0)
  );

  if new.cart_id is not null then
    update public.carts
    set shipping_total = v_shipping_total,
        grand_total = new.grand_total,
        updated_at = now()
    where id = new.cart_id;
  end if;

  return new;
end;
$$;

drop trigger if exists rezo_style_enforce_order_shipping_trigger on public.orders;
create trigger rezo_style_enforce_order_shipping_trigger
before insert on public.orders
for each row
execute function public.rezo_style_enforce_order_shipping();
