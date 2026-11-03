-- =====================================================================
-- Cars Direct — core schema
-- Money is stored as integer minor units: NGN in kobo, USD in cents.
-- Never store money as float.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- Enums ----------------------------------------------------
create type vehicle_condition as enum ('brand_new', 'fairly_used');
create type powertrain_type   as enum ('EREV', 'PHEV', 'BEV');
create type range_standard    as enum ('CLTC', 'WLTP', 'NEDC', 'EPA');
create type vehicle_status    as enum (
  'available',      -- "Available on Ground" (Abuja)
  'in_transit',     -- "In Transit from China"
  'factory_order',  -- "Factory Order" (repeatable spec, not a single unit)
  'reserved',       -- set automatically when a deposit clears on a single unit
  'sold'
);
create type image_category    as enum ('exterior', 'interior', 'dashboard', 'battery_report', 'other');
create type order_status      as enum (
  'pending_deposit', 'deposit_paid', 'procuring', 'shipped', 'arrived_port',
  'in_abuja_inspection', 'balance_due', 'balance_paid', 'delivered',
  'cancelled', 'refunded'
);
create type payment_kind      as enum ('deposit', 'balance');
create type payment_status    as enum ('pending', 'success', 'failed', 'abandoned');
create type payment_provider  as enum ('paystack', 'flutterwave', 'bank_transfer_manual');
create type user_role         as enum ('customer', 'admin');

-- ---------- Profiles (role lives here) -------------------------------
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text,
  phone       text,
  role        user_role not null default 'customer',
  created_at  timestamptz not null default now()
);

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- Settings (FX rate etc., edited by admin) -----------------
create table settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users
);
insert into settings (key, value) values
  ('fx_ngn_per_usd', '1500'::jsonb),          -- EXAMPLE rate; admin updates daily
  ('deposit_rate',   '0.40'::jsonb);

-- ---------- Vehicles -------------------------------------------------
create table vehicles (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  title               text not null,                 -- "2024 BYD Song Plus DM-i"
  make                text not null,
  model               text not null,
  condition           vehicle_condition not null,
  powertrain          powertrain_type not null,
  model_year          int not null,
  mileage_km          int not null default 0 check (mileage_km >= 0),
  battery_kwh         numeric(5,1) check (battery_kwh > 0),
  electric_range_km   int check (electric_range_km >= 0),
  combined_range_km   int check (combined_range_km >= 0),
  range_standard      range_standard not null default 'CLTC',
  price_kobo          bigint not null check (price_kobo > 0),     -- source of truth for checkout
  price_usd_cents     bigint check (price_usd_cents > 0),         -- optional reference price
  -- 40% deposit rounded to the nearest whole naira, kept in sync with price.
  deposit_kobo        bigint generated always as ((round(price_kobo * 0.40 / 100.0) * 100)::bigint) stored,
  features            text[] not null default '{}',
  inspection_verified boolean not null default false,
  inspection_points   int not null default 150,
  status              vehicle_status not null default 'available',
  eta_date            date,                           -- for in_transit units
  vin_last6           text,                           -- shown to buyer after deposit
  description         text,
  created_by          uuid references auth.users default auth.uid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Business rule: "Fairly Used" means model year 2020 or newer.
  constraint used_is_2020_plus check (condition = 'brand_new' or model_year >= 2020),
  -- Brand new means delivery-mileage only.
  constraint new_is_zero_km   check (condition = 'fairly_used' or mileage_km <= 100),
  -- BEVs have no combined (fuel) range.
  constraint bev_no_combined  check (powertrain <> 'BEV' or combined_range_km is null)
);

create index vehicles_listing_idx on vehicles (status, condition, powertrain, price_kobo);

