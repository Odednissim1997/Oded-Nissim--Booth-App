'use client';
import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import { MONTHS, getMonthLabel } from '@/lib/constants';
import type { Settings, MonthSplit, Category, OneTimeBudget } from '@/types';
import { Save, Plus, Trash2 } from 'lucide-react';

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

  // New category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'shared_fixed' | 'personal' | 'one_time'>('shared_fixed');
  const [newCatOwner, setNewCatOwner] = useState<'oded' | 'tomer' | 'shared'>('shared');
  const [newCatBudget, setNewCatBudget] = useState('');
  const [newCatMonth, setNewCatMonth] = useState('');
  const [addingCat, setAddingCat] = useState(false);

  // New month form
  const [newMonthKey, setNewMonthKey] = useState('');
  const [newMonthOded, setNewMonthOded] = useState(50);
  const [addingMonth, setAddingMonth] = useState(false);

  // All months (default + custom from DB)
  const defaultMonthKeys = MONTHS.map((m) => m.key);
  const customSplits = splits.filter((s) => !defaultMonthKeys.includes(s.month_key));
  const allMonthKeys = Array.from(new Set([...defaultMonthKeys, ...splits.map((s) => s.month_key)])).sort();

  const formatMonthLabel = (key: string) => {
    const found = MONTHS.find((m) => m.key === key);
    if (found) return found.label;
    const [yr, mo] = key.split('-');
    const d = new Date(parseInt(yr), parseInt(mo) - 1);
    return d.toLocaleDateString('he-IL', { month: 'short', year: 'numeric' });
  };

  useEffect(() => {
    Promise.all([
      supabase.from('settings').select('*').single(),
      supabase.from('month_splits').select('*').order('month_key'),
      supabase.from('categories').select('*').order('type').order('name'),
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
      supabase.from('settings').upsert({ id: 1, usd_to_ils: settings.usd_to_ils, updated_at: new Date().toISOString() }),
      ...splits.map((s) =>
        supabase.from('month_splits').upsert({ month_key: s.month_key, oded_pct: s.oded_pct, tomer_pct: 1 - s.oded_pct })
      ),
      ...oneTimeBudgets.map((b) =>
        supabase.from('one_time_budgets').upsert({ month_key: b.month_key, category_id: b.category_id, budget_usd: b.budget_usd })
      ),
      ...categories.filter(c => c.type !== 'one_time').map((c) =>
        supabase.from('categories').update({ monthly_budget_usd: c.monthly_budget_usd }).eq('id', c.id)
      ),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSplit = (monthKey: string, pct: number) => {
    setSplits((prev) => {
      const exists = prev.find((s) => s.month_key === monthKey);
      if (exists) return prev.map((s) => s.month_key === monthKey ? { ...s, oded_pct: pct, tomer_pct: 1 - pct } : s);
      return [...prev, { month_key: monthKey, oded_pct: pct, tomer_pct: 1 - pct }];
    });
  };

  const updateCatBudget = (id: string, budget: number) => {
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, monthly_budget_usd: budget } : c));
  };

  const updateOTBudget = (monthKey: string, catId: string, budget: number) => {
    setOneTimeBudgets((prev) => {
      const exists = prev.find((b) => b.month_key === monthKey && b.category_id === catId);
      if (exists) return prev.map((b) => b.month_key === monthKey && b.category_id === catId ? { ...b, budget_usd: budget } : b);
      return [...prev, { month_key: monthKey, category_id: catId, budget_usd: budget }];
    });
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setAddingCat(true);
    const payload: Record<string, unknown> = {
      name: newCatName.trim(),
      type: newCatType,
      owner: newCatType === 'personal' ? newCatOwner : 'shared',
      monthly_budget_usd: newCatType !== 'one_time' ? parseFloat(newCatBudget) || null : null,
      one_time_month_key: newCatType === 'one_time' ? newCatMonth || null : null,
    };
    const { data } = await supabase.from('categories').insert(payload).select().single();
    if (data) {
      setCategories((prev) => [...prev, data]);
      if (newCatType === 'one_time' && newCatMonth) {
        await supabase.from('one_time_budgets').insert({
          month_key: newCatMonth,
          category_id: data.id,
          budget_usd: parseFloat(newCatBudget) || null,
        });
        setOneTimeBudgets((prev) => [...prev, { month_key: newCatMonth, category_id: data.id, budget_usd: parseFloat(newCatBudget) || null }]);
      }
    }
    setNewCatName('');
    setNewCatBudget('');
    setNewCatMonth('');
    setAddingCat(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('למחוק קטגוריה זו? כל ההוצאות הקשורות אליה יימחקו גם.')) return;
    await supabase.from('categories').delete().eq('id', id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddMonth = async () => {
    if (!newMonthKey.match(/^\d{4}-\d{2}$/)) return;
    setAddingMonth(true);
    const oded = newMonthOded / 100;
    await supabase.from('month_splits').upsert({ month_key: newMonthKey, oded_pct: oded, tomer_pct: 1 - oded });
    setSplits((prev) => {
      const exists = prev.find((s) => s.month_key === newMonthKey);
      if (exists) return prev.map((s) => s.month_key === newMonthKey ? { ...s, oded_pct: oded, tomer_pct: 1 - oded } : s);
      return [...prev, { month_key: newMonthKey, oded_pct: oded, tomer_pct: 1 - oded }];
    });
    setNewMonthKey('');
    setNewMonthOded(50);
    setAddingMonth(false);
  };

  const sharedFixedCats = categories.filter((c) => c.type === 'shared_fixed');
  const oneTimeCats = categories.filter((c) => c.type === 'one_time');
  const personalCats = categories.filter((c) => c.type === 'personal');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <header className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40 px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-gray-800 dark:text-gray-100">הגדרות</h1>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'שומר...' : saved ? 'נשמר ✓' : 'שמור הכל'}
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
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">שער חליפין</h2>
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
              <label className="text-sm text-gray-600 dark:text-gray-400">₪</label>
            </div>
          </section>

          {/* Monthly Splits */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">חלוקת עלויות לפי חודש</h2>
            <div className="space-y-3">
              {allMonthKeys.map((mk) => {
                const s = splits.find((sp) => sp.month_key === mk);
                const odenPct = s ? Math.round(s.oded_pct * 100) : 50;
                return (
                  <div key={mk} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 dark:text-gray-300 w-22 flex-shrink-0">{formatMonthLabel(mk)}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-10 text-right">O:{odenPct}%</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={odenPct}
                        onChange={(e) => updateSplit(mk, parseInt(e.target.value) / 100)}
                        className="flex-1 accent-blue-600"
                      />
                      <span className="text-xs text-gray-500 w-10">T:{100 - odenPct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add month */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">הוסף חודש (YYYY-MM)</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="2027-09"
                  value={newMonthKey}
                  onChange={(e) => setNewMonthKey(e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={newMonthOded}
                  onChange={(e) => setNewMonthOded(parseInt(e.target.value))}
                  className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
                >
                  {[30,40,50,60,70].map(v => <option key={v} value={v}>O:{v}%</option>)}
                </select>
                <button
                  onClick={handleAddMonth}
                  disabled={addingMonth || !newMonthKey.match(/^\d{4}-\d{2}$/)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* Monthly Fixed Budgets */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">תקציב חודשי ($)</h2>
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
              {personalCats.map((cat) => (
                <div key={cat.id} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{cat.name}</span>
                  <input
                    type="number"
                    step="0.01"
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
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">תקציב הוצאות חד פעמיות ($)</h2>
            <div className="space-y-3">
              {oneTimeCats.map((cat) => {
                const otb = oneTimeBudgets.find((b) => b.category_id === cat.id && b.month_key === cat.one_time_month_key);
                return (
                  <div key={cat.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{cat.name}</p>
                      <p className="text-xs text-gray-400">{cat.one_time_month_key ? formatMonthLabel(cat.one_time_month_key) : ''}</p>
                    </div>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={otb?.budget_usd ?? ''}
                      placeholder="TBD"
                      onChange={(e) =>
                        cat.one_time_month_key &&
                        updateOTBudget(cat.one_time_month_key, cat.id, parseFloat(e.target.value) || 0)
                      }
                      className="w-24 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {/* Add Category */}
          <section className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">הוסף קטגוריה חדשה</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="שם הקטגוריה"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <select
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value as 'shared_fixed' | 'personal' | 'one_time')}
                  className="flex-1 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                >
                  <option value="shared_fixed">משותף חודשי</option>
                  <option value="personal">אישי</option>
                  <option value="one_time">חד פעמי</option>
                </select>
                {newCatType === 'personal' && (
                  <select
                    value={newCatOwner}
                    onChange={(e) => setNewCatOwner(e.target.value as 'oded' | 'tomer')}
                    className="flex-1 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="oded">Oded</option>
                    <option value="tomer">Tomer</option>
                  </select>
                )}
              </div>
              <div className="flex gap-2">
                {newCatType !== 'one_time' && (
                  <input
                    type="number"
                    placeholder="תקציב חודשי $"
                    value={newCatBudget}
                    onChange={(e) => setNewCatBudget(e.target.value)}
                    className="flex-1 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  />
                )}
                {newCatType === 'one_time' && (
                  <>
                    <select
                      value={newCatMonth}
                      onChange={(e) => setNewCatMonth(e.target.value)}
                      className="flex-1 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    >
                      <option value="">בחר חודש</option>
                      {allMonthKeys.map((mk) => (
                        <option key={mk} value={mk}>{formatMonthLabel(mk)}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="תקציב $"
                      value={newCatBudget}
                      onChange={(e) => setNewCatBudget(e.target.value)}
                      className="w-28 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </>
                )}
                <button
                  onClick={handleAddCategory}
                  disabled={addingCat || !newCatName.trim()}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  הוסף
                </button>
              </div>
            </div>

            {/* Category list with delete */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">קטגוריות קיימות</p>
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{cat.name}</span>
                    <span className="text-xs text-gray-400 mr-2">({cat.type})</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>

        </main>
      )}

      <BottomNav />
    </div>
  );
}
