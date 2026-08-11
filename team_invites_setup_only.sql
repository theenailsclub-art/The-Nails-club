-- Run this on its own if store_settings already exists in your Table
-- Editor but team_invites / team_members do not. Safe to re-run.

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
