# Budget App – Oded & Tomer 🏠

A mobile-first shared apartment budget tracker for the period **Dec 2026 – Aug 2027**.

## Features

- 🔐 Email/password login (Oded & Tomer only)
- 📊 Monthly dashboard with budget vs. actual per category
- 💵 USD + ₪ ILS dual-currency display with live exchange rate
- 🟢🟡🔴 Color-coded budget health (green/yellow/red)
- ➕ Add expenses with category and description
- 📜 Full expense history with filtering & delete
- ⚙️ Settings: exchange rate, cost-split %, one-time budgets
- 📅 Period summary table (all 9 months) with CSV export
- 🌙 Dark/light mode toggle
- 📱 Mobile-first design with bottom navigation bar
- 🔤 Hebrew (RTL) font support via Rubik

---

## Setup

### 1. Clone & install

```bash
git clone <repo-url>
cd Oded-Nissim--Booth-App
npm install
```

### 2. Create `.env.local`

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Get values from **Supabase → Project Settings → API**.

### 3. Set up the database

In the **Supabase SQL editor**, run the full contents of `supabase/seed.sql`.  
This creates all tables, RLS policies, and seeds the initial data.

### 4. Create user accounts

In **Supabase → Authentication → Users**, click **Add user** and create:

| Name  | Email                      | Password |
|-------|----------------------------|----------|
| Oded  | oded@yourdomain.com        | (set)    |
| Tomer | tomer@yourdomain.com       | (set)    |

Then update `NEXT_PUBLIC_ODED_EMAIL` and `NEXT_PUBLIC_TOMER_EMAIL` in `.env.local` to match.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add environment variables in Vercel → Settings → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_ODED_EMAIL`
   - `NEXT_PUBLIC_TOMER_EMAIL`
4. Deploy!

---

## Budget Structure

| Period | Oded | Tomer |
|--------|------|-------|
| Dec 2026 – Feb 2027 | 60% | 40% |
| Mar 2027 – Aug 2027 | 50% | 50% |

### Shared Monthly Fixed ($)
| Category | Budget |
|----------|--------|
| Rent | $2,255 |
| Electricity | $50 |
| Groceries | $800 |
| Leisure | $500 |

### Personal (100% each)
- Oded – Health Insurance: $411/month
- Tomer – Health Insurance: $411/month

### One-Time
- Furniture & Setup: $2,000 (Dec 2026)
- Winter Vacation: TBD (Jan 2027) – set in Settings
- Spring Break: TBD (Mar 2027) – set in Settings

---

## Updating Settings

Any authenticated user can update:
- **Exchange rate** → Settings page → "1 USD = X ILS"
- **Split percentages** → Settings page → sliders per month
- **One-time budgets** → Settings page → enter amounts for vacations
