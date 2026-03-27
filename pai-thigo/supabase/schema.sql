create extension if not exists "pgcrypto";

create table if not exists public.staff_directory (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('waiter', 'manager', 'owner')),
  login text,
  phone text,
  address text,
  birth_date date,
  education_level text,
  rg text,
  cpf text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.staff_directory
add column if not exists login text;

alter table public.staff_directory
add column if not exists phone text;

alter table public.staff_directory
add column if not exists address text;

alter table public.staff_directory
add column if not exists birth_date date;

alter table public.staff_directory
add column if not exists education_level text;

alter table public.staff_directory
add column if not exists rg text;

alter table public.staff_directory
add column if not exists cpf text;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'waiter', 'manager', 'owner')),
  loyalty_points integer not null default 0,
  preferred_room text not null default 'Salao principal',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  area text not null,
  capacity integer not null check (capacity >= 1 and capacity <= 20),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  highlight_color text default 'gold',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  name text not null,
  description text not null,
  image_url text,
  price numeric(10, 2) not null check (price >= 0),
  prep_time text,
  spice_level text,
  tags text[] not null default '{}',
  allergens text[] not null default '{}',
  is_signature boolean not null default false,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (category_id, name)
);

alter table public.menu_items
add column if not exists allergens text[] not null default '{}';

alter table public.menu_items
add column if not exists image_url text;

alter table public.menu_items
add column if not exists stock_quantity integer;

alter table public.menu_items
add column if not exists low_stock_threshold integer not null default 0;

alter table public.menu_items
add column if not exists portion_prices jsonb not null default '{}'::jsonb;

