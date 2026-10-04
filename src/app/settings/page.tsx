'use client';
import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import { MONTHS, getMonthLabel } from '@/lib/constants';
import type { Settings, MonthSplit, Category, OneTimeBudget } from '@/types';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsPanel />
    </AuthGuard>
  );
}

function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>({ id: 1, usd_to_ils: 3.05, updated_at: '' });
  const [splits, setSplits] = useState<MonthSplit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [oneTimeBudgets, setOneTimeBudgets] = useState<OneTimeBudget[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('settings').select('*').single(),
      supabase.from('month_splits').select('*'),
      supabase.from('categories').select('*').order('name'),
      supabase.from('one_time_budgets').select('*'),
    ]).then(([setRes, splitRes, catRes, otbRes]) => {
      if (setRes.data) setSettings(setRes.data);
      if (splitRes.data) setSplits(splitRes.data);
      if (catRes.data) setCategories(catRes.data);
      if (otbRes.data) setOneTimeBudgets(otbRes.data);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);

    await Promise.all([
      supabase
        .from('settings')
        .upsert({ id: 1, usd_to_ils: settings.usd_to_ils, updated_at: new Date().toISOString() }),
      ...splits.map((s) =>
        supabase.from('month_splits').upsert({
          month_key: s.month_key,
          oded_pct: s.oded_pct,
          tomer_pct: 1 - s.oded_pct,
        }),
      ),
      ...oneTimeBudgets.map((b) =>
        supabase.from('one_time_budgets').upsert({
          month_key: b.month_key,
          category_id: b.category_id,
          budget_usd: b.budget_usd,
        }),
      ),
      ...categories.map((c) =>
        supabase.from('categories').update({ monthly_budget_usd: c.monthly_budget_usd }).eq('id', c.id),
      ),
    ]);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSplit = (monthKey: string, odenPct: number) => {
    setSplits((prev) =>
      prev.map((s) =>
        s.month_key === monthKey ? { ...s, oded_pct: odenPct, tomer_pct: 1 - odenPct } : s,
      ),
    );
  };

  const updateCatBudget = (id: string, budget: number) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, monthly_budget_usd: budget } : c)),
    );
  };

  const updateOTBudget = (monthKey: string, catId: string, budget: number) => {
    setOneTimeBudgets((prev) => {
      const exists = prev.find((b) => b.month_key === monthKey && b.category_id === catId);
      if (exists) {
        return prev.map((b) =>
          b.month_key === monthKey && b.category_id === catId ? { ...b, budget_usd: budget } : b,
        );
      }
      return [...prev, { month_key: monthKey, category_id: catId, budget_usd: budget }];
    });
  };

  const sharedFixedCats = categories.filter((c) => c.type === 'shared_fixed');
  const oneTimeCats = categories.filter((c) => c.type === 'one_time');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <header className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40 px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-gray-800 dark:text-gray-100">Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save All'}
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <main className="max-w-lg mx-auto px-4 py-4 space-y-6">
          {/* Exchange Rate */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Exchange Rate</h2>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">1 USD =</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={settings.usd_to_ils}
                onChange={(e) => setSettings((prev) => ({ ...prev, usd_to_ils: parseFloat(e.target.value) || 3.05 }))}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <label className="text-sm text-gray-600 dark:text-gray-400">ILS</label>
            </div>
          </section>

          {/* Monthly Splits */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Cost Split % per Month</h2>
            <div className="space-y-3">
              {MONTHS.map((m) => {
                const s = splits.find((sp) => sp.month_key === m.key);
                const odenPct = s ? Math.round(s.oded_pct * 100) : 50;
                return (
                  <div key={m.key} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 dark:text-gray-300 w-20 flex-shrink-0">{m.label}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-8">O:{odenPct}%</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={odenPct}
                        onChange={(e) => updateSplit(m.key, parseInt(e.target.value) / 100)}
                        className="flex-1 accent-blue-600"
                      />
                      <span className="text-xs text-gray-500 w-8">T:{100 - odenPct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Monthly Fixed Budgets */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Monthly Fixed Budgets ($)</h2>
            <div className="space-y-3">
              {sharedFixedCats.map((cat) => (
                <div key={cat.id} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{cat.name}</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={cat.monthly_budget_usd ?? 0}
                    onChange={(e) => updateCatBudget(cat.id, parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* One-Time Budgets */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">One-Time Expense Budgets ($)</h2>
            <div className="space-y-3">
              {oneTimeCats.map((cat) => {
                const otb = oneTimeBudgets.find(
                  (b) => b.category_id === cat.id && b.month_key === cat.one_time_month_key,
                );
                return (
                  <div key={cat.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{cat.name}</p>
                      <p className="text-xs text-gray-400">
                        {cat.one_time_month_key ? getMonthLabel(cat.one_time_month_key) : ''}
                      </p>
                    </div>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={otb?.budget_usd ?? ''}
                      placeholder="TBD"
                      onChange={(e) =>
                        cat.one_time_month_key &&
                        updateOTBudget(
                          cat.one_time_month_key,
                          cat.id,
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-24 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      )}

      <BottomNav />
    </div>
  );
}
