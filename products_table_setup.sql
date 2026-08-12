-- ════════════════════════════════════════════════════════════════
-- PRODUCTS TABLE — the core catalog table used by the admin
-- dashboard (add/edit/delete products) and by the public site
-- (index.html / collection.html / wishlist.html / premium product
-- page) to render the collection grid.
--
-- This table did not exist yet in the project, which is why saving
-- a product from the admin dashboard failed with:
--   "relation \"products\" does not exist"
--
-- Run this FIRST in the Supabase SQL editor, before
-- supabase_rls_update.sql and reels_and_photos_setup.sql (both of
-- those only ALTER/policy this table — they assume it already
-- exists).
-- ════════════════════════════════════════════════════════════════

create table if not exists products (
  id            bigint generated always as identity primary key,
  title         text not null,
  description   text,
  original      numeric not null default 999,
  discounted    numeric not null default 999,
  status        text not null default 'draft'
                  check (status in ('draft','published')),
  featured      boolean not null default false,
  is_new        boolean not null default false,
  category      text,
  stock         int not null default 0,
  tags          text,
  img           text,
  photos        jsonb not null default '[]',   -- array of image URLs
  video         text,                           -- optional product video URL
  views         int not null default 0,
  created_at    timestamptz not null default now()
);

alter table products enable row level security;

drop policy if exists "Public can view published products" on products;
drop policy if exists "Admin dashboard can manage all products" on products;

-- Anyone can read published products (site visitors)
create policy "Public can view published products"
  on products for select
  using (status = 'published');

-- The admin dashboard (using the publishable key, gated by its own
-- password screen) can read/write everything, including drafts
create policy "Admin dashboard can manage all products"
  on products for all
  using (true)
  with check (true);