create table if not exists public.restaurant_settings (
  id text primary key default 'main',
  restaurant_name text not null default 'Pai Thiago',
  tagline text not null default 'Brasa brasileira, servico refinado e atmosfera memoravel.',
  description text not null default 'O Pai Thiago e uma casa de cozinha brasileira contemporanea com foco em hospitalidade, ingredientes selecionados e uma experiencia elegante do almoco ao jantar.',
  address text not null default 'Rua das Palmeiras, 185',
  city text not null default 'Bela Vista, Sao Paulo - SP',
  phone text not null default '(11) 3456-7890',
  whatsapp text not null default '(11) 98765-4321',
  email text not null default 'reservas@paithiago.com.br',
  map_url text,
  google_business_url text,
  instagram_url text,
  facebook_url text,
  instagram_handle text,
  facebook_handle text,
  schedule_lines text[] not null default '{}',
  holiday_policy text not null default '',
  service_notes text[] not null default '{}',
  delivery_minimum_order numeric(10, 2) not null default 45 check (delivery_minimum_order >= 0),
  pickup_eta_minutes integer not null default 20 check (pickup_eta_minutes >= 0),
  delivery_hotline text not null default '(11) 98765-4321',
  delivery_coverage_note text not null default 'Entregas disponiveis em bairros proximos com taxa calculada no checkout.',
  waiter_commission_rate numeric(5, 2) not null default 10 check (waiter_commission_rate >= 0 and waiter_commission_rate <= 100),
  about_story text,
  about_mission text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.restaurant_settings
add column if not exists waiter_commission_rate numeric(5, 2) not null default 10;

create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  fee numeric(10, 2) not null default 0 check (fee >= 0),
  eta_minutes integer not null default 30 check (eta_minutes >= 0),
  service_window text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(user_id) on delete set null,
  assigned_table_id uuid references public.restaurant_tables(id) on delete set null,
  guest_name text not null,
  email text,
  phone text not null,
  reservation_date date not null,
  reservation_time time not null,
  guests integer not null check (guests >= 1 and guests <= 20),
  area_preference text,
  occasion text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'seated', 'completed', 'cancelled')),
  source text not null default 'website' check (source in ('website', 'customer', 'staff', 'phone', 'whatsapp')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  guest_name text not null,
  guest_email text,
  checkout_reference text,
  item_name text not null,
  quantity integer not null check (quantity >= 1 and quantity <= 20),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  total_price numeric(10, 2) not null check (total_price >= 0),
  notes text,
  fulfillment_type text not null default 'pickup' check (fulfillment_type in ('delivery', 'pickup')),
  delivery_neighborhood text,
  delivery_address text,
  delivery_reference text,
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  delivery_eta_minutes integer check (delivery_eta_minutes >= 0),
  payment_method text not null default 'pix' check (payment_method in ('pix', 'credit_card', 'debit_card', 'cash')),
  status text not null default 'received' check (status in ('received', 'preparing', 'ready', 'dispatching', 'delivered', 'cancelled')),
  source text not null default 'website' check (source in ('website', 'customer', 'staff')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.service_checks (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.restaurant_tables(id) on delete restrict,
  opened_by_user_id uuid not null references public.profiles(user_id) on delete restrict,
  closed_by_user_id uuid references public.profiles(user_id) on delete set null,
  cancelled_by_user_id uuid references public.profiles(user_id) on delete set null,
  guest_name text,
  notes text,
  status text not null default 'open' check (status in ('open', 'closed', 'cancelled')),
  payment_method text check (payment_method in ('pix', 'credit_card', 'debit_card', 'cash')),
  subtotal numeric(10, 2) not null default 0 check (subtotal >= 0),
  total numeric(10, 2) not null default 0 check (total >= 0),
  commission_rate numeric(5, 2) not null default 0 check (commission_rate >= 0 and commission_rate <= 100),
  commission_amount numeric(10, 2) not null default 0 check (commission_amount >= 0),
  report_reference text not null unique,
  opened_at timestamptz not null default timezone('utc', now()),
  closed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists service_checks_one_open_per_table_idx
on public.service_checks (table_id)
where status = 'open';

create table if not exists public.service_check_items (
  id uuid primary key default gen_random_uuid(),
  check_id uuid not null references public.service_checks(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  created_by_user_id uuid not null references public.profiles(user_id) on delete restrict,
  item_name text not null,
  quantity integer not null check (quantity >= 1 and quantity <= 50),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  total_price numeric(10, 2) not null check (total_price >= 0),
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.staff_shifts (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff_directory(id) on delete cascade,
  created_by_user_id uuid not null references public.profiles(user_id) on delete restrict,
  role text not null check (role in ('waiter', 'manager')),
  shift_date date not null,
  shift_label text not null default 'turno',
  starts_at time not null,
  ends_at time not null,
  status text not null default 'planned' check (status in ('planned', 'confirmed', 'completed', 'absent')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (staff_id, shift_date, shift_label)
);

create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_by_user_id uuid not null references public.profiles(user_id) on delete restrict,
  title text not null,
  description text,
  channel text not null default 'site' check (channel in ('site', 'whatsapp', 'instagram', 'email', 'interno')),
  starts_on date not null,
  ends_on date not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'finished')),
  target_audience text,
  highlight_offer text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketing_coupons (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  created_by_user_id uuid not null references public.profiles(user_id) on delete restrict,
  code text not null unique,
  coupon_type text not null check (coupon_type in ('percentage', 'fixed_amount')),
  amount numeric(10, 2) not null check (amount > 0),
  min_order numeric(10, 2) not null default 0 check (min_order >= 0),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  usage_count integer not null default 0 check (usage_count >= 0),
  is_active boolean not null default true,
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.operation_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(user_id) on delete set null,
  actor_name text,
  actor_role text,
  event_type text not null,
  entity_type text not null,
  entity_id text,
  entity_label text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.orders
add column if not exists checkout_reference text;

alter table public.orders
add column if not exists payment_method text not null default 'pix';

alter table public.orders
add column if not exists fulfillment_type text not null default 'pickup';

alter table public.orders
add column if not exists delivery_neighborhood text;

alter table public.orders
add column if not exists delivery_address text;

alter table public.orders
add column if not exists delivery_reference text;

alter table public.orders
add column if not exists delivery_fee numeric(10, 2) not null default 0;

alter table public.orders
add column if not exists delivery_eta_minutes integer;

alter table public.orders
drop constraint if exists orders_status_check;

alter table public.orders
add constraint orders_status_check
check (status in ('received', 'preparing', 'ready', 'dispatching', 'delivered', 'cancelled'));

alter table public.orders
drop constraint if exists orders_fulfillment_type_check;

alter table public.orders
add constraint orders_fulfillment_type_check
check (fulfillment_type in ('delivery', 'pickup'));

alter table public.orders
drop constraint if exists orders_delivery_fee_check;

alter table public.orders
add constraint orders_delivery_fee_check
check (delivery_fee >= 0);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
before update on public.profiles
for each row
execute procedure public.touch_updated_at();

drop trigger if exists touch_reservations_updated_at on public.reservations;
create trigger touch_reservations_updated_at
before update on public.reservations
for each row
execute procedure public.touch_updated_at();

drop trigger if exists touch_orders_updated_at on public.orders;
create trigger touch_orders_updated_at
before update on public.orders
for each row
execute procedure public.touch_updated_at();

drop trigger if exists touch_service_checks_updated_at on public.service_checks;
create trigger touch_service_checks_updated_at
before update on public.service_checks
for each row
execute procedure public.touch_updated_at();

drop trigger if exists touch_restaurant_settings_updated_at on public.restaurant_settings;
create trigger touch_restaurant_settings_updated_at
before update on public.restaurant_settings
for each row
execute procedure public.touch_updated_at();

drop trigger if exists touch_delivery_zones_updated_at on public.delivery_zones;
create trigger touch_delivery_zones_updated_at
before update on public.delivery_zones
for each row
execute procedure public.touch_updated_at();

drop trigger if exists touch_staff_shifts_updated_at on public.staff_shifts;
create trigger touch_staff_shifts_updated_at
before update on public.staff_shifts
for each row
execute procedure public.touch_updated_at();

drop trigger if exists touch_marketing_campaigns_updated_at on public.marketing_campaigns;
create trigger touch_marketing_campaigns_updated_at
before update on public.marketing_campaigns
for each row
execute procedure public.touch_updated_at();

drop trigger if exists touch_marketing_coupons_updated_at on public.marketing_coupons;
create trigger touch_marketing_coupons_updated_at
before update on public.marketing_coupons
for each row
execute procedure public.touch_updated_at();

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where user_id = auth.uid()),
    'customer'
  );
$$;

create or replace function public.is_staff_email(target_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_directory
    where lower(email) = lower(trim(coalesce(target_email, '')))
      and active = true
  );
$$;

grant execute on function public.is_staff_email(text) to anon, authenticated;
grant execute on function public.current_app_role() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  staff_record public.staff_directory%rowtype;
  resolved_name text;
  resolved_phone text;
begin
  select *
  into staff_record
  from public.staff_directory
  where lower(email) = lower(new.email)
    and active = true
  limit 1;

  resolved_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    staff_record.full_name,
    split_part(new.email, '@', 1)
  );

  resolved_phone := nullif(new.raw_user_meta_data ->> 'phone', '');

  insert into public.profiles (
    user_id,
    email,
    full_name,
    phone,
    role
  )
  values (
    new.id,
    lower(new.email),
    resolved_name,
    resolved_phone,
    coalesce(staff_record.role, 'customer')
  )
  on conflict (user_id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        phone = coalesce(excluded.phone, public.profiles.phone),
        role = excluded.role,
        updated_at = timezone('utc', now());

  return new;
end;
$$;

create or replace function public.handle_updated_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  staff_record public.staff_directory%rowtype;
begin
  select *
  into staff_record
  from public.staff_directory
  where lower(email) = lower(new.email)
    and active = true
  limit 1;

  update public.profiles
  set email = lower(new.email),
      full_name = coalesce(
        nullif(new.raw_user_meta_data ->> 'full_name', ''),
        staff_record.full_name,
        public.profiles.full_name
      ),
      phone = coalesce(
        nullif(new.raw_user_meta_data ->> 'phone', ''),
        public.profiles.phone
      ),
      role = coalesce(staff_record.role, 'customer'),
      updated_at = timezone('utc', now())
  where user_id = new.id;

  return new;
end;
$$;

create or replace function public.sync_profile_from_staff_directory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set role = case when new.active then new.role else 'customer' end,
      full_name = coalesce(nullif(new.full_name, ''), public.profiles.full_name),
      updated_at = timezone('utc', now())
  where lower(email) = lower(new.email);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email, raw_user_meta_data on auth.users
for each row
execute procedure public.handle_updated_auth_user();

drop trigger if exists on_staff_directory_changed on public.staff_directory;
create trigger on_staff_directory_changed
after insert or update on public.staff_directory
for each row
execute procedure public.sync_profile_from_staff_directory();

alter table public.staff_directory enable row level security;
alter table public.profiles enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.restaurant_settings enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.reservations enable row level security;
alter table public.orders enable row level security;
alter table public.service_checks enable row level security;
alter table public.service_check_items enable row level security;
alter table public.staff_shifts enable row level security;
alter table public.marketing_campaigns enable row level security;
alter table public.marketing_coupons enable row level security;
alter table public.operation_audit_logs enable row level security;

drop policy if exists "Managers and owners can read staff directory" on public.staff_directory;
create policy "Managers and owners can read staff directory"
on public.staff_directory
for select
to authenticated
using (public.current_app_role() in ('manager', 'owner'));

drop policy if exists "Managers and owners can manage staff directory" on public.staff_directory;
create policy "Managers and owners can manage staff directory"
on public.staff_directory
for all
to authenticated
using (public.current_app_role() in ('manager', 'owner'))
with check (public.current_app_role() in ('manager', 'owner'));

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_app_role() in ('manager', 'owner')
);

drop policy if exists "Authenticated users can read tables" on public.restaurant_tables;
create policy "Authenticated users can read tables"
on public.restaurant_tables
for select
to authenticated
using (true);

drop policy if exists "Managers and owners can manage tables" on public.restaurant_tables;
create policy "Managers and owners can manage tables"
on public.restaurant_tables
for all
to authenticated
using (public.current_app_role() in ('manager', 'owner'))
with check (public.current_app_role() in ('manager', 'owner'));

drop policy if exists "Authenticated users can read menu categories" on public.menu_categories;
create policy "Authenticated users can read menu categories"
on public.menu_categories
for select
to authenticated
using (true);

drop policy if exists "Managers and owners can manage menu categories" on public.menu_categories;
create policy "Managers and owners can manage menu categories"
on public.menu_categories
for all
to authenticated
using (public.current_app_role() in ('manager', 'owner'))
with check (public.current_app_role() in ('manager', 'owner'));

drop policy if exists "Authenticated users can read menu items" on public.menu_items;
create policy "Authenticated users can read menu items"
on public.menu_items
for select
to authenticated
using (true);

drop policy if exists "Managers and owners can manage menu items" on public.menu_items;
create policy "Managers and owners can manage menu items"
on public.menu_items
for all
to authenticated
using (public.current_app_role() in ('manager', 'owner'))
with check (public.current_app_role() in ('manager', 'owner'));

drop policy if exists "Authenticated users can read restaurant settings" on public.restaurant_settings;
create policy "Authenticated users can read restaurant settings"
on public.restaurant_settings
for select
to authenticated
using (true);

drop policy if exists "Managers and owners can manage restaurant settings" on public.restaurant_settings;
create policy "Managers and owners can manage restaurant settings"
on public.restaurant_settings
for all
to authenticated
using (public.current_app_role() in ('manager', 'owner'))
with check (public.current_app_role() in ('manager', 'owner'));

drop policy if exists "Authenticated users can read delivery zones" on public.delivery_zones;
create policy "Authenticated users can read delivery zones"
on public.delivery_zones
for select
to authenticated
using (true);

drop policy if exists "Managers and owners can manage delivery zones" on public.delivery_zones;
create policy "Managers and owners can manage delivery zones"
on public.delivery_zones
for all
to authenticated
using (public.current_app_role() in ('manager', 'owner'))
with check (public.current_app_role() in ('manager', 'owner'));

drop policy if exists "Customers read own reservations and staff read all" on public.reservations;
create policy "Customers read own reservations and staff read all"
on public.reservations
for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_app_role() in ('waiter', 'manager', 'owner')
);

drop policy if exists "Customers create own reservations and staff create any" on public.reservations;
create policy "Customers create own reservations and staff create any"
on public.reservations
for insert
to authenticated
with check (
  (
    public.current_app_role() = 'customer'
    and user_id = auth.uid()
    and source in ('website', 'customer')
  )
  or public.current_app_role() in ('waiter', 'manager', 'owner')
);

drop policy if exists "Staff can update reservations" on public.reservations;
create policy "Staff can update reservations"
on public.reservations
for update
to authenticated
using (public.current_app_role() in ('waiter', 'manager', 'owner'))
with check (public.current_app_role() in ('waiter', 'manager', 'owner'));

drop policy if exists "Customers read own orders and staff read all" on public.orders;
create policy "Customers read own orders and staff read all"
on public.orders
for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_app_role() in ('waiter', 'manager', 'owner')
);

