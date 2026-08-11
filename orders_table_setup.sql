-- ════════════════════════════════════════════════════════════════
-- ORDERS TABLE — for orders logged by the admin (Website checkout,
-- and orders placed by customers directly over WhatsApp / Instagram
-- that the admin enters manually from the dashboard).
--
-- Each order snapshots the title + image + price of every design at
-- the time it was ordered (inside `items`), so the order always shows
-- the correct product photo in the admin dashboard — even if that
-- product is later edited or deleted from the catalog.
--
-- Run this once in the Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════

create sequence if not exists orders_order_no_seq start 1042;

create table if not exists orders (
  id              bigint generated always as identity primary key,
  order_no        text unique not null default ('TNC-' || nextval('orders_order_no_seq')),
  customer_name   text not null,
  customer_phone  text,
  channel         text not null default 'Website'
                    check (channel in ('Website','WhatsApp','Instagram','Other')),
  items           jsonb not null default '[]',  -- [{ "title": "...", "img": "...", "price": 999 }, ...]
  amount          numeric not null default 0,
  payment_status  text not null default 'unpaid' check (payment_status in ('paid','unpaid')),
  status          text not null default 'pending'
                    check (status in ('pending','processing','shipped','completed','cancelled')),
  address         text,
  notes           text,
  created_at      timestamptz not null default now()
);

alter table orders enable row level security;

drop policy if exists "Admin dashboard can manage all orders" on orders;

-- Same trust model as the products table: the admin dashboard uses the
-- publishable key, gated by its own password screen, and needs full
-- read/write access. There is no public policy — the storefront never
-- reads from this table, only the admin dashboard does.
create policy "Admin dashboard can manage all orders"
  on orders for all
  using (true)
  with check (true);
