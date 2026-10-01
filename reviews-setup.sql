-- Run in Supabase Dashboard -> SQL Editor.
-- Safe to run more than once (also upgrades an older version of the reviews table).

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  rating      int  not null check (rating between 1 and 5),
  review      text not null check (char_length(review) between 1 and 1000),
  approved    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Columns added for per-product reviews, titles, photos and "Helpful" votes
alter table public.reviews add column if not exists design        text;
alter table public.reviews add column if not exists title         text check (title is null or char_length(title) <= 100);
alter table public.reviews add column if not exists photo_urls    text[] not null default '{}';
alter table public.reviews add column if not exists helpful_count int    not null default 0;

alter table public.reviews drop constraint if exists reviews_photo_limit;
alter table public.reviews add  constraint reviews_photo_limit check (coalesce(array_length(photo_urls, 1), 0) <= 3);

alter table public.reviews enable row level security;

-- Visitors can submit a review, but only as "not approved yet" with 0 helpful votes
drop policy if exists "public can submit reviews" on public.reviews;
create policy "public can submit reviews" on public.reviews
  for insert to anon with check (approved = false and helpful_count = 0);

-- Visitors can only READ reviews you have approved
drop policy if exists "public can read approved reviews" on public.reviews;
create policy "public can read approved reviews" on public.reviews
  for select to anon using (approved = true);

-- "Helpful" button: lets visitors add +1 to an approved review (and nothing else)
create or replace function public.increment_review_helpful(rid uuid)
returns int
language sql
security definer
set search_path = public
as $$
  update public.reviews set helpful_count = helpful_count + 1
  where id = rid and approved = true
  returning helpful_count;
$$;
grant execute on function public.increment_review_helpful(uuid) to anon;