drop policy if exists "Customers create own orders and staff create any" on public.orders;
create policy "Customers create own orders and staff create any"
on public.orders
for insert
to authenticated
with check (
  (
    public.current_app_role() = 'customer'
    and user_id = auth.uid()
    and source in ('website', 'customer')
  )
  or public.current_app_role() in ('waiter', 'manager', 'owner')
);

drop policy if exists "Staff can update orders" on public.orders;
create policy "Staff can update orders"
on public.orders
for update
to authenticated
using (public.current_app_role() in ('waiter', 'manager', 'owner'))
with check (public.current_app_role() in ('waiter', 'manager', 'owner'));

drop policy if exists "Staff can read service checks" on public.service_checks;
create policy "Staff can read service checks"
on public.service_checks
for select
to authenticated
using (public.current_app_role() in ('waiter', 'manager', 'owner'));

drop policy if exists "Staff can create service checks" on public.service_checks;
create policy "Staff can create service checks"
on public.service_checks
for insert
to authenticated
with check (public.current_app_role() in ('waiter', 'manager', 'owner'));

drop policy if exists "Staff can update service checks" on public.service_checks;
create policy "Staff can update service checks"
on public.service_checks
for update
to authenticated
using (public.current_app_role() in ('waiter', 'manager', 'owner'))
with check (public.current_app_role() in ('waiter', 'manager', 'owner'));

