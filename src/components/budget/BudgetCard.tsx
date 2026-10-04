import ProgressBar from './ProgressBar';
import { fmt$, fmtILS } from '@/lib/calculations';
import type { MonthlyBudgetSummary } from '@/types';

interface BudgetCardProps {
  summary: MonthlyBudgetSummary;
  rate: number;
}

export default function BudgetCard({ summary, rate }: BudgetCardProps) {
  const { category, budget_usd, actual_usd, remaining_usd, pct_used } = summary;

  const statusColor =
    pct_used > 100
      ? 'border-red-400 dark:border-red-600'
      : pct_used >= 80
        ? 'border-yellow-400 dark:border-yellow-500'
        : 'border-green-400 dark:border-green-600';

  const badge =
    category.type === 'personal'
      ? `Personal (${category.owner === 'oded' ? 'Oded' : 'Tomer'})`
      : category.type === 'one_time'
        ? 'One-Time'
        : 'Shared';

  return (
    <div
      className={`rounded-xl p-4 bg-white dark:bg-gray-800 border-2 ${statusColor} shadow-sm`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{category.name}</h3>
          <span className="text-xs text-gray-400 dark:text-gray-500">{badge}</span>
        </div>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            pct_used > 100
              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
              : pct_used >= 80
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
          }`}
        >
          {pct_used.toFixed(0)}%
        </span>
      </div>

      <ProgressBar pct={pct_used} />

      <div className="mt-3 grid grid-cols-3 gap-1 text-center text-xs">
        <div>
          <p className="text-gray-500 dark:text-gray-400">Budget</p>
          <p className="font-medium text-gray-800 dark:text-gray-100">{fmt$(budget_usd)}</p>
          <p className="text-gray-400 dark:text-gray-500">{fmtILS(budget_usd * rate)}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Spent</p>
          <p className="font-medium text-gray-800 dark:text-gray-100">{fmt$(actual_usd)}</p>
          <p className="text-gray-400 dark:text-gray-500">{fmtILS(actual_usd * rate)}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Left</p>
          <p
            className={`font-medium ${remaining_usd < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'}`}
          >
            {fmt$(remaining_usd)}
          </p>
          <p className="text-gray-400 dark:text-gray-500">{fmtILS(remaining_usd * rate)}</p>
        </div>
      </div>
    </div>
  );
}
