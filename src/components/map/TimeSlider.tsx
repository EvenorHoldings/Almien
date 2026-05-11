/**
 * TimeSlider — Phase C
 *
 * Bottom-of-map scrubber spanning the active TimeRange. Writes
 * `timeOffsetMs` to useMapFilters; layers can read it to filter
 * historical data. "LIVE" snaps the offset back to null.
 */

import { useEffect, useMemo, useRef } from 'react';
import { Play, Pause, Radio } from 'lucide-react';
import { useMapFilters, type TimeRange } from '@/stores/mapFiltersStore';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const RANGE_MS: Record<TimeRange, number> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

const formatOffset = (ms: number | null, range: TimeRange): string => {
  if (ms === null || ms === 0) return 'LIVE';
  const abs = Math.abs(ms);
  if (range === '1h' || range === '6h') return `-${Math.round(abs / 60000)}m`;
  if (range === '24h') return `-${Math.round(abs / 3600000)}h`;
  return `-${Math.round(abs / 86400000)}d`;
};

const TimeSlider = () => {
  const { timeRange, timeOffsetMs, playing, setTimeOffsetMs, setPlaying } = useMapFilters();
  const totalMs = RANGE_MS[timeRange];
  const rafRef = useRef<number | null>(null);

  // sliderValue: 0..1000 where 1000 = now (live), 0 = oldest
  const sliderValue = useMemo(() => {
    if (timeOffsetMs === null) return 1000;
    const pct = 1 - Math.min(1, Math.abs(timeOffsetMs) / totalMs);
    return Math.round(pct * 1000);
  }, [timeOffsetMs, totalMs]);

  const handleChange = (vals: number[]) => {
    const v = vals[0];
    if (v >= 1000) {
      setTimeOffsetMs(null);
      return;
    }
    const offset = -((1000 - v) / 1000) * totalMs;
    setTimeOffsetMs(offset);
  };

  // Auto-play loop
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      // Advance ~5% of range per second
      const stepMs = (totalMs * dt) / 20000;
      const current = useMapFilters.getState().timeOffsetMs ?? -totalMs;
      const next = current + stepMs;
      if (next >= 0) {
        setTimeOffsetMs(null);
        setPlaying(false);
      } else {
        setTimeOffsetMs(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, totalMs, setTimeOffsetMs, setPlaying]);

  const isLive = timeOffsetMs === null;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-[1000] hidden md:block pointer-events-auto"
      style={{ bottom: 56, width: 'min(560px, 70%)' }}
    >
      <div className="bg-black/90 backdrop-blur-md border border-[#1A1A1A] px-3 py-2 flex items-center gap-3">
        <button
          onClick={() => {
            if (isLive) setTimeOffsetMs(-totalMs * 0.5);
            setPlaying(!playing);
          }}
          aria-label={playing ? 'Pause time scrubber' : 'Play time scrubber'}
          className="p-1.5 border border-[#1A1A1A] hover:border-[#7C3AED]/50 transition-colors text-[#7C3AED]"
        >
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <div className="flex-1">
          <Slider
            value={[sliderValue]}
            min={0}
            max={1000}
            step={1}
            onValueChange={handleChange}
            aria-label="Time scrubber"
          />
        </div>

        <button
          onClick={() => {
            setTimeOffsetMs(null);
            setPlaying(false);
          }}
          className={cn(
            'flex items-center gap-1 px-2 py-1 font-mono text-[9px] tracking-[0.2em] border transition-colors',
            isLive
              ? 'border-[#7C3AED]/60 text-[#7C3AED] bg-[#7C3AED]/10'
              : 'border-[#1A1A1A] text-[#666] hover:text-[#aaa] hover:border-[#333]'
          )}
        >
          <Radio className={cn('w-3 h-3', isLive && 'animate-pulse')} />
          {formatOffset(timeOffsetMs, timeRange)}
        </button>
      </div>
    </div>
  );
};

export default TimeSlider;