create table vehicle_images (
  id          uuid primary key default gen_random_uuid(),
  vehicle_id  uuid not null references vehicles on delete cascade,
  path        text not null,                         -- storage path in bucket "vehicle-images"
  category    image_category not null default 'exterior',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index vehicle_images_vehicle_idx on vehicle_images (vehicle_id, sort_order);

-- ---------- Orders ---------------------------------------------------
create sequence order_seq start 1001;

create table orders (
  id                     uuid primary key default gen_random_uuid(),
  order_number           text unique not null
                           default 'CD-' || to_char(now(), 'YYYY') || '-' || nextval('order_seq'),
  vehicle_id             uuid not null references vehicles,
  customer_id            uuid references auth.users,
  customer_name          text not null,
  customer_phone         text not null,
  customer_email         text not null,
  -- Snapshots: the order never changes if the listing price changes later.
  price_kobo             bigint not null,
  deposit_kobo           bigint not null,
  balance_kobo           bigint generated always as (price_kobo - deposit_kobo) stored,
  fx_ngn_per_usd         numeric(10,2) not null,
  vehicle_status_at_order vehicle_status not null,
  expected_ready_from    date,
  expected_ready_to      date,
  status                 order_status not null default 'pending_deposit',
  terms_version          text not null,
  terms_accepted_at      timestamptz not null,
  notes                  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint deposit_is_40pct check (deposit_kobo = (round(price_kobo * 0.40 / 100.0) * 100)::bigint)
);
create index orders_customer_idx on orders (customer_id, created_at desc);

-- ---------- Payments (ledger for deposit + balance) ------------------
create table payments (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references orders on delete restrict,
  kind                payment_kind not null,
  amount_kobo         bigint not null check (amount_kobo > 0),
  provider            payment_provider not null,
  provider_reference  text unique not null,
  status              payment_status not null default 'pending',
  channel             text,                 -- card, bank_transfer, ussd...
  paid_at             timestamptz,
  raw                 jsonb,                -- verified provider payload
  confirmed_by        uuid references auth.users,  -- admin, for manual transfers
  created_at          timestamptz not null default now()
);
create index payments_order_idx on payments (order_id);

-- The requested `deposits` table, as a view over the ledger.
create view deposits with (security_invoker = true) as
  select p.*, o.order_number, o.vehicle_id, o.customer_id
  from payments p join orders o on o.id = p.order_id
  where p.kind = 'deposit';

-- ---------- Atomic, idempotent payment confirmation ------------------
-- Called by the webhook (service role) after signature + amount checks.
create or replace function confirm_payment(p_reference text, p_amount_kobo bigint, p_channel text, p_raw jsonb)
returns orders
language plpgsql security definer set search_path = public as $$
declare
  v_pay   payments;
  v_order orders;
begin
  select * into v_pay from payments where provider_reference = p_reference for update;
  if not found then raise exception 'unknown reference %', p_reference; end if;

  select * into v_order from orders where id = v_pay.order_id for update;
  if v_pay.status = 'success' then return v_order; end if;          -- idempotent
  if v_pay.amount_kobo <> p_amount_kobo then
    raise exception 'amount mismatch for %: expected %, got %', p_reference, v_pay.amount_kobo, p_amount_kobo;
  end if;

  update payments set status = 'success', paid_at = now(), channel = p_channel, raw = p_raw
   where id = v_pay.id;

  if v_pay.kind = 'deposit' then
    update orders set status = 'deposit_paid', updated_at = now() where id = v_order.id returning * into v_order;
    -- Single physical units get reserved; factory-order specs stay open for more buyers.
    update vehicles set status = 'reserved', updated_at = now()
     where id = v_order.vehicle_id and status in ('available', 'in_transit');
  else
    update orders set status = 'balance_paid', updated_at = now() where id = v_order.id returning * into v_order;
  end if;
  return v_order;
end $$;

revoke execute on function confirm_payment from public, anon, authenticated;

-- ---------- Row Level Security ---------------------------------------
alter table profiles       enable row level security;
alter table settings       enable row level security;
alter table vehicles       enable row level security;
alter table vehicle_images enable row level security;
alter table orders         enable row level security;
alter table payments       enable row level security;

create policy "own profile"        on profiles for select using (id = auth.uid() or is_admin());
create policy "update own profile" on profiles for update using (id = auth.uid())
  with check (role = (select role from profiles where id = auth.uid()));  -- cannot self-promote

create policy "public settings read" on settings for select using (true);
create policy "admin settings write" on settings for all using (is_admin()) with check (is_admin());

create policy "public vehicles read"  on vehicles for select using (status <> 'sold' or is_admin());
create policy "admin vehicles write"  on vehicles for all using (is_admin()) with check (is_admin());
create policy "public images read"    on vehicle_images for select using (true);
create policy "admin images write"    on vehicle_images for all using (is_admin()) with check (is_admin());

-- Orders and payments are written only by server routes using the service role.
create policy "customer reads own orders" on orders for select using (customer_id = auth.uid() or is_admin());
create policy "admin updates orders"      on orders for update using (is_admin()) with check (is_admin());
create policy "customer reads own payments" on payments for select
  using (is_admin() or exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid()));

-- ---------- Storage --------------------------------------------------
insert into storage.buckets (id, name, public) values ('vehicle-images', 'vehicle-images', true)
  on conflict (id) do nothing;
create policy "admin uploads images" on storage.objects for insert
  with check (bucket_id = 'vehicle-images' and is_admin());
create policy "admin deletes images" on storage.objects for delete
  using (bucket_id = 'vehicle-images' and is_admin());