drop policy if exists "Staff can read service check items" on public.service_check_items;
create policy "Staff can read service check items"
on public.service_check_items
for select
to authenticated
using (public.current_app_role() in ('waiter', 'manager', 'owner'));

drop policy if exists "Staff can create service check items" on public.service_check_items;
create policy "Staff can create service check items"
on public.service_check_items
for insert
to authenticated
with check (public.current_app_role() in ('waiter', 'manager', 'owner'));

drop policy if exists "Staff can update service check items" on public.service_check_items;
create policy "Staff can update service check items"
on public.service_check_items
for update
to authenticated
using (public.current_app_role() in ('waiter', 'manager', 'owner'))
with check (public.current_app_role() in ('waiter', 'manager', 'owner'));

drop policy if exists "Managers and owners can read staff shifts" on public.staff_shifts;
create policy "Managers and owners can read staff shifts"
on public.staff_shifts
for select
to authenticated
using (public.current_app_role() in ('manager', 'owner'));

drop policy if exists "Managers and owners can manage staff shifts" on public.staff_shifts;
create policy "Managers and owners can manage staff shifts"
on public.staff_shifts
for all
to authenticated
using (public.current_app_role() in ('manager', 'owner'))
with check (public.current_app_role() in ('manager', 'owner'));

drop policy if exists "Managers and owners can read campaigns" on public.marketing_campaigns;
create policy "Managers and owners can read campaigns"
on public.marketing_campaigns
for select
to authenticated
using (public.current_app_role() in ('manager', 'owner'));

