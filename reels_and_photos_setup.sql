-- ════════════════════════════════════════════════════════════════
-- REELS TABLE — manages the "In Motion" video strip on index.html
-- and PRODUCT PHOTO GALLERY — adds multi-photo + video support
-- to the products table.
--
-- Run this once in the Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════

-- ── 1. REELS TABLE ──────────────────────────────────────────────
create table if not exists reels (
  id          bigint generated always as identity primary key,
  title       text not null default 'Untitled Reel',
  subtitle    text,
  video_url   text,
  poster_url  text,
  sort_order  int not null default 1,
  visible     boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table reels enable row level security;

drop policy if exists "Admin can manage reels" on reels;
create policy "Admin can manage reels"
  on reels for all
  using (true)
  with check (true);

drop policy if exists "Public can read visible reels" on reels;
create policy "Public can read visible reels"
  on reels for select
  using (visible = true);

-- ── 2. SEED — all 10 existing website reels ─────────────────────
-- Only inserts if the table is empty, so re-running is safe.
insert into reels (title, subtitle, video_url, poster_url, sort_order, visible)
select * from (values
  ('Collection Preview',  '01 · Preview',   'videos/1_2.mp4',                                              'Images/rose-gloss.jpg',                    1,  true),
  ('Bridal Dreams',       '02 · Bridal',    'videos/2nd reel.mp4',                                         'Images/Floral/floral4.jpeg',               2,  true),
  ('Bridal Showcase',     '03 · Bridal',    'videos/Bridal2.mp4',                                          'Images/Bridal/bridal1.jpg',                3,  true),
  ('Chrome Luxe',         '04 · Chrome',    'videos/chrome3.mp4',                                          'Images/chrome/Chrome1.jpeg',               4,  true),
  ('Navratri Festive',    '05 · Navratri',  'videos/Navrati.mp4',                                          'Images/Festive/navrati vibe (1).JPG',      5,  true),
  ('Navratri Special',    '05b · Navratri', 'videos/Navrati2.mp4',                                         'Images/Festive/navrati vibe 1 (1).JPG',    6,  true),
  ('Sea View Chrome',     '06 · Chrome',    'videos/sea view.mp4',                                         'Images/chrome/mirror-chrome.jpg',          7,  true),
  ('Latest Drop',         '07 · New',       'videos/WhatsApp Video 2026-07-24 at 5.30.57 PM.mp4',          'Images/Festive/pink-chrome-oval.jpg',      8,  true),
  ('Behind the Craft',    '08 · Process',   'videos/WhatsApp Video 2026-07-24 at 5.31.11 PM.mp4',          'Images/CatEye/Cateye.jpg',                 9,  true),
  ('Polka Play',          '09 · Polka',     'videos/Polka.mp4',                                            'Images/Polka/Polka1.JPG',                  10, true),
  ('Polka Dots',          '10 · Polka',     'videos/polka (2).mp4',                                        'Images/Polka/Polka2.JPG',                  11, true)
) as v(title, subtitle, video_url, poster_url, sort_order, visible)
where not exists (select 1 from reels limit 1);

-- ── 3. ADD PHOTOS + VIDEO COLUMNS TO PRODUCTS TABLE ─────────────
alter table products
  add column if not exists photos jsonb not null default '[]',
  add column if not exists video  text;

update products
  set photos = jsonb_build_array(img)
  where img is not null
    and img <> ''
    and (photos = '[]' or photos is null);

-- ── 4. STORAGE BUCKET NOTE ───────────────────────────────────────
-- The 'product-images' bucket already exists.
-- Make sure it allows public reads so all getPublicUrl() calls work.
-- If it's private, add this policy in Supabase Dashboard → Storage:
--
--   create policy "Public read"
--     on storage.objects for select
--     using ( bucket_id = 'product-images' );
