import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import SuburbSearchInput from '@/components/dashboard/SuburbSearchInput';
import type { UnifiedSuburbResult } from '@/utils/suburbSearch';
import { useMapFilters, type DataType } from '@/stores/mapFiltersStore';
import { cn } from '@/lib/utils';

interface Props {
  /** Optional callback after a result is selected (in addition to flying the map). */
  onSelect?: (result: UnifiedSuburbResult) => void;
  className?: string;
}

const CATEGORY_CHIPS: { value: DataType; label: string }[] = [
  { value: 'all', label: 'ALL' },
  { value: 'incident', label: 'INCIDENT' },
  { value: 'infrastructure', label: 'INFRA' },
  { value: 'utility', label: 'UTILITY' },
  { value: 'community', label: 'COMMUNITY' },
];

/**
 * Floating tactical search overlay anchored to the top of the map canvas.
 * Lives INSIDE <MapContainer> so it has access to `useMap()` for fly-to.
 *
 * Phase B: now writes to the global mapFilters store (query + category)
 * so layers can react to keyword/category changes in real-time.
 */
const MapSearchOverlay = ({ onSelect, className }: Props) => {
  const map = useMap();
  const { dataType, setDataType, setQuery } = useMapFilters();

  // Stop Leaflet from hijacking pointer/scroll events on the overlay
  useEffect(() => {
    const el = document.querySelector<HTMLDivElement>('[data-map-search-overlay]');
    if (!el) return;
    const L = (window as any).L;
    if (L?.DomEvent) {
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);
    }
  }, []);

  const handleSelect = (r: UnifiedSuburbResult) => {
    if (r.coordinates) {
      map.flyTo([r.coordinates.lat, r.coordinates.lng], 14, { duration: 0.8 });
    }
    setQuery(r.name ?? '');
    onSelect?.(r);
  };

  return (
    <div
      data-map-search-overlay
      className={
        'absolute top-3 left-1/2 -translate-x-1/2 z-[1000] w-[min(520px,calc(100%-96px))] ' +
        (className ?? '')
      }
      role="search"
    >
      <div className="bg-black/85 backdrop-blur border border-[#1A1A1A] hover:border-[#7C3AED]/40 focus-within:border-[#7C3AED]/60 transition-colors">
        <div className="flex items-center justify-between px-2 pt-1.5">
          <span className="font-mono text-[9px] tracking-[0.2em] text-[#7C3AED]/80">
            GLOBAL_SEARCH
          </span>
          <span className="font-mono text-[8px] tracking-[0.2em] text-[#555]">
            SUBURB · WARD · COORDS · KEYWORD
          </span>
        </div>
        <SuburbSearchInput
          onSelect={handleSelect}
          placeholder="Type suburb, ward, coordinates, or keyword…"
          className="px-1 pb-1"
        />
        {/* Category chips — write to global filter store */}
        <div className="flex items-center gap-px bg-[#0A0A0A] border-t border-[#1A1A1A] p-px overflow-x-auto">
          {CATEGORY_CHIPS.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setDataType(chip.value)}
              className={cn(
                'shrink-0 px-2 py-1 font-mono text-[9px] tracking-[0.15em] transition-colors',
                dataType === chip.value
                  ? 'bg-[#7C3AED]/15 text-[#7C3AED]'
                  : 'text-[#666] hover:text-[#aaa] hover:bg-[#151515]'
              )}
              aria-pressed={dataType === chip.value}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapSearchOverlay;
