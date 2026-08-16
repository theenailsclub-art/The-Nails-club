-- ════════════════════════════════════════════════════════════════
-- CUSTOMERS (real accounts) — replaces the old sign up / sign in
-- system that only stored accounts in localStorage:
--
--   BEFORE: accounts lived in the visitor's own browser only. An
--   account created on a phone did not exist on a laptop, and the
--   admin dashboard's "Customers" page showed 6 hardcoded sample
--   rows that had nothing to do with real signups.
--
--   AFTER: the website's Sign In / Create Account modal now calls
--   real Supabase Auth (sb.auth.signUp / signInWithPassword), so an
--   account works from any device — the password check happens on
--   Supabase's server. This table stores the public profile (name,
--   email, joined date) for each signed-up user, mirroring the
--   private auth.users record, so the admin dashboard can list real
--   customers. It never stores a password — Supabase Auth handles
--   passwords entirely, hashed, in its own private auth.users table.
--
-- Run this once in the Supabase SQL editor.
--
-- NOTE: like every other table in this project (products, orders,
-- store_settings, team_members...), RLS here is fully open to the
-- publishable/anon key — the same trust model already used
-- everywhere else in this app. That means email addresses in this
-- table are readable by anyone who has the site's publishable key,
-- same as customer names/addresses already are in the `orders`
-- table. If you want this locked down further later, tighten the
-- policy below to `auth.uid() = id` for selects.
-- ════════════════════════════════════════════════════════════════

create table if not exists customers (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  email       text not null,
  created_at  timestamptz not null default now()
);

alter table customers enable row level security;

drop policy if exists "Admin dashboard and signup can manage customers" on customers;
create policy "Admin dashboard and signup can manage customers"
  on customers for all
  using (true)
  with check (true);

-- ── ONE-TIME PROJECT SETTING TO CHECK ────────────────────────────
-- In Supabase Dashboard → Authentication → Providers → Email, check
-- whether "Confirm email" is ON. If it is, a new signup can't sign
-- in until they click the confirmation link in their email — the
-- website's sign-up form already handles this (it shows "check your
-- email to confirm" instead of silently failing), but you may want
-- to turn confirmation OFF for a smoother first-order experience,
-- since customers are placing orders over WhatsApp/Instagram anyway
-- and a confirmation step adds friction right before checkout.