drop policy if exists "Managers and owners can manage campaigns" on public.marketing_campaigns;
create policy "Managers and owners can manage campaigns"
on public.marketing_campaigns
for all
to authenticated
using (public.current_app_role() in ('manager', 'owner'))
with check (public.current_app_role() in ('manager', 'owner'));

drop policy if exists "Managers and owners can read coupons" on public.marketing_coupons;
create policy "Managers and owners can read coupons"
on public.marketing_coupons
for select
to authenticated
using (public.current_app_role() in ('manager', 'owner'));

drop policy if exists "Managers and owners can manage coupons" on public.marketing_coupons;
create policy "Managers and owners can manage coupons"
on public.marketing_coupons
for all
to authenticated
using (public.current_app_role() in ('manager', 'owner'))
with check (public.current_app_role() in ('manager', 'owner'));

drop policy if exists "Owners can read operation audit logs" on public.operation_audit_logs;
create policy "Owners can read operation audit logs"
on public.operation_audit_logs
for select
to authenticated
using (public.current_app_role() = 'owner');

drop policy if exists "Staff can insert operation audit logs" on public.operation_audit_logs;
create policy "Staff can insert operation audit logs"
on public.operation_audit_logs
for insert
to authenticated
with check (public.current_app_role() in ('waiter', 'manager', 'owner'));

