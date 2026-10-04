interface ProgressBarProps {
  pct: number;
}

export default function ProgressBar({ pct }: ProgressBarProps) {
  const clamped = Math.min(pct, 100);
  const color =
    pct > 100
      ? 'bg-red-500'
      : pct >= 100
        ? 'bg-blue-500'
        : pct >= 75
          ? 'bg-yellow-400'
          : 'bg-gray-300 dark:bg-gray-500';

  return (
    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
