-- =====================================================================
-- Cars Direct — operations: profiles, order tracking, double-sale guard
-- =====================================================================

-- ---------- Every new account gets a profile (role defaults to customer)
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Accounts created before this migration
insert into profiles (id, full_name)
  select id, split_part(email, '@', 1) from auth.users on conflict (id) do nothing;

-- ---------- Orders: private tracking link, client IP for rate limiting
alter table orders add column if not exists access_token uuid not null default gen_random_uuid();
create unique index if not exists orders_access_token_idx on orders (access_token);
alter table orders add column if not exists client_ip text;
create index if not exists orders_vehicle_pending_idx on orders (vehicle_id, status, created_at);
create index if not exists orders_ip_idx on orders (client_ip, created_at);

-- A second deposit on a car someone else already reserved lands here, for refund.
alter type order_status add value if not exists 'refund_pending' after 'balance_paid';

-- ---------- Order history: one row per status change (tracking timeline)
create table if not exists order_events (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references orders on delete cascade,
  status      order_status not null,
  note        text,
  created_by  uuid references auth.users,
  created_at  timestamptz not null default now()
);
create index if not exists order_events_order_idx on order_events (order_id, created_at);
alter table order_events enable row level security;
create policy "admin reads order events" on order_events for select using (is_admin());

create or replace function log_order_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into order_events (order_id, status, created_by) values (new.id, new.status, auth.uid());
  end if;
  return new;
end $$;

drop trigger if exists orders_status_log on orders;
create trigger orders_status_log after insert or update of status on orders
  for each row execute function log_order_status();

-- ---------- Payment confirmation v2: refuses to double-sell a single unit
create or replace function confirm_payment(p_reference text, p_amount_kobo bigint, p_channel text, p_raw jsonb)
returns orders
language plpgsql security definer set search_path = public as $$
declare
  v_pay     payments;
  v_order   orders;
  v_vehicle vehicles;
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

  if v_pay.kind = 'balance' then
    update orders set status = 'balance_paid', updated_at = now() where id = v_order.id returning * into v_order;
    return v_order;
  end if;

  -- Deposit. Lock the car so two simultaneous deposits are decided one at a time.
  select * into v_vehicle from vehicles where id = v_order.vehicle_id for update;

  if v_order.vehicle_status_at_order in ('available', 'in_transit')
     and v_vehicle.status in ('reserved', 'sold') then
    -- Another buyer's deposit won this single unit: keep the money record, flag for refund.
    update orders set status = 'refund_pending', updated_at = now(),
           notes = coalesce(notes || E'\n', '') || 'Car was already reserved when this deposit arrived. Refund the deposit.'
     where id = v_order.id returning * into v_order;
    return v_order;
  end if;

  update orders set status = 'deposit_paid', updated_at = now() where id = v_order.id returning * into v_order;
  update vehicles set status = 'reserved', updated_at = now()
   where id = v_order.vehicle_id and status in ('available', 'in_transit');
  return v_order;
end $$;

revoke execute on function confirm_payment from public, anon, authenticated;

-- ---------- Notifications: claim a payment once so receipts never send twice
alter table payments add column if not exists notified_at timestamptz;
