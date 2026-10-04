'use client';
import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import { MONTHS } from '@/lib/constants';
import { buildMonthSummaries, buildUserTotals, fmt$, fmtILS } from '@/lib/calculations';
import type { Category, Expense, MonthSplit, Settings, OneTimeBudget } from '@/types';
import { Download, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SummaryPage() {
  return (
    <AuthGuard>
      <PeriodSummary />
    </AuthGuard>
  );
}

function PeriodSummary() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splits, setSplits] = useState<MonthSplit[]>([]);
  const [settings, setSettings] = useState<Settings>({ id: 1, usd_to_ils: 3.05, updated_at: '' });
  const [oneTimeBudgets, setOneTimeBudgets] = useState<OneTimeBudget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('categories').select('*').order('type').order('name'),
      supabase.from('expenses').select('*'),
      supabase.from('month_splits').select('*'),
      supabase.from('settings').select('*').single(),
      supabase.from('one_time_budgets').select('*'),
    ]).then(([catRes, expRes, splitRes, setRes, otbRes]) => {
      if (catRes.data) setCategories(catRes.data);
      if (expRes.data) setExpenses(expRes.data);
      if (splitRes.data) setSplits(splitRes.data);
      if (setRes.data) setSettings(setRes.data);
      if (otbRes.data) setOneTimeBudgets(otbRes.data);
      setLoading(false);
    });
  }, []);

  const rate = settings.usd_to_ils;

  const allSplitMap = Object.fromEntries(splits.map((s) => [s.month_key, s]));

  const getSplit = (monthKey: string): MonthSplit =>
    allSplitMap[monthKey] ?? { month_key: monthKey, oded_pct: 0.5, tomer_pct: 0.5 };

  const exportCSV = () => {
    const rows: string[] = [];
    rows.push('Month,Category,Type,Budget USD,Actual USD,Remaining USD,Budget ILS,Actual ILS');

    for (const m of MONTHS) {
      const split = getSplit(m.key);
      const summaries = buildMonthSummaries(categories, expenses, split, settings, m.key, oneTimeBudgets);
      for (const s of summaries) {
        rows.push(
          [
            m.label,
            s.category.name,
            s.category.type,
            s.budget_usd.toFixed(2),
            s.actual_usd.toFixed(2),
            s.remaining_usd.toFixed(2),
            (s.budget_usd * rate).toFixed(2),
            (s.actual_usd * rate).toFixed(2),
          ].join(','),
        );
      }
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'budget-summary.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const grandData = MONTHS.map((m) => {
    const split = getSplit(m.key);
    const summaries = buildMonthSummaries(categories, expenses, split, settings, m.key, oneTimeBudgets);
    const userTotals = buildUserTotals(summaries, split, settings);
    const totalBudget = summaries.reduce((s, x) => s + x.budget_usd, 0);
    const totalActual = summaries.reduce((s, x) => s + x.actual_usd, 0);
    return {
      month: m,
      summaries,
      userTotals,
      totalBudget,
      totalActual,
    };
  });

  const grandTotalBudget = grandData.reduce((s, d) => s + d.totalBudget, 0);
  const grandTotalActual = grandData.reduce((s, d) => s + d.totalActual, 0);
  const odedTotal = grandData.reduce((s, d) => s + (d.userTotals.find((t) => t.user === 'oded')?.actual_usd ?? 0), 0);
  const tomerTotal = grandData.reduce((s, d) => s + (d.userTotals.find((t) => t.user === 'tomer')?.actual_usd ?? 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <header className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="text-blue-600 dark:text-blue-400">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-gray-800 dark:text-gray-100">Period Summary</h1>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          CSV
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
          {/* Grand totals */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 mb-1">🧑 Oded Total</p>
              <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{fmt$(odedTotal)}</p>
              <p className="text-xs text-gray-400">{fmtILS(odedTotal * rate)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 mb-1">👤 Tomer Total</p>
              <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{fmt$(tomerTotal)}</p>
              <p className="text-xs text-gray-400">{fmtILS(tomerTotal * rate)}</p>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              Grand Total: {fmt$(grandTotalActual)} / {fmt$(grandTotalBudget)} budget
            </p>
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">
              {fmtILS(grandTotalActual * rate)} / {fmtILS(grandTotalBudget * rate)}
            </p>
          </div>

          {/* Per-month breakdown */}
          {grandData.map(({ month, summaries, userTotals, totalBudget, totalActual }) => (
            <div key={month.key} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{month.label}</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {fmt$(totalActual)} / {fmt$(totalBudget)}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                      <th className="text-right px-3 py-2 font-medium">Category</th>
                      <th className="text-right px-2 py-2 font-medium">Budget $</th>
                      <th className="text-right px-2 py-2 font-medium">Actual $</th>
                      <th className="text-right px-2 py-2 font-medium">Left $</th>
                      <th className="text-right px-2 py-2 font-medium">Budget ₪</th>
                      <th className="text-right px-2 py-2 font-medium">Actual ₪</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaries.map((s) => (
                      <tr
                        key={s.category.id}
                        className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300 font-medium">
                          {s.category.name}
                        </td>
                        <td className="px-2 py-2 text-gray-600 dark:text-gray-400 text-right">{fmt$(s.budget_usd)}</td>
                        <td className="px-2 py-2 text-gray-600 dark:text-gray-400 text-right">{fmt$(s.actual_usd)}</td>
                        <td
                          className={`px-2 py-2 text-right ${s.remaining_usd < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}
                        >
                          {fmt$(s.remaining_usd)}
                        </td>
                        <td className="px-2 py-2 text-gray-500 dark:text-gray-400 text-right">{fmtILS(s.budget_ils)}</td>
                        <td className="px-2 py-2 text-gray-500 dark:text-gray-400 text-right">{fmtILS(s.actual_ils)}</td>
                      </tr>
                    ))}
                    {/* User subtotals */}
                    {userTotals.map((t) => (
                      <tr key={t.user} className="bg-blue-50/50 dark:bg-blue-900/20 font-medium">
                        <td className="px-3 py-1.5 text-blue-700 dark:text-blue-300 text-xs capitalize">
                          {t.user === 'oded' ? '🧑' : '👤'} {t.user}
                        </td>
                        <td className="px-2 py-1.5 text-right text-blue-600 dark:text-blue-400">{fmt$(t.budget_usd)}</td>
                        <td className="px-2 py-1.5 text-right text-blue-600 dark:text-blue-400">{fmt$(t.actual_usd)}</td>
                        <td className="px-2 py-1.5 text-right text-blue-600 dark:text-blue-400">
                          {fmt$(t.budget_usd - t.actual_usd)}
                        </td>
                        <td className="px-2 py-1.5 text-right text-blue-500 dark:text-blue-400">{fmtILS(t.budget_ils)}</td>
                        <td className="px-2 py-1.5 text-right text-blue-500 dark:text-blue-400">{fmtILS(t.actual_ils)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </main>
      )}

      <BottomNav />
    </div>
  );
}
