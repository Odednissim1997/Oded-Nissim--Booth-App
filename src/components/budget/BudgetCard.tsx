import ProgressBar from './ProgressBar';
import { fmt$, fmtILS } from '@/lib/calculations';
import type { MonthlyBudgetSummary } from '@/types';

interface BudgetCardProps {
  summary: MonthlyBudgetSummary;
  rate: number;
}

export default function BudgetCard({ summary, rate }: BudgetCardProps) {
  const { category, budget_usd, actual_usd, remaining_usd, pct_used } = summary;

  const borderColor =
    pct_used > 100
      ? 'border-red-400 dark:border-red-600'
      : pct_used >= 100
        ? 'border-blue-400 dark:border-blue-500'
        : pct_used >= 75
          ? 'border-yellow-400 dark:border-yellow-500'
          : 'border-gray-200 dark:border-gray-600';

  const badge =
    category.type === 'personal'
      ? `אישי (${category.owner === 'oded' ? 'Oded' : 'Tomer'})`
      : category.type === 'one_time'
        ? 'חד פעמי'
        : 'משותף';

  const badgeColor =
    pct_used > 100
      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      : pct_used >= 100
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
        : pct_used >= 75
          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400';

  return (
    <div className={`rounded-xl p-4 bg-white dark:bg-gray-800 border-2 ${borderColor} shadow-sm`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{category.name}</h3>
          <span className="text-xs text-gray-400 dark:text-gray-500">{badge}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
          {budget_usd > 0 ? `${pct_used.toFixed(0)}%` : '—'}
        </span>
      </div>

      <ProgressBar pct={pct_used} />

      <div className="mt-3 grid grid-cols-3 gap-1 text-center text-xs">
        <div>
          <p className="text-gray-500 dark:text-gray-400">תקציב</p>
          <p className="font-medium text-gray-800 dark:text-gray-100">{fmt$(budget_usd)}</p>
          <p className="text-gray-400 dark:text-gray-500">{fmtILS(budget_usd * rate)}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">בפועל</p>
          <p className="font-medium text-gray-800 dark:text-gray-100">{fmt$(actual_usd)}</p>
          <p className="text-gray-400 dark:text-gray-500">{fmtILS(actual_usd * rate)}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">נותר</p>
          <p className={`font-medium ${remaining_usd < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'}`}>
            {fmt$(remaining_usd)}
          </p>
          <p className="text-gray-400 dark:text-gray-500">{fmtILS(remaining_usd * rate)}</p>
        </div>
      </div>
    </div>
  );
}
