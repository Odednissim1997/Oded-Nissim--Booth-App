-- ============================================================
-- Budget App – Oded & Tomer | Database Schema + Seed Data
-- Run this in the Supabase SQL editor
-- ============================================================

-- ----------------------------------------------------------------
-- 1. TABLES
-- ----------------------------------------------------------------

-- Shared settings (one row, id = 1)
create table if not exists settings (
  id int primary key default 1,
  usd_to_ils numeric not null default 3.05,
  updated_at timestamptz not null default now()
);

-- Monthly cost-split configuration
create table if not exists month_splits (
  month_key text primary key,
  oded_pct  numeric not null default 0.5 check (oded_pct >= 0 and oded_pct <= 1),
  tomer_pct numeric generated always as (1 - oded_pct) stored
);

-- Budget categories
create table if not exists categories (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  type                text not null check (type in ('shared_fixed','personal','one_time')),
  owner               text          check (owner in ('oded','tomer','shared')),
  monthly_budget_usd  numeric,
  one_time_month_key  text
);

-- Actual expenses entered by users
create table if not exists expenses (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  month_key   text not null,
  amount_usd  numeric not null check (amount_usd > 0),
  description text,
  entered_by  text not null,
  created_at  timestamptz not null default now()
);

-- One-time expense budgets (editable)
create table if not exists one_time_budgets (
  month_key   text not null,
  category_id uuid not null references categories(id) on delete cascade,
  budget_usd  numeric,
  primary key (month_key, category_id)
);

-- ----------------------------------------------------------------
-- 2. ROW-LEVEL SECURITY
-- ----------------------------------------------------------------

alter table settings          enable row level security;
alter table month_splits      enable row level security;
alter table categories        enable row level security;
alter table expenses          enable row level security;
alter table one_time_budgets  enable row level security;

-- Allow authenticated users full access to all tables
create policy "auth_all_settings"         on settings         for all to authenticated using (true) with check (true);
create policy "auth_all_month_splits"     on month_splits     for all to authenticated using (true) with check (true);
create policy "auth_all_categories"       on categories       for all to authenticated using (true) with check (true);
create policy "auth_all_expenses"         on expenses         for all to authenticated using (true) with check (true);
create policy "auth_all_one_time_budgets" on one_time_budgets for all to authenticated using (true) with check (true);

-- ----------------------------------------------------------------
-- 3. SEED DATA
-- ----------------------------------------------------------------

-- Settings: default exchange rate
insert into settings (id, usd_to_ils) values (1, 3.05)
  on conflict (id) do update set usd_to_ils = excluded.usd_to_ils;

-- Month splits
insert into month_splits (month_key, oded_pct) values
  ('2026-12', 0.6),
  ('2027-01', 0.6),
  ('2027-02', 0.6),
  ('2027-03', 0.5),
  ('2027-04', 0.5),
  ('2027-05', 0.5),
  ('2027-06', 0.5),
  ('2027-07', 0.5),
  ('2027-08', 0.5)
on conflict (month_key) do update set oded_pct = excluded.oded_pct;

-- Categories (using stable UUIDs so seed is idempotent)
insert into categories (id, name, type, owner, monthly_budget_usd, one_time_month_key) values
  -- Shared fixed monthly
  ('11111111-1111-1111-1111-000000000001', 'Rent',                         'shared_fixed', 'shared', 2255,   null),
  ('11111111-1111-1111-1111-000000000002', 'Electricity',                  'shared_fixed', 'shared',   50,   null),
  ('11111111-1111-1111-1111-000000000003', 'Groceries',                    'shared_fixed', 'shared',  800,   null),
  ('11111111-1111-1111-1111-000000000004', 'Leisure (restaurants + shopping)', 'shared_fixed', 'shared', 500, null),

  -- Personal (each pays 100% of their own)
  ('11111111-1111-1111-1111-000000000005', 'Oded – Health Insurance',      'personal',    'oded',  411.11, null),
  ('11111111-1111-1111-1111-000000000006', 'Tomer – Health Insurance',     'personal',    'tomer', 411.11, null),

  -- One-time expenses
  ('11111111-1111-1111-1111-000000000007', 'Furniture & Setup',            'one_time',    'shared', null, '2026-12'),
  ('11111111-1111-1111-1111-000000000008', 'Winter Vacation',              'one_time',    'shared', null, '2027-01'),
  ('11111111-1111-1111-1111-000000000009', 'Spring Break',                 'one_time',    'shared', null, '2027-03')
on conflict (id) do update
  set name               = excluded.name,
      type               = excluded.type,
      owner              = excluded.owner,
      monthly_budget_usd = excluded.monthly_budget_usd,
      one_time_month_key = excluded.one_time_month_key;

-- One-time budgets (Furniture has a set budget; vacations are TBD)
insert into one_time_budgets (month_key, category_id, budget_usd) values
  ('2026-12', '11111111-1111-1111-1111-000000000007', 2000),
  ('2027-01', '11111111-1111-1111-1111-000000000008', null),
  ('2027-03', '11111111-1111-1111-1111-000000000009', null)
on conflict (month_key, category_id) do update set budget_usd = excluded.budget_usd;