alter table public.profiles replica identity full;
alter table public.staff_directory replica identity full;
alter table public.restaurant_tables replica identity full;
alter table public.menu_categories replica identity full;
alter table public.menu_items replica identity full;
alter table public.restaurant_settings replica identity full;
alter table public.delivery_zones replica identity full;
alter table public.reservations replica identity full;
alter table public.orders replica identity full;
alter table public.service_checks replica identity full;
alter table public.service_check_items replica identity full;
alter table public.staff_shifts replica identity full;
alter table public.marketing_campaigns replica identity full;
alter table public.marketing_coupons replica identity full;
alter table public.operation_audit_logs replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'profiles'
    ) then
      execute 'alter publication supabase_realtime add table public.profiles';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'staff_directory'
    ) then
      execute 'alter publication supabase_realtime add table public.staff_directory';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'restaurant_tables'
    ) then
      execute 'alter publication supabase_realtime add table public.restaurant_tables';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'menu_categories'
    ) then
      execute 'alter publication supabase_realtime add table public.menu_categories';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'menu_items'
    ) then
      execute 'alter publication supabase_realtime add table public.menu_items';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'restaurant_settings'
    ) then
      execute 'alter publication supabase_realtime add table public.restaurant_settings';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'delivery_zones'
    ) then
      execute 'alter publication supabase_realtime add table public.delivery_zones';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'reservations'
    ) then
      execute 'alter publication supabase_realtime add table public.reservations';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'orders'
    ) then
      execute 'alter publication supabase_realtime add table public.orders';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'service_checks'
    ) then
      execute 'alter publication supabase_realtime add table public.service_checks';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'service_check_items'
    ) then
      execute 'alter publication supabase_realtime add table public.service_check_items';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'staff_shifts'
    ) then
      execute 'alter publication supabase_realtime add table public.staff_shifts';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'marketing_campaigns'
    ) then
      execute 'alter publication supabase_realtime add table public.marketing_campaigns';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'marketing_coupons'
    ) then
      execute 'alter publication supabase_realtime add table public.marketing_coupons';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'operation_audit_logs'
    ) then
      execute 'alter publication supabase_realtime add table public.operation_audit_logs';
    end if;
  end if;
end;
$$;

insert into public.staff_directory (email, full_name, role)
values
  ('garcom@paithiago.com.br', 'Caio Atendimento', 'waiter'),
  ('gerente@paithiago.com.br', 'Marina Gestao', 'manager'),
  ('dono@paithiago.com.br', 'Thiago Proprietario', 'owner')
on conflict (email) do update
set full_name = excluded.full_name,
    role = excluded.role,
    active = true;

insert into public.restaurant_settings (
  id,
  restaurant_name,
  tagline,
  description,
  address,
  city,
  phone,
  whatsapp,
  email,
  map_url,
  google_business_url,
  instagram_url,
  facebook_url,
  instagram_handle,
  facebook_handle,
  schedule_lines,
  holiday_policy,
  service_notes,
  delivery_minimum_order,
  pickup_eta_minutes,
  waiter_commission_rate,
  delivery_hotline,
  delivery_coverage_note,
  about_story,
  about_mission
)
values (
  'main',
  'Pai Thiago',
  'Brasa brasileira, servico refinado e atmosfera memoravel.',
  'O Pai Thiago e uma casa de cozinha brasileira contemporanea com foco em hospitalidade, ingredientes selecionados e uma experiencia elegante do almoco ao jantar.',
  'Rua das Palmeiras, 185',
  'Bela Vista, Sao Paulo - SP',
  '(11) 3456-7890',
  '(11) 98765-4321',
  'reservas@paithiago.com.br',
  'https://www.google.com/maps/search/?api=1&query=Rua+das+Palmeiras+185+Bela+Vista+Sao+Paulo',
  'https://www.google.com/search?q=Pai+Thiago+Bela+Vista+Sao+Paulo',
  'https://www.instagram.com/paithiago.restaurante',
  'https://www.facebook.com/paithiago.restaurante',
  '@paithiago.restaurante',
  '/paithiago.restaurante',
  array[
    'Ter a Qui - 12h as 15h | 19h as 23h',
    'Sex e Sab - 12h as 16h | 19h as 0h',
    'Dom - 12h as 17h'
  ],
  'Feriados e datas especiais funcionam sob agenda da casa e disponibilidade de reservas.',
  array[
    'Reservas com confirmacao rapida pelo sistema e suporte por WhatsApp.',
    'Pedidos digitais conectados a operacao sem precisar atualizar a pagina.',
    'Delivery e retirada com acompanhamento em tempo real para cliente e equipe.',
    'Equipe preparada para almocos executivos, jantares especiais e pequenas celebracoes.'
  ],
  45,
  20,
  10,
  '(11) 98765-4321',
  'Entregas disponiveis em bairros proximos com taxa calculada no checkout.',
  'Nascido da ideia de juntar cozinha brasileira contemporanea, servico atento e atmosfera calorosa, o Pai Thiago foi desenhado para ser uma casa onde cada detalhe importa: fogo bem tratado, salao elegante e relacao duradoura com o cliente.',
  'Oferecer uma experiencia de restaurante completa, onde cozinha, hospitalidade e tecnologia trabalham juntas para receber melhor.'
)
on conflict (id) do update
set restaurant_name = excluded.restaurant_name,
    tagline = excluded.tagline,
    description = excluded.description,
    address = excluded.address,
    city = excluded.city,
    phone = excluded.phone,
    whatsapp = excluded.whatsapp,
    email = excluded.email,
    map_url = excluded.map_url,
    google_business_url = excluded.google_business_url,
    instagram_url = excluded.instagram_url,
    facebook_url = excluded.facebook_url,
    instagram_handle = excluded.instagram_handle,
    facebook_handle = excluded.facebook_handle,
    schedule_lines = excluded.schedule_lines,
    holiday_policy = excluded.holiday_policy,
    service_notes = excluded.service_notes,
    delivery_minimum_order = excluded.delivery_minimum_order,
    pickup_eta_minutes = excluded.pickup_eta_minutes,
    waiter_commission_rate = excluded.waiter_commission_rate,
    delivery_hotline = excluded.delivery_hotline,
    delivery_coverage_note = excluded.delivery_coverage_note,
    about_story = excluded.about_story,
    about_mission = excluded.about_mission;

