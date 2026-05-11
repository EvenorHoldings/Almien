/**
 * MapFilterBar — Phase B
 *
 * Tactical filter row exposed inside the left panel. Writes to
 * `useMapFilters`. Layers read the same store and decide what to render.
 *
 * Obsidian Tactical: square borders, mono micro-labels, signal-green
 * for active selections.
 */

import { useMapFilters, type TimeRange, type SeverityLevel, type DataType } from '@/stores/mapFiltersStore';
import { cn } from '@/lib/utils';

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '1h', label: '1H' },
  { value: '6h', label: '6H' },
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
];

const SEVERITIES: { value: SeverityLevel; label: string }[] = [
  { value: 'all', label: 'ALL' },
  { value: 'low', label: 'LOW' },
  { value: 'medium', label: 'MED' },
  { value: 'high', label: 'HIGH' },
  { value: 'critical', label: 'CRIT' },
];

const DATA_TYPES: { value: DataType; label: string }[] = [
  { value: 'all', label: 'ALL' },
  { value: 'incident', label: 'INCIDENT' },
  { value: 'infrastructure', label: 'INFRA' },
  { value: 'utility', label: 'UTILITY' },
  { value: 'community', label: 'COMMUNITY' },
];

const Segment = <T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) => (
  <div>
    <div className="font-mono text-[8px] tracking-[0.25em] text-[#555] mb-1">{label}</div>
    <div className="grid grid-flow-col auto-cols-fr gap-px bg-[#0F0F0F] border border-[#1A1A1A] p-px">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-1.5 py-1 font-mono text-[9px] tracking-[0.15em] transition-colors',
            value === opt.value
              ? 'bg-[#7C3AED]/15 text-[#7C3AED]'
              : 'text-[#666] hover:text-[#aaa] hover:bg-[#151515]'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const MapFilterBar = () => {
  const { timeRange, severity, dataType, setTimeRange, setSeverity, setDataType, reset } = useMapFilters();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] tracking-[0.25em] text-[#7C3AED]/80">FILTERS</span>
        <button
          onClick={reset}
          className="font-mono text-[8px] tracking-[0.2em] text-[#555] hover:text-[#7C3AED] transition-colors"
        >
          RESET
        </button>
      </div>
      <Segment label="TIME_RANGE" value={timeRange} options={TIME_RANGES} onChange={setTimeRange} />
      <Segment label="SEVERITY" value={severity} options={SEVERITIES} onChange={setSeverity} />
      <Segment label="DATA_TYPE" value={dataType} options={DATA_TYPES} onChange={setDataType} />
    </div>
  );
};

export default MapFilterBar;
