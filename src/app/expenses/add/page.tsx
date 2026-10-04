'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import { MONTHS, getCurrentMonthKey } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import type { Category } from '@/types';
import { CheckCircle } from 'lucide-react';

export default function AddExpensePage() {
  return (
    <AuthGuard>
      <AddExpense />
    </AuthGuard>
  );
}

// Maps category type to Hebrew group label
function getGroupLabel(type: string): string {
  if (type === 'one_time') return 'חד פעמי';
  if (type === 'personal') return 'ביטוח בריאות';
  return 'שוטפות וקבועות';
}

function AddExpense() {
  const { userIdentifier } = useAuth();
  const router = useRouter();

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey());
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('categories').select('*').order('type').order('name').then(({ data }) => {
      if (data) setAllCategories(data);
    });
  }, []);

  // Filter and prepare categories for display
  const visibleCategories = allCategories.filter((cat) => {
    if (cat.type === 'one_time') return cat.one_time_month_key === monthKey;
    if (cat.type === 'personal') return cat.owner === userIdentifier;
    return true; // shared_fixed always shown
  });

  // Group categories
  const groups: { label: string; cats: Category[] }[] = [
    {
      label: 'שוטפות',
      cats: visibleCategories.filter(
        (c) => c.type === 'shared_fixed' && ['Groceries', 'Leisure (restaurants + shopping)'].some(n => c.name.includes(n.split(' ')[0]))
      ),
    },
    {
      label: 'קבועות',
      cats: visibleCategories.filter(
        (c) => c.type === 'shared_fixed' && !['Groceries', 'Leisure (restaurants + shopping)'].some(n => c.name.includes(n.split(' ')[0]))
      ),
    },
    {
      label: 'ביטוח בריאות',
      cats: visibleCategories.filter((c) => c.type === 'personal'),
    },
    {
      label: 'חד פעמי',
      cats: visibleCategories.filter((c) => c.type === 'one_time'),
    },
  ].filter((g) => g.cats.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !amount || !userIdentifier) return;

    setSubmitting(true);
    setError('');

    const { error: err } = await supabase.from('expenses').insert({
      category_id: categoryId,
      month_key: monthKey,
      amount_usd: parseFloat(amount),
      description: description.trim() || null,
      entered_by: userIdentifier,
    });

    if (err) {
      setError(err.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 pb-24">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
          <p className="font-semibold text-gray-800 dark:text-gray-100">ההוצאה נוספה!</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">חוזר לדשבורד...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <header className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40 px-4 py-3">
        <h1 className="font-bold text-gray-800 dark:text-gray-100 text-center">הוסף הוצאה</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Month */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">חודש</label>
            <select
              value={monthKey}
              onChange={(e) => { setMonthKey(e.target.value); setCategoryId(''); }}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MONTHS.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Category - grouped */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">קטגוריה</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">בחר קטגוריה...</option>
              {groups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.cats.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">סכום (USD $)</label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0.00"
                className="w-full px-3 py-2.5 pr-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">תיאור (אופציונלי)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='למשל: קניות שבועיות'
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors"
          >
            {submitting ? 'מוסיף...' : 'הוסף הוצאה'}
          </button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}
