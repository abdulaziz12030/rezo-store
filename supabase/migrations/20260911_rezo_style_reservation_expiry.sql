-- REZO STYLE — inventory reservation expiry and automatic release

alter table public.orders
  add column if not exists reservation_expires_at timestamptz not null default (now() + interval '30 minutes');

create index if not exists orders_pending_reservation_expiry_idx
  on public.orders (reservation_expires_at)
  where status = 'pending_payment'
    and payment_status in ('unpaid','pending')
    and reservation_released_at is null;

create or replace function public.rezo_style_release_expired_reservations(p_limit integer default 100)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order record;
  v_released integer := 0;
begin
  for v_order in
    select id
    from public.orders
    where status = 'pending_payment'
      and payment_status in ('unpaid','pending')
      and reservation_released_at is null
      and reservation_expires_at <= now()
    order by reservation_expires_at
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 100), 500))
  loop
    perform public.rezo_style_cancel_unpaid_order(v_order.id, 'انتهاء مهلة الدفع');
    v_released := v_released + 1;
  end loop;

  return v_released;
end;
$$;

revoke all on function public.rezo_style_release_expired_reservations(integer) from public, anon, authenticated;
grant execute on function public.rezo_style_release_expired_reservations(integer) to service_role;

-- Supabase Cron / pg_cron: release abandoned reservations every 5 minutes.
create extension if not exists pg_cron;

do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id
  from cron.job
  where jobname = 'rezo-style-release-expired-reservations'
  limit 1;

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;
end $$;

select cron.schedule(
  'rezo-style-release-expired-reservations',
  '*/5 * * * *',
  'select public.rezo_style_release_expired_reservations(100);'
);
