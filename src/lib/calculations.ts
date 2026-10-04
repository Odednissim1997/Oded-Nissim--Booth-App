import type { Category, Expense, MonthSplit, OneTimeBudget, Settings, MonthlyBudgetSummary, UserMonthlyTotal } from '@/types';

export function getCategoryBudget(
  category: Category,
  monthKey: string,
  oneTimeBudgets: OneTimeBudget[],
): number {
  if (category.type === 'one_time') {
    if (category.one_time_month_key !== monthKey) return 0;
    const otb = oneTimeBudgets.find(
      (b) => b.category_id === category.id && b.month_key === monthKey,
    );
    return otb?.budget_usd ?? 0;
  }
  return category.monthly_budget_usd ?? 0;
}

export function getUserShare(
  budget: number,
  user: 'oded' | 'tomer',
  category: Category,
  split: MonthSplit,
): number {
  if (category.type === 'personal') {
    return category.owner === user ? budget : 0;
  }
  const pct = user === 'oded' ? split.oded_pct : split.tomer_pct;
  return budget * pct;
}

export function getUserExpenses(
  expenses: Expense[],
  user: 'oded' | 'tomer',
  category: Category,
  split: MonthSplit,
): number {
  const total = expenses.reduce((sum, e) => sum + e.amount_usd, 0);
  if (category.type === 'personal') {
    return category.owner === user ? total : 0;
  }
  const pct = user === 'oded' ? split.oded_pct : split.tomer_pct;
  return total * pct;
}

export function buildMonthSummaries(
  categories: Category[],
  expenses: Expense[],
  split: MonthSplit,
  settings: Settings,
  monthKey: string,
  oneTimeBudgets: OneTimeBudget[],
): MonthlyBudgetSummary[] {
  const rate = settings.usd_to_ils;

  return categories
    .filter((cat) => {
      if (cat.type === 'one_time') return cat.one_time_month_key === monthKey;
      return true;
    })
    .map((cat) => {
      const budget_usd = getCategoryBudget(cat, monthKey, oneTimeBudgets);
      const catExpenses = expenses.filter(
        (e) => e.category_id === cat.id && e.month_key === monthKey,
      );
      const actual_usd = catExpenses.reduce((sum, e) => sum + e.amount_usd, 0);
      const remaining_usd = budget_usd - actual_usd;
      const pct_used = budget_usd > 0 ? (actual_usd / budget_usd) * 100 : 0;

      return {
        category: cat,
        budget_usd,
        actual_usd,
        remaining_usd,
        pct_used,
        budget_ils: budget_usd * rate,
        actual_ils: actual_usd * rate,
      };
    });
}

export function buildUserTotals(
  summaries: MonthlyBudgetSummary[],
  split: MonthSplit,
  settings: Settings,
): UserMonthlyTotal[] {
  const rate = settings.usd_to_ils;

  const calcForUser = (user: 'oded' | 'tomer'): UserMonthlyTotal => {
    let budget_usd = 0;
    let actual_usd = 0;

    for (const s of summaries) {
      budget_usd += getUserShare(s.budget_usd, user, s.category, split);
      actual_usd += getUserShare(s.actual_usd, user, s.category, split);
    }

    return {
      user,
      budget_usd,
      actual_usd,
      budget_ils: budget_usd * rate,
      actual_ils: actual_usd * rate,
    };
  };

  return [calcForUser('oded'), calcForUser('tomer')];
}

export function fmt$(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function fmtILS(amount: number): string {
  return `₪${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function fmtBoth(usd: number, rate: number): string {
  return `${fmt$(usd)} / ${fmtILS(usd * rate)}`;
}
