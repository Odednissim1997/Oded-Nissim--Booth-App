export type UserIdentifier = 'oded' | 'tomer';

export interface Settings {
  id: number;
  usd_to_ils: number;
  updated_at: string;
}

export interface MonthSplit {
  month_key: string;
  oded_pct: number;
  tomer_pct: number;
}

export type CategoryType = 'shared_fixed' | 'personal' | 'one_time';
export type CategoryOwner = 'oded' | 'tomer' | 'shared';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  owner: CategoryOwner;
  monthly_budget_usd: number | null;
  one_time_month_key: string | null;
}

export interface Expense {
  id: string;
  category_id: string;
  month_key: string;
  amount_usd: number;
  description: string | null;
  entered_by: string;
  created_at: string;
}

export interface OneTimeBudget {
  month_key: string;
  category_id: string;
  budget_usd: number | null;
}

export interface MonthlyBudgetSummary {
  category: Category;
  budget_usd: number;
  actual_usd: number;
  remaining_usd: number;
  pct_used: number;
  budget_ils: number;
  actual_ils: number;
}

export interface UserMonthlyTotal {
  user: UserIdentifier;
  budget_usd: number;
  actual_usd: number;
  budget_ils: number;
  actual_ils: number;
}
