-- ════════════════════════════════════════════════════════════════
-- LINKS ORDERS TO REAL CUSTOMER ACCOUNTS
--
-- Run this once in the Supabase SQL editor, AFTER orders_table_setup.sql
-- and customers_auth_setup.sql have already been run.
--
-- Adds a `customer_id` column to `orders` so that when a signed-in
-- customer actually places an order from the website (continues to
-- WhatsApp/Instagram from the order confirmation screen), that order
-- is linked to their real account — not just a typed-in name. This is
-- what lets the admin dashboard's Customers page show a real order
-- count / total spent / order history per customer, instead of
-- static zeros.
-- ════════════════════════════════════════════════════════════════

alter table orders
  add column if not exists customer_id uuid references auth.users(id) on delete set null;

create index if not exists orders_customer_id_idx on orders(customer_id);
