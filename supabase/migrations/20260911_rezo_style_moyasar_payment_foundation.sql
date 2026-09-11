-- REZO STYLE — Moyasar invoice payment request hardening

create unique index if not exists payment_requests_provider_reference_unique
  on public.payment_requests(provider_reference)
  where provider_reference is not null;

create index if not exists payment_requests_order_created_idx
  on public.payment_requests(order_id, created_at desc);

create index if not exists payment_requests_status_expiry_idx
  on public.payment_requests(status, expires_at)
  where status in ('pending','retry_required');
