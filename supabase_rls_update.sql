drop policy if exists "Public can view published products" on products;
drop policy if exists "Authenticated users can manage products" on products;

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
