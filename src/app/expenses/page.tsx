'use client';
import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import { MONTHS, getMonthLabel } from '@/lib/constants';
import { fmt$ } from '@/lib/calculations';
import type { Category, Expense } from '@/types';
import { Trash2 } from 'lucide-react';

export default function ExpensesPage() {
  return (
    <AuthGuard>
      <ExpenseHistory />
    </AuthGuard>
  );
}

function ExpenseHistory() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('expenses').select('*').order('created_at', { ascending: false });
    if (filterMonth) q = q.eq('month_key', filterMonth);
    if (filterCat) q = q.eq('category_id', filterCat);

    const { data } = await q;
    if (data) setExpenses(data);
    setLoading(false);
  }, [filterMonth, filterCat]);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    setDeleting(id);
    await supabase.from('expenses').delete().eq('id', id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setDeleting(null);
  };

  const getCatName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <header className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40 px-4 py-3">
        <h1 className="font-bold text-gray-800 dark:text-gray-100 text-center">Expense History</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All months</option>
            {MONTHS.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : expenses.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">No expenses found</p>
        ) : (
          <div className="space-y-2">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-gray-100 text-sm truncate">
                    {getCatName(exp.category_id)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {getMonthLabel(exp.month_key)} · by {exp.entered_by}
                  </p>
                  {exp.description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{exp.description}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{fmt$(exp.amount_usd)}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(exp.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(exp.id)}
                  disabled={deleting === exp.id}
                  className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
