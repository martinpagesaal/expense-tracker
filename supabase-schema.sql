-- Supabase schema for multi-tenant expense tracker

create extension if not exists "pgcrypto";

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  unique (tenant_id, category_id, name)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  subcategory_id uuid references public.subcategories(id) on delete restrict,
  amount_original numeric(14, 2) not null,
  currency_code text not null,
  fx_rate_to_usd numeric(18, 8) not null,
  amount_usd numeric(14, 2) not null,
  note text,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.fx_rates (
  id uuid primary key default gen_random_uuid(),
  quote_currency text not null,
  rate_to_usd numeric(18, 8) not null,
  fetched_at timestamptz not null default now(),
  unique (quote_currency)
);

alter table public.tenants enable row level security;
alter table public.tenant_users enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.expenses enable row level security;
alter table public.fx_rates enable row level security;

create or replace function public.is_tenant_member(tenant_id uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from public.tenant_users
    where tenant_users.tenant_id = is_tenant_member.tenant_id
      and tenant_users.user_id = auth.uid()
  );
$$;

create or replace function public.join_default_tenant()
returns uuid
language plpgsql
security definer
as $$
declare
  default_tenant_id uuid;
begin
  select id into default_tenant_id
  from public.tenants
  where is_default = true
  limit 1;

  if default_tenant_id is null then
    raise exception 'No existe tenant por defecto.';
  end if;

  insert into public.tenant_users (tenant_id, user_id)
  values (default_tenant_id, auth.uid())
  on conflict (tenant_id, user_id) do nothing;

  return default_tenant_id;
end;
$$;

grant execute on function public.join_default_tenant() to authenticated;

-- Tenants
drop policy if exists "Tenants are selectable for authenticated users" on public.tenants;
create policy "Tenants are selectable for authenticated users"
on public.tenants for select
to authenticated
using (true);

drop policy if exists "Tenants insert blocked from client" on public.tenants;
create policy "Tenants insert blocked from client"
on public.tenants for insert
to authenticated
with check (false);

-- Tenant users
drop policy if exists "Tenant users select for member" on public.tenant_users;
create policy "Tenant users select for member"
on public.tenant_users for select
to authenticated
using (public.is_tenant_member(tenant_id));

drop policy if exists "Tenant users self-join default tenant" on public.tenant_users;
create policy "Tenant users self-join default tenant"
on public.tenant_users for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.tenants
    where tenants.id = tenant_users.tenant_id
      and tenants.is_default = true
  )
);

-- Categories
drop policy if exists "Categories select for member" on public.categories;
create policy "Categories select for member"
on public.categories for select
to authenticated
using (public.is_tenant_member(tenant_id));

drop policy if exists "Categories insert for member" on public.categories;
create policy "Categories insert for member"
on public.categories for insert
to authenticated
with check (
  public.is_tenant_member(tenant_id)
  and created_by = auth.uid()
);

-- Subcategories
drop policy if exists "Subcategories select for member" on public.subcategories;
create policy "Subcategories select for member"
on public.subcategories for select
to authenticated
using (public.is_tenant_member(tenant_id));

drop policy if exists "Subcategories insert for member" on public.subcategories;
create policy "Subcategories insert for member"
on public.subcategories for insert
to authenticated
with check (
  public.is_tenant_member(tenant_id)
  and created_by = auth.uid()
);

-- Expenses
drop policy if exists "Expenses select for member" on public.expenses;
create policy "Expenses select for member"
on public.expenses for select
to authenticated
using (public.is_tenant_member(tenant_id));

drop policy if exists "Expenses insert for member" on public.expenses;
create policy "Expenses insert for member"
on public.expenses for insert
to authenticated
with check (
  public.is_tenant_member(tenant_id)
  and created_by = auth.uid()
);

-- FX rates
drop policy if exists "FX rates select for authenticated" on public.fx_rates;
create policy "FX rates select for authenticated"
on public.fx_rates for select
to authenticated
using (true);

drop policy if exists "FX rates insert for authenticated" on public.fx_rates;
create policy "FX rates insert for authenticated"
on public.fx_rates for insert
to authenticated
with check (true);

drop policy if exists "FX rates update for authenticated" on public.fx_rates;
create policy "FX rates update for authenticated"
on public.fx_rates for update
to authenticated
using (true)
with check (true);

-- Seed default tenant and categories
insert into public.tenants (id, name, is_default)
values ('00000000-0000-0000-0000-000000000001', 'Hogar', true)
on conflict (id) do nothing;

insert into public.categories (tenant_id, name, created_by)
values
  ('00000000-0000-0000-0000-000000000001', 'Supermercado', null),
  ('00000000-0000-0000-0000-000000000001', 'Gastos del hogar', null),
  ('00000000-0000-0000-0000-000000000001', 'Otros', null)
on conflict do nothing;

insert into public.subcategories (tenant_id, category_id, name, created_by)
select
  categories.tenant_id,
  categories.id,
  subcategory_name,
  null
from (
  values
    ('Supermercado', 'Bebidas'),
    ('Supermercado', 'Despensa'),
    ('Gastos del hogar', 'Servicios'),
    ('Gastos del hogar', 'Familia'),
    ('Otros', 'Otros')
) as defaults(category_name, subcategory_name)
join public.categories
  on categories.name = defaults.category_name
  and categories.tenant_id = '00000000-0000-0000-0000-000000000001'
on conflict do nothing;
