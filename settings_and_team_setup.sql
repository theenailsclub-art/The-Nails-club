-- ════════════════════════════════════════════════════════════════
-- STORE SETTINGS + TEAM — makes the Settings page (store logo, owner
-- profile photo, store info) and team invites shared across every
-- device/browser, instead of living only in localStorage.
--
-- This is what was breaking "Invite Member": the invite link and the
-- team member list were only ever saved in the browser that generated
-- them, so when someone else opened the link on their own phone or
-- laptop, there was nothing there to check it against — it always
-- said "invalid or expired". Storing invites here fixes that.
--
-- Run this once in the Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════

-- ── STORE SETTINGS (single row) ──────────────────────────────────
create table if not exists store_settings (
  id                 smallint primary key default 1,
  store_name         text not null default 'The Nails Club',
  contact_email      text not null default 'hello@thenailsclub.in',
  logo_url           text,
  currency           text not null default 'INR (₹)',
  timezone           text not null default 'Asia/Kolkata (GMT+5:30)',
  owner_name         text not null default 'Nishi Rana',
  owner_email        text not null default 'thenailsclub@gmail.com',
  owner_avatar_url   text,
  updated_at         timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into store_settings (id, owner_name, owner_email)
values (1, 'Nishi Rana', 'thenailsclub@gmail.com')
on conflict (id) do nothing;

alter table store_settings enable row level security;
drop policy if exists "Admin dashboard can manage store settings" on store_settings;
create policy "Admin dashboard can manage store settings"
  on store_settings for all
  using (true)
  with check (true);

-- ── TEAM INVITES ──────────────────────────────────────────────────
create table if not exists team_invites (
  id           bigint generated always as identity primary key,
  token        text unique not null,
  name         text,
  role         text not null default 'editor' check (role in ('editor','viewer')),
  expiry       timestamptz not null,
  used         boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table team_invites enable row level security;
drop policy if exists "Admin dashboard can manage invites" on team_invites;
create policy "Admin dashboard can manage invites"
  on team_invites for all
  using (true)
  with check (true);

-- ── TEAM MEMBERS ──────────────────────────────────────────────────
create table if not exists team_members (
  id            bigint generated always as identity primary key,
  name          text,
  role          text not null default 'editor' check (role in ('editor','viewer')),
  invite_token  text,
  added_date    text,
  used_invite   boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table team_members enable row level security;
drop policy if exists "Admin dashboard can manage team members" on team_members;
create policy "Admin dashboard can manage team members"
  on team_members for all
  using (true)
  with check (true);

-- ── STORAGE ─────────────────────────────────────────────────────
-- No new bucket needed — the logo and profile photo uploads reuse the
-- existing public 'product-images' bucket (just under a 'branding/'
-- subfolder), so the same storage policies that already let the admin
-- dashboard upload product photos also cover these.
