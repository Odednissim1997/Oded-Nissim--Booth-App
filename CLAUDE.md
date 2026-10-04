# Booth Budget App — Project Context

## What This Is
A shared apartment budget tracking app for two roommates: **Oded** and **Tomer**, covering Dec 2026 – Aug 2027. Built for a Chicago Booth student housing situation.

## Tech Stack
- **Next.js 14** (App Router, client components)
- **Supabase** (Postgres + Auth, Row Level Security)
- **Tailwind CSS** (dark mode via `class` strategy)
- **TypeScript**
- **Vercel** (auto-deploys from `main` branch)
- **recharts** (charts on the Period page)

## Git
- Production branch: `main`
- Push to `main` → Vercel auto-deploys
- Feature work: commit directly to `main` (small team, no PRs needed)

## Database Tables
- `categories` — budget categories (type: `shared_fixed` | `personal` | `one_time`)
- `expenses` — individual expense entries (amount_usd, month_key, category_id, entered_by)
- `month_splits` — Oded/Tomer cost split per month (oded_pct + tomer_pct)
- `settings` — global settings (usd_to_ils exchange rate)
- `one_time_budgets` — budget amounts for one-time categories per month

## Cost Split Logic
- Dec 2026 – Feb 2027: Oded 60% / Tomer 40%
- Mar 2027 – Aug 2027: 50% / 50%
- Personal categories (health insurance): 100% to the owner
- Configurable via Settings page sliders

## Users
- Login via Supabase Auth (email/password)
- `userIdentifier` is derived from email: `NEXT_PUBLIC_ODED_EMAIL` → `'oded'`, otherwise → `'tomer'`
- Personal categories filtered by `owner === userIdentifier`

## App Pages
- `/` — Login
- `/dashboard` — Monthly budget overview with BudgetCards, user totals, month switcher
- `/expenses/add` — Add expense form (grouped by Regular / Fixed / Health Insurance / One-time)
- `/expenses` — Expense history with month/category filters and delete
- `/period` — Period summary: select month range, see totals + bar charts (Budget vs Actual, Oded vs Tomer)
- `/settings` — Exchange rate, cost splits, monthly budgets, one-time budgets, add/delete categories
- `/summary` — Full period table with CSV export

## Color Thresholds (progress bars & borders)
- 0–74%: gray
- 75–99%: yellow
- 100%: blue
- >100%: red

## Environment Variables (required in Vercel)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_ODED_EMAIL
NEXT_PUBLIC_TOMER_EMAIL
```

## Key Files
- `src/types/index.ts` — all TypeScript types
- `src/lib/calculations.ts` — budget math (getCategoryBudget, getUserShare, buildMonthSummaries, buildUserTotals)
- `src/lib/constants.ts` — MONTHS array (Dec 2026 – Aug 2027), getCurrentMonthKey
- `src/contexts/AuthContext.tsx` — Supabase auth + userIdentifier
- `src/components/BottomNav.tsx` — bottom tab navigation (5 tabs)
- `src/components/budget/BudgetCard.tsx` — individual category card

## Development Notes
- All UI is in English
- `eslint: { ignoreDuringBuilds: true }` in next.config.mjs (avoids CI failures on lint warnings)
- Use `Array.from(new Set(...))` not `[...new Set(...)]` (TypeScript downlevelIteration issue)
- Supabase uses new key format: "Publishable key" (not legacy anon key)
