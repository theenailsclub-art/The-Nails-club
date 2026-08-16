-- ════════════════════════════════════════════════════════════════
-- ADMIN DASHBOARD PASSWORD — moves the dashboard's own login gate
-- (the single shared password everyone types to get into the admin
-- dashboard) out of localStorage and into Supabase.
--
--   BEFORE: the password hash lived in the browser's localStorage
--   (key 'tnc_admin_hash'). Changing it in Settings → Security only
--   changed it on that one browser/device — every other device kept
--   expecting the old password.
--
--   AFTER: the hash lives in this single-row table. Change it once,
--   from any device, and every device (and every team member, since
--   they all share this one password) picks it up immediately.
--
-- NOTE: this is NOT the same thing as customer accounts. Customer
-- passwords are handled entirely by Supabase Auth (see
-- customers_auth_setup.sql) and are never stored here or anywhere
-- readable — this table only holds the hash for the dashboard's own
-- shared gate password.
--
-- Run this once in the Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════

create table if not exists admin_auth (
  id             smallint primary key default 1,
  password_hash  text not null,
  updated_at     timestamptz not null default now(),
  constraint single_row check (id = 1)
);

-- Seeds the CURRENT default password ('NailsClub@Admin2025') so
-- nothing changes for you on first run — change it from
-- Settings → Security whenever you're ready.
insert into admin_auth (id, password_hash)
values (1, 'e75e3403d4c3cece2841f014ab67c64cb3be9a9a8fc4f757b6f6730b50e0ea85')
on conflict (id) do nothing;

alter table admin_auth enable row level security;

drop policy if exists "Admin dashboard can manage its own password" on admin_auth;

-- Same trust model as every other table in this project: the admin
-- dashboard uses the publishable key, gated by this very password
-- screen, so it needs read/write access. The storefront never reads
-- from this table.
create policy "Admin dashboard can manage its own password"
  on admin_auth for all
  using (true)
  with check (true);
