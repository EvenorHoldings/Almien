/**
 * LiveModeToggle — Phase B
 *
 * Tactical pill that toggles the global live ticker. When on, components
 * subscribed to `live:tick` (markers, mini-map, alert feed) refresh.
 */

import { Radio } from 'lucide-react';
import { useLiveMode } from '@/stores/liveModeStore';
import { cn } from '@/lib/utils';

const LiveModeToggle = ({ className }: { className?: string }) => {
  const { enabled, toggle } = useLiveMode();
  return (
    <button
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? 'Disable live mode' : 'Enable live mode'}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 border font-mono text-[10px] tracking-[0.15em] uppercase transition-colors',
        enabled
          ? 'bg-[#7C3AED]/10 border-[#7C3AED]/60 text-[#7C3AED]'
          : 'bg-black/80 border-[#1A1A1A] text-[#666] hover:text-[#999] hover:border-[#333]',
        className
      )}
    >
      <Radio
        className={cn('w-3 h-3', enabled && 'animate-pulse')}
        aria-hidden="true"
      />
      <span>{enabled ? 'LIVE' : 'OFFLINE'}</span>
    </button>
  );
};

export default LiveModeToggle;
