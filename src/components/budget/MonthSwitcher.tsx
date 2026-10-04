'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTHS } from '@/lib/constants';

interface MonthSwitcherProps {
  currentKey: string;
  onChange: (key: string) => void;
}

export default function MonthSwitcher({ currentKey, onChange }: MonthSwitcherProps) {
  const idx = MONTHS.findIndex((m) => m.key === currentKey);
  const label = MONTHS[idx]?.label ?? currentKey;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => idx > 0 && onChange(MONTHS[idx - 1].key)}
        disabled={idx === 0}
        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>
      <span className="font-semibold text-gray-800 dark:text-gray-100 min-w-[90px] text-center text-sm">
        {label}
      </span>
      <button
        onClick={() => idx < MONTHS.length - 1 && onChange(MONTHS[idx + 1].key)}
        disabled={idx === MONTHS.length - 1}
        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
      >
        <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>
    </div>
  );
}
