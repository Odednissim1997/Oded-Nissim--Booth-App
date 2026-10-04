'use client';
import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import MonthSwitcher from '@/components/budget/MonthSwitcher';
import BudgetCard from '@/components/budget/BudgetCard';
import { supabase } from '@/lib/supabase';
import { getCurrentMonthKey } from '@/lib/constants';
import { buildMonthSummaries, buildUserTotals, fmt$, fmtILS } from '@/lib/calculations';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { Category, Expense, MonthSplit, Settings, OneTimeBudget, MonthlyBudgetSummary, UserMonthlyTotal } from '@/types';
import { Moon, Sun, BarChart2, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}

function Dashboard() {
  const { userIdentifier, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey());

  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splits, setSplits] = useState<MonthSplit[]>([]);
  const [settings, setSettings] = useState<Settings>({ id: 1, usd_to_ils: 3.05, updated_at: '' });
  const [oneTimeBudgets, setOneTimeBudgets] = useState<OneTimeBudget[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [catRes, expRes, splitRes, setRes, otbRes] = await Promise.all([
      supabase.from('categories').select('*').order('type').order('name'),
      supabase.from('expenses').select('*').eq('month_key', monthKey),
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
  }, [monthKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentSplit: MonthSplit =
    splits.find((s) => s.month_key === monthKey) ?? { month_key: monthKey, oded_pct: 0.5, tomer_pct: 0.5 };

  const summaries: MonthlyBudgetSummary[] = buildMonthSummaries(
    categories,
    expenses,
    currentSplit,
    settings,
    monthKey,
    oneTimeBudgets,
  );

  const userTotals: UserMonthlyTotal[] = buildUserTotals(summaries, currentSplit, settings);

  const grandBudget = summaries.reduce((s, m) => s + m.budget_usd, 0);
  const grandActual = summaries.reduce((s, m) => s + m.actual_usd, 0);
  const overBudget = grandActual > grandBudget;
  const pctOverall = grandBudget > 0 ? (grandActual / grandBudget) * 100 : 0;

  const rate = settings.usd_to_ils;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800 dark:text-gray-100">🏠 Budget</span>
            {userIdentifier && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium capitalize">
                {userIdentifier}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/summary"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <BarChart2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Link>
            <button
              onClick={toggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={signOut}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Month Switcher */}
        <div className="flex justify-center">
          <MonthSwitcher currentKey={monthKey} onChange={setMonthKey} />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            {/* Status banner */}
            <div
              className={`rounded-2xl p-4 flex items-center gap-3 ${
                overBudget
                  ? 'bg-red-50 dark:bg-red-900/30 border-2 border-red-400'
                  : pctOverall >= 80
                    ? 'bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-400'
                    : 'bg-green-50 dark:bg-green-900/30 border-2 border-green-400'
              }`}
            >
              <span className="text-3xl">{overBudget ? '⚠️' : '✅'}</span>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                  {overBudget ? 'Over budget' : 'On budget'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {fmt$(grandActual)} / {fmt$(grandBudget)} ({pctOverall.toFixed(0)}%)
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {fmtILS(grandActual * rate)} / {fmtILS(grandBudget * rate)}
                </p>
              </div>
            </div>

            {/* User totals */}
            <div className="grid grid-cols-2 gap-3">
              {userTotals.map((t) => (
                <div
                  key={t.user}
                  className="rounded-xl p-3 bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize font-medium mb-1">
                    {t.user === 'oded' ? '🧑 Oded' : '👤 Tomer'}
                  </p>
                  <p className="font-bold text-gray-800 dark:text-gray-100 text-base">{fmt$(t.actual_usd)}</p>
                  <p className="text-xs text-gray-500">{fmtILS(t.actual_ils)}</p>
                  <p className="text-xs text-gray-400 mt-1">Budget: {fmt$(t.budget_usd)}</p>
                  <p className="text-xs text-gray-400">{fmtILS(t.budget_ils)}</p>
                </div>
              ))}
            </div>

            {/* Category cards */}
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Categories</h2>
              {summaries.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">No budget data for this month</p>
              ) : (
                summaries.map((s) => (
                  <BudgetCard key={s.category.id} summary={s} rate={rate} />
                ))
              )}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
