-- Run once in Supabase Dashboard -> SQL Editor
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  rating      int  not null check (rating between 1 and 5),
  review      text not null check (char_length(review) between 1 and 1000),
  approved    boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.reviews enable row level security;

-- Visitors can submit a review, but only as "not approved yet"
drop policy if exists "public can submit reviews" on public.reviews;
create policy "public can submit reviews" on public.reviews
  for insert to anon with check (approved = false);

-- Visitors can only READ reviews you have approved
drop policy if exists "public can read approved reviews" on public.reviews;
create policy "public can read approved reviews" on public.reviews
  for select to anon using (approved = true);

-- To publish a review: Table Editor -> reviews -> tick "approved" on that row.

-- Added for per-product reviews (product page tags each review with its design number)
alter table public.reviews add column if not exists design text;
