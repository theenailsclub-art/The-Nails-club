-- ════════════════════════════════════════════════════════════════
-- CATEGORIES TABLE — backs the new "Categories" page in the admin
-- dashboard, so category names, subtitles, and cover images can be
-- edited from the dashboard instead of the code.
--
-- The admin dashboard seeds this table automatically from the
-- existing 11 categories the FIRST time you open the Categories
-- page — you don't need to type them in by hand.
--
-- Run this once in the Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════

create table if not exists categories (
  id          bigint generated always as identity primary key,
  key         text unique not null,   -- stable slug, e.g. 'chrome' — never shown to customers
  label       text not null,          -- display name, e.g. 'Chrome'
  subtitle    text,                   -- small tagline shown under the cover image
  cover_img   text,                   -- cover photo URL for the category tile
  sort_order  int not null default 1,
  created_at  timestamptz not null default now()
);

alter table categories enable row level security;

drop policy if exists "Public can view categories" on categories;
create policy "Public can view categories"
  on categories for select
  using (true);

drop policy if exists "Admin dashboard can manage categories" on categories;
create policy "Admin dashboard can manage categories"
  on categories for all
  using (true)
  with check (true);
