'use client';
import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import { MONTHS } from '@/lib/constants';
import { getCategoryBudget, getUserShare, fmt$, fmtILS } from '@/lib/calculations';
import type { Category, Expense, MonthSplit, Settings, OneTimeBudget } from '@/types';

export default function PeriodPage() {
  return (
    <AuthGuard>
      <Period />
    </AuthGuard>
  );
}

function Period() {
  const [fromKey, setFromKey] = useState(MONTHS[0].key);
  const [toKey, setToKey] = useState(MONTHS[MONTHS.length - 1].key);

  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splits, setSplits] = useState<MonthSplit[]>([]);
  const [settings, setSettings] = useState<Settings>({ id: 1, usd_to_ils: 3.05, updated_at: '' });
  const [oneTimeBudgets, setOneTimeBudgets] = useState<OneTimeBudget[]>([]);
  const [loading, setLoading] = useState(true);

  const monthsInRange = MONTHS.filter((m) => m.key >= fromKey && m.key <= toKey);

  const fetchData = useCallback(async () => {
    if (monthsInRange.length === 0) return;
    setLoading(true);
    const [catRes, expRes, splitRes, setRes, otbRes] = await Promise.all([
      supabase.from('categories').select('*').order('type').order('name'),
      supabase.from('expenses').select('*').in('month_key', monthsInRange.map((m) => m.key)),
      supabase.from('month_splits').select('*'),
      supabase.from('settings').select('*').single(),
      supabase.from('one_time_budgets').select('*'),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (expRes.data) setExpenses(expRes.data);
    if (splitRes.data) setSplits(splitRes.data);
    if (setRes.data) setSettings(setRes.data);
    if (otbRes.data) setOneTimeBudgets(otbRes.data);
    setLoading(false);
  }, [fromKey, toKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const rate = settings.usd_to_ils;

  const getSplit = (monthKey: string): MonthSplit =>
    splits.find((s) => s.month_key === monthKey) ?? { month_key: monthKey, oded_pct: 0.5, tomer_pct: 0.5 };

  const catSummaries = categories
    .filter((cat) => {
      if (cat.type === 'one_time') return monthsInRange.some((m) => m.key === cat.one_time_month_key);
      return true;
    })
    .map((cat) => {
      let budget_usd = 0;
      let actual_usd = 0;
      for (const m of monthsInRange) {
        budget_usd += getCategoryBudget(cat, m.key, oneTimeBudgets);
        actual_usd += expenses
          .filter((e) => e.category_id === cat.id && e.month_key === m.key)
          .reduce((s, e) => s + e.amount_usd, 0);
      }
      return { cat, budget_usd, actual_usd, remaining_usd: budget_usd - actual_usd };
    })
    .filter((s) => s.budget_usd > 0 || s.actual_usd > 0);

  const userTotals = (['oded', 'tomer'] as const).map((user) => {
    let budget = 0;
    let actual = 0;
    for (const m of monthsInRange) {
      const split = getSplit(m.key);
      for (const cat of categories) {
        const catBudget = getCategoryBudget(cat, m.key, oneTimeBudgets);
        const catActual = expenses
          .filter((e) => e.category_id === cat.id && e.month_key === m.key)
          .reduce((s, e) => s + e.amount_usd, 0);
        budget += getUserShare(catBudget, user, cat, split);
        actual += getUserShare(catActual, user, cat, split);
      }
    }
    return { user, budget, actual, remaining: budget - actual };
  });

  const grandBudget = catSummaries.reduce((s, c) => s + c.budget_usd, 0);
  const grandActual = catSummaries.reduce((s, c) => s + c.actual_usd, 0);
  const grandRemaining = grandBudget - grandActual;
  const pct = grandBudget > 0 ? (grandActual / grandBudget) * 100 : 0;

  const bannerColor =
    pct > 100
      ? 'bg-red-50 dark:bg-red-900/30 border-red-400'
      : pct >= 75
        ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-400'
        : 'bg-green-50 dark:bg-green-900/30 border-green-400';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <header className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40 px-4 py-3">
        <h1 className="font-bold text-gray-800 dark:text-gray-100 text-center">סיכום תקופה</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Range selectors */}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">מ-</label>
            <select
              value={fromKey}
              onChange={(e) => {
                setFromKey(e.target.value);
                if (e.target.value > toKey) setToKey(e.target.value);
              }}
              className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MONTHS.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>
          <span className="text-gray-400 pb-2">—</span>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">עד-</label>
            <select
              value={toKey}
              onChange={(e) => setToKey(e.target.value)}
              className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MONTHS.filter((m) => m.key >= fromKey).map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            {/* Grand total banner */}
            <div className={`rounded-2xl p-4 border-2 ${bannerColor}`}>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center">
                {monthsInRange.length} חודשים · {pct.toFixed(0)}% מהתקציב
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">תקציב</p>
                  <p className="font-bold text-gray-800 dark:text-gray-100">{fmt$(grandBudget)}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{fmtILS(grandBudget * rate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">בפועל</p>
                  <p className="font-bold text-gray-800 dark:text-gray-100">{fmt$(grandActual)}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{fmtILS(grandActual * rate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">נותר</p>
                  <p className={`font-bold ${grandRemaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {fmt$(grandRemaining)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{fmtILS(grandRemaining * rate)}</p>
                </div>
              </div>
            </div>

            {/* User totals */}
            <div className="grid grid-cols-2 gap-3">
              {userTotals.map((t) => (
                <div
                  key={t.user}
                  className="rounded-xl p-3 bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                    {t.user === 'oded' ? '🧑 Oded' : '👤 Tomer'}
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">תקציב</span>
                      <div className="text-right">
                        <p className="font-medium text-gray-700 dark:text-gray-300">{fmt$(t.budget)}</p>
                        <p className="text-gray-400">{fmtILS(t.budget * rate)}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">בפועל</span>
                      <div className="text-right">
                        <p className="font-bold text-gray-800 dark:text-gray-100">{fmt$(t.actual)}</p>
                        <p className="text-gray-400">{fmtILS(t.actual * rate)}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs border-t border-gray-100 dark:border-gray-700 pt-1.5">
                      <span className="text-gray-400">נותר</span>
                      <div className="text-right">
                        <p className={`font-bold ${t.remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {fmt$(t.remaining)}
                        </p>
                        <p className="text-gray-400">{fmtILS(t.remaining * rate)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Per-category breakdown */}
            <div className="space-y-2">
              <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">קטגוריות</h2>
              {catSummaries.map(({ cat, budget_usd, actual_usd, remaining_usd }) => {
                const pctCat = budget_usd > 0 ? (actual_usd / budget_usd) * 100 : 0;
                const borderColor =
                  pctCat > 100
                    ? 'border-red-400 dark:border-red-600'
                    : pctCat >= 100
                      ? 'border-blue-400 dark:border-blue-500'
                      : pctCat >= 75
                        ? 'border-yellow-400 dark:border-yellow-500'
                        : 'border-gray-200 dark:border-gray-600';
                const barColor =
                  pctCat > 100 ? 'bg-red-500' : pctCat >= 100 ? 'bg-blue-500' : pctCat >= 75 ? 'bg-yellow-400' : 'bg-green-400';

                return (
                  <div key={cat.id} className={`rounded-xl p-3 bg-white dark:bg-gray-800 border-2 ${borderColor} shadow-sm`}>
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{cat.name}</p>
                      <span className="text-xs text-gray-400">{budget_usd > 0 ? `${pctCat.toFixed(0)}%` : '—'}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${Math.min(pctCat, 100)}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-center text-xs">
                      <div>
                        <p className="text-gray-400 dark:text-gray-500">תקציב</p>
                        <p className="font-medium text-gray-700 dark:text-gray-300">{fmt$(budget_usd)}</p>
                        <p className="text-gray-400 dark:text-gray-500">{fmtILS(budget_usd * rate)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 dark:text-gray-500">בפועל</p>
                        <p className="font-medium text-gray-800 dark:text-gray-100">{fmt$(actual_usd)}</p>
                        <p className="text-gray-400 dark:text-gray-500">{fmtILS(actual_usd * rate)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 dark:text-gray-500">נותר</p>
                        <p className={`font-medium ${remaining_usd < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'}`}>
                          {fmt$(remaining_usd)}
                        </p>
                        <p className="text-gray-400 dark:text-gray-500">{fmtILS(remaining_usd * rate)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
