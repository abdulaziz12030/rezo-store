-- REZO STYLE — Admin authorization foundation
-- Supabase Auth proves identity; this table grants admin roles.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'admin' check (role in ('owner','admin','manager')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- No browser role gets direct table privileges. Authorization is checked server-side
-- after Supabase Auth validates the user session.
revoke all on public.admin_users from anon, authenticated;

create index if not exists admin_users_active_idx
  on public.admin_users (is_active, role);

drop trigger if exists trg_admin_users_updated_at on public.admin_users;
create trigger trg_admin_users_updated_at
  before update on public.admin_users
  for each row execute function public.rezo_style_set_updated_at();
