import { cn } from '@/lib/utils';

/** Marks a panel whose figures are illustrative, not live data. */
export default function DemoBadge({ className, label = 'Demo data' }: { className?: string; label?: string }) {
  return (
    <span
      title="Illustrative sample data — not live"
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 shrink-0',
        className,
      )}
    >
      ● {label}
    </span>
  );
}