insert into public.delivery_zones (slug, name, fee, eta_minutes, service_window, sort_order)
values
  ('bela-vista', 'Bela Vista', 6, 35, 'Entrega estimada em 30 a 40 minutos.', 1),
  ('consolacao', 'Consolacao', 8, 40, 'Entrega estimada em 35 a 45 minutos.', 2),
  ('paraiso', 'Paraiso', 10, 48, 'Entrega estimada em 40 a 50 minutos.', 3),
  ('liberdade', 'Liberdade', 9, 42, 'Entrega estimada em 35 a 45 minutos.', 4)
on conflict (slug) do update
set name = excluded.name,
    fee = excluded.fee,
    eta_minutes = excluded.eta_minutes,
    service_window = excluded.service_window,
    sort_order = excluded.sort_order,
    is_active = true;

insert into public.restaurant_tables (name, area, capacity)
values
  ('Mesa 01', 'Salao principal', 2),
  ('Mesa 02', 'Salao principal', 4),
  ('Mesa 03', 'Salao principal', 4),
  ('Mesa 04', 'Lounge', 6),
  ('Mesa 05', 'Sala reservada', 8),
  ('Mesa 06', 'Varanda', 4),
  ('Mesa 07', 'Salao principal', 2),
  ('Mesa 08', 'Salao principal', 6),
  ('Mesa 09', 'Salao principal', 4),
  ('Mesa 10', 'Salao principal', 8),
  ('Mesa 11', 'Lounge', 4),
  ('Mesa 12', 'Lounge', 6),
  ('Mesa 13', 'Lounge', 8),
  ('Mesa 14', 'Lounge', 10),
  ('Mesa 15', 'Sala reservada', 6),
  ('Mesa 16', 'Sala reservada', 8),
  ('Mesa 17', 'Sala reservada', 10),
  ('Mesa 18', 'Sala reservada', 12),
  ('Mesa 19', 'Varanda', 2),
  ('Mesa 20', 'Varanda', 4),
  ('Mesa 21', 'Varanda', 6),
  ('Mesa 22', 'Varanda', 8),
  ('Mesa 23', 'Varanda', 10),
  ('Mesa 24', 'Varanda', 12)
on conflict (name) do nothing;

insert into public.menu_categories (name, slug, description, highlight_color, sort_order)
values
  ('Da Brasa', 'da-brasa', 'Cortes selecionados, fogo controlado e acabamentos intensos.', 'gold', 1),
  ('Mar e Frescor', 'mar-e-frescor', 'Peixes e frutos do mar com tecnica contemporanea e sotaque brasileiro.', 'sage', 2),
  ('Acompanhamentos', 'acompanhamentos', 'Pecas pensadas para compartilhar e compor a mesa.', 'clay', 3),
  ('Sobremesas de Casa', 'sobremesas', 'Finalizacoes elegantes com memoria afetiva.', 'cream', 4)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    highlight_color = excluded.highlight_color,
    sort_order = excluded.sort_order;

