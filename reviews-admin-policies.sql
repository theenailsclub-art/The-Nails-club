-- Run once in Supabase SQL Editor (after reviews-setup.sql).
-- Lets the admin dashboard see pending reviews, approve, and delete them.
-- NOTE: the dashboard signs in with a password in the browser and talks to
-- Supabase with the public key (same as your products/orders pages), so these
-- policies are as open as those tables are. Fine for review moderation;
-- ask me if you want it locked down properly with an Edge Function.

drop policy if exists "admin read all reviews" on public.reviews;
create policy "admin read all reviews" on public.reviews
  for select to anon using (true);

drop policy if exists "admin update reviews" on public.reviews;
create policy "admin update reviews" on public.reviews
  for update to anon using (true) with check (true);

drop policy if exists "admin delete reviews" on public.reviews;
create policy "admin delete reviews" on public.reviews
  for delete to anon using (true);