insert into public.menu_items (category_id, name, description, price, prep_time, spice_level, tags, allergens, is_signature, sort_order)
select id, 'Bife ancho Pai Thiago', 'Ancho grelhado na brasa, demi-glace de rapadura e batatas crocantes com alecrim.', 92, '18 min', 'suave', array['carne', 'brasa', 'chef'], array['lacteos'], true, 1
from public.menu_categories
where slug = 'da-brasa'
on conflict (category_id, name) do update
set description = excluded.description,
    price = excluded.price,
    prep_time = excluded.prep_time,
    spice_level = excluded.spice_level,
    tags = excluded.tags,
    allergens = excluded.allergens,
    is_signature = excluded.is_signature,
    sort_order = excluded.sort_order;

insert into public.menu_items (category_id, name, description, price, prep_time, spice_level, tags, allergens, is_signature, sort_order)
select id, 'Costela laqueada', 'Costela bovina assada por longas horas, finalizada com glaze de melaco e farofa amanteigada.', 86, '22 min', 'suave', array['slow cooked', 'brasileiro'], array['gluten', 'lacteos'], false, 2
from public.menu_categories
where slug = 'da-brasa'
on conflict (category_id, name) do update
set description = excluded.description,
    price = excluded.price,
    prep_time = excluded.prep_time,
    spice_level = excluded.spice_level,
    tags = excluded.tags,
    allergens = excluded.allergens,
    is_signature = excluded.is_signature,
    sort_order = excluded.sort_order;

insert into public.menu_items (category_id, name, description, price, prep_time, spice_level, tags, allergens, is_signature, sort_order)
select id, 'Polvo na manteiga de garrafa', 'Polvo grelhado com arroz de coco tostado, vinagrete morno de tomate e coentro.', 98, '20 min', 'medio', array['frutos do mar', 'assinatura'], array['crustaceos'], true, 1
from public.menu_categories
where slug = 'mar-e-frescor'
on conflict (category_id, name) do update
set description = excluded.description,
    price = excluded.price,
    prep_time = excluded.prep_time,
    spice_level = excluded.spice_level,
    tags = excluded.tags,
    allergens = excluded.allergens,
    is_signature = excluded.is_signature,
    sort_order = excluded.sort_order;

insert into public.menu_items (category_id, name, description, price, prep_time, spice_level, tags, allergens, is_signature, sort_order)
select id, 'Camaroes ao molho de moqueca leve', 'Camaroes salteados com molho cremoso de coco, pimentoes assados e arroz de castanhas.', 82, '17 min', 'medio', array['mar', 'cremoso'], array['crustaceos', 'oleaginosas'], false, 2
from public.menu_categories
where slug = 'mar-e-frescor'
on conflict (category_id, name) do update
set description = excluded.description,
    price = excluded.price,
    prep_time = excluded.prep_time,
    spice_level = excluded.spice_level,
    tags = excluded.tags,
    allergens = excluded.allergens,
    is_signature = excluded.is_signature,
    sort_order = excluded.sort_order;

insert into public.menu_items (category_id, name, description, price, prep_time, spice_level, tags, allergens, is_signature, sort_order)
select id, 'Arroz cremoso de queijo coalho', 'Arroz caldoso, queijo coalho tostado, ciboulette e crocante de castanha.', 34, '10 min', 'suave', array['cremoso', 'compartilhar'], array['lacteos', 'oleaginosas'], false, 1
from public.menu_categories
where slug = 'acompanhamentos'
on conflict (category_id, name) do update
set description = excluded.description,
    price = excluded.price,
    prep_time = excluded.prep_time,
    spice_level = excluded.spice_level,
    tags = excluded.tags,
    allergens = excluded.allergens,
    is_signature = excluded.is_signature,
    sort_order = excluded.sort_order;

insert into public.menu_items (category_id, name, description, price, prep_time, spice_level, tags, allergens, is_signature, sort_order)
select id, 'Pudim brulee de rapadura', 'Pudim liso de baunilha com crosta fina caramelizada e flor de sal.', 28, '6 min', 'sem picancia', array['classico', 'casa'], array['ovos', 'lacteos'], true, 1
from public.menu_categories
where slug = 'sobremesas'
on conflict (category_id, name) do update
set description = excluded.description,
    price = excluded.price,
    prep_time = excluded.prep_time,
    spice_level = excluded.spice_level,
    tags = excluded.tags,
    allergens = excluded.allergens,
    is_signature = excluded.is_signature,
    sort_order = excluded.sort_order;
